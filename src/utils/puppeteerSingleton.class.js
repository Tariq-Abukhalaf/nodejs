const puppeteerExtra             = require("puppeteer-extra");
const stealthPlugin              = require("puppeteer-extra-plugin-stealth");
const chromium                   = require("@sparticuz/chromium");

puppeteerExtra.use(stealthPlugin());

class puppeteerSingleton 
{
  constructor() 
  {
    if (!puppeteerSingleton.instance) 
    {
      console.log("puppeteerSingleton constructor activated!");
      puppeteerSingleton.instance = this;
      this.browser = null;
      this.tabs = [];
    }
    return puppeteerSingleton.instance;
  }

  async createBrowser() 
  {
    if (!this.browser) 
    {
      this.browser = await puppeteerExtra.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        // headless: chromium.headless,
        headless: false,
        ignoreHTTPSErrors: true,
      });
    }
    return this.browser;
  }

  async createNewTab() 
  {
    const browser = await this.createBrowser();
    const page = await browser.newPage();
    this.tabs.push(page);
    return page;
  }

  async closeTab(page) 
  {
    if (this.tabs.includes(page)) 
    {
      await page.close();
      this.tabs = this.tabs.filter(tab => tab !== page);
    }
  }

  async getAllTabs() 
  {
    if (this.tabs){
      return this.tabs.map(tab => tab.url());
    }
  }

  async closeBrowser() 
  {
    if (this.browser) 
    {
      for (const tab of this.tabs) {
        await tab.close();
      }
      // await this.browser.close();
      this.browser = null;
      this.tabs = [];
    }
  }
}

module.exports = puppeteerSingleton;