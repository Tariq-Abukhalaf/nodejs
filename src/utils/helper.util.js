// const puppeteerExtra                                   = require("puppeteer-extra");
// const stealthPlugin                                    = require("puppeteer-extra-plugin-stealth");
// const chromium                                         = require("@sparticuz/chromium");

const puppeteerSingleton                               = require('../utils/puppeteerSingleton.class');


const { PutObjectCommand, S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl }                                 = require("@aws-sdk/s3-request-presigner");
const axios                                            = require('axios');
const path                                             = require('path');
const sharp                                            = require('sharp');
const fs                                               = require('fs').promises;

require('dotenv').config();
// puppeteerExtra.use(stealthPlugin());

async function resizeImage(path,width,height) {
  try {
    const image = await fs.readFile(path);
    return await sharp(image).resize(width,height).toBuffer();
  } catch (err) {
    console.error('Error resizing image:', err);
  }
}

async function scaleImage(path,width,height) {
  try {
    const image        = await fs.readFile(path);
    const {data, info} = await sharp(image).resize({
      width: width,
      height: height,
      fit: 'inside',
    }).toBuffer({ resolveWithObject: true });
    return {
      buffer:data,
      info:info
    };
  } catch (err) {
    console.error('Error scaleImage image:', err);
  }
}

async function crop(path,width,height)
{
  /**
   * always start from left top corner
   */
  try {
    const left   = 0;
    const top    = 0;
    const image    = await fs.readFile(path);
    const metadata = await sharp(image).metadata();
    if (width > metadata.width){ width = metadata.width; }
    if (height > metadata.height){ height = metadata.height; }
    return await sharp(image).extract({ left, top, width, height }).toBuffer();
  }catch (err) {
    console.error('Error crop image:', err);
  }
}

async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    console.error(`Error deleting file ${filePath}: ${err}`);
    return false;
  }
}

// async function takeScreenshot(url,width,height)
// {
//   const browser = await puppeteerExtra.launch({
//     args: chromium.args,
//     defaultViewport: chromium.defaultViewport,
//     executablePath: await chromium.executablePath(),
//     headless: chromium.headless,
//     ignoreHTTPSErrors: true,
//   });
//   try {
//     const page       = await browser.newPage();
//     await page.goto(url,{ waitUntil: 'networkidle0' });
//     const screenshotPath = path.join('src/screenshots', `screenshot_${Date.now()}.jpg`);
//     await page.screenshot({ path:screenshotPath, fullPage: true });
//     const scaleImageObj = await scaleImage(screenshotPath,width,height);
//     if (!scaleImageObj.buffer){
//         return false
//     }
//     const pages = await browser.pages();
//     await Promise.all(pages.map( async (page) => page.close()));
//     await browser.close();
//     /**
//      * delete the image from local
//      */
//     await deleteFile(screenshotPath);
//     return scaleImageObj;
//   } catch (error) {
//     console.error('An error occurred:', error);
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// }


async function takeScreenshot(url,width,height)
{
  const pSingleton = new puppeteerSingleton();
  const page = await pSingleton.createNewTab();
  await page.goto(url,{ waitUntil: 'networkidle0' });
  const screenshotPath = path.join('src/screenshots', `screenshot_${Date.now()}.png`);
  await page.screenshot({ path:screenshotPath, fullPage: true });
  const scaleImageObj = await scaleImage(screenshotPath,width,height);
  if (!scaleImageObj.buffer){
    return false;
  }
  await pSingleton.closeTab(page);
  /**
  * delete the image from local
  */
  await deleteFile(screenshotPath);
  return scaleImageObj;
}

async function uploadScreenshot(screenshot)
{
  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials:{ 
      accessKeyId: process.env.AWS_ACCESS_KEY, 
      secretAccessKey:  process.env.AWS_SECRET_KEY 
    },
  });
  const params = {
    Bucket          : process.env.AWS_BUCKET,
    Key             : `screenshot_${Date.now()}.jpg`,
    Body            : screenshot,
    ACL             : 'public-read',
    ContentEncoding : 'base64',
    ContentType     : 'image/png',
  };
  const command  = new PutObjectCommand(params);
  const response = await client.send(command);
  return await getSignedUrl(client, new GetObjectCommand(params), { expiresIn: 24 * 60 * 60 }); // 24 hour
  //https://net5-storage.s3.us-east-1.amazonaws.com/screenshot_1695278015545.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIATSPCKKLTPTBOUA5O%2F20230921%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230921T063337Z&X-Amz-Expires=86400&X-Amz-Signature=c185374aceb45dd6e0348ac62516d1117c09d241c835c18be79e8d34dd2ad21c&X-Amz-SignedHeaders=host&x-id=GetObject
  // return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
}

async function triggerURL(url) {
  try{
    const config = {
      method: 'get',
      url: url,
      timeout: 10000, // wait for 10s then timeout
      headers: { 
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json',
      },
    }
    const response = await axios(config)
    return response.status;
  }catch(e){
    return false;
  }
}

function isValidHttpUrl(str) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', // fragment locator
    'i'
  );
  return pattern.test(str);
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}

function isPositive(num) {
  if (typeof num === 'number' && Math.sign(num) === 1) {
    return true;
  }
  return false;
}

function isNegative(num) {
  if (typeof num === 'number' && Math.sign(num) === -1) {
    return true;
  }
  return false;
}

module.exports = {
  isValidHttpUrl,
  takeScreenshot,
  uploadScreenshot,
  triggerURL,
  formatFileSize,
  isPositive,
  isNegative,
}
