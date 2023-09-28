const axios        = require('axios');
const server       = require('../utils/server.class');
const {isNegative} = require('../utils/helper.util');

async function adjustServers(serverObj,queueLength, existingServers) 
{
  const queueLengthPerServer = 5;
  const totalServersNeeded   = Math.ceil(queueLength / queueLengthPerServer);
  const serversDifference    = existingServers - totalServersNeeded;
  if (serversDifference > 0) {
    await serverObj.terminateRandomInstance();
  } else if (serversDifference < 0) {
    /**
     * 
     * Instance Type: t4g.medium
     * vCPUs: 2
     * Memory: 4 GB
     * ARM-based (Graviton2)
     * 
     * This instance type should be suitable for running a Node.js server alongside Puppeteer for taking screenshots of web pages. 
     * It offers a decent amount of CPU and memory resources to handle both tasks effectively. 
     * 
     */
    // await serverObj.launchNewInstance('slave','t4g.medium','ami-0ef131350923f509a');
    await serverObj.launchNewInstance('slave','t4g.small','ami-021c43719db144939');
  } else {
    console.log("No server adjustments needed.");
  }
}

async function getQueueLength(queueName)
{
  const rabbitmqHost     = process.env.RMQ_HOST;
  const rabbitmqUsername = process.env.RMQ_USERNAME;
  const rabbitmqPassword = process.env.RMQ_PASSWORD;
  const rabbitmqIntPort  = process.env.RMQ_INT_PORT;
  const vhost            = encodeURIComponent('/');

  const rabbitmqApiBaseUrl = `http://${rabbitmqHost}:${rabbitmqIntPort}/api`;
  const cipher             = Buffer.from(`${rabbitmqUsername}:${rabbitmqPassword}`).toString('base64');
  const config = {
    method: 'get',
    url: `${rabbitmqApiBaseUrl}/queues/${vhost}/${queueName}`,
    timeout: 5000,
    headers: { 
      'Authorization': `Basic ${cipher}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    },
  }
  try {
    const response = await axios(config);
    if (response.status === 200) {
      const queueInfo = response.data;
      const queueLength = queueInfo.messages;
      console.log(`Queue Length for ${queueName}: ${queueLength}`);
      const serverObj = new server('us-east-1');
      const list = await serverObj.listRunningSlaveInstances();
      const numberOfInstance = list.length;
      console.log(`EC2 instances (running && slave) : ${numberOfInstance}`);
      await adjustServers(serverObj,queueLength, numberOfInstance)
      console.log('-'.repeat(50));
    }else {
      console.error('Failed to fetch queue information');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Linux instances are frequently ready 60-90 seconds after launch. Windows instances take considerably longer.
 */
function set_minutes(m)
{
  let minutes;
  (m<2) ? minutes=2 : minutes=m;
  const intervalInMilliseconds = minutes * 60 * 1000;
  return intervalInMilliseconds;
}

const mins = set_minutes(2);
setInterval(getQueueLength,mins ,'jobs_events');



