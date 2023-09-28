const amqp                = require('amqplib');
const { client,ObjectId } = require('../services/db.service');

async function toQueue(jobId) {
  try {
    const db = client.db(process.env.MONGO_DATABASE);
    const collection = db.collection('jobs');
    const doc = await collection.findOne({
      _id: new ObjectId(jobId),
      status: 'waiting',
    });
    if (doc) {
      const rabbitmqHost     = process.env.RMQ_HOST;
      const rabbitmqUsername = process.env.RMQ_USERNAME;
      const rabbitmqPassword = process.env.RMQ_PASSWORD;
      const rabbitmqPort     = process.env.RMQ_PORT;
      const connectionURL    = `amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}:${rabbitmqPort}`;
      const connection = await amqp.connect(connectionURL);
      const channel    = await connection.createChannel();
      const queue         = 'jobs_events';
      const retryQueue    = 'jobs_events_retry';
      const exchange      = 'jobs_events_exchange';
      const retryExchange = 'jobs_events_exchange_retry';
      const retryTimeSec  = 5;
      await channel.assertExchange(exchange, 'direct');
      await channel.assertExchange(retryExchange, 'direct');
      await channel.assertQueue(queue, { durable: false, arguments: { 'x-dead-letter-exchange': retryExchange } });
      await channel.assertQueue(retryQueue, { durable: false, arguments: { 'x-message-ttl': retryTimeSec * 1000, 'x-dead-letter-exchange': exchange } });
      await channel.bindQueue(queue, exchange);
      await channel.bindQueue(retryQueue, retryExchange);
      // Update MongoDB document status
      await collection.updateOne(
        { _id: new ObjectId(jobId), status: 'waiting' },
        { $set: 
            { status: 'queued' } 
        }
      );
      // Publish the message
      const message = JSON.stringify(doc);
      channel.publish(exchange, '', Buffer.from(message));
      await channel.close();
      await connection.close();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

module.exports = {
  toQueue
};

