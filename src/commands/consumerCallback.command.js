const amqp                = require('amqplib');
const { client,ObjectId } = require('../services/db.service');
const { triggerURL }      = require('../utils/helper.util');

(async function() {
  try {
    const rabbitmqHost     = process.env.RMQ_HOST;
    const rabbitmqUsername = process.env.RMQ_USERNAME;
    const rabbitmqPassword = process.env.RMQ_PASSWORD;
    const rabbitmqPort     = process.env.RMQ_PORT;
    const connectionURL    = `amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}:${rabbitmqPort}`;
    const connection = await amqp.connect(connectionURL);
    const channel    = await connection.createChannel();
    const queue      = 'callback';
    const db         = client.db(process.env.MONGO_DATABASE);
    await channel.prefetch(parseInt(process.env.RMQ_PREFETCH));
    const callback = async (msg) => {
      try {
        let processSuccess = true;
        const json = JSON.parse(msg.content.toString());
        console.table(json);
        /**
         * callback axios
         */
        const status  = await triggerURL(json.callback);
        if (status == 200){
            await db.collection('callback').updateOne(
                { _id: new ObjectId(json._id) },
                { $set: 
                    { callbackTriggerd : true } 
                }
            );
        }else{
            processSuccess = false;
        }
        if (processSuccess) 
        {
            await db.collection('callback').updateOne(
                { _id: new ObjectId(json._id), status: 'queued' },
                { $set: 
                    { status: 'success' } 
                }
            );
            channel.ack(msg);
            console.log(`${json._id} - ACK`);
        } else {
            let failed = false;
            if (msg.properties.headers && msg.properties.headers['x-death']) {
                const count = msg.properties.headers['x-death'][0].count;
                if (count > 4) {
                    failed = true;
                }
            }
            if (!failed) {
                // Return the message to the queue
                channel.nack(msg, false, false);
                console.log(`${json._id} - NACK`);
            } else {
                await db.collection('callback').updateOne(
                    { _id: new ObjectId(json._id), status: 'queued' },
                    { $set: 
                        { status: 'failed' } 
                    }
                );
                // Acknowledge the message, remove it from the queue
                channel.ack(msg);
                console.log(`${json._id} - FAILED`);
            }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    channel.consume(queue, callback, { noAck: false });
    console.log(' [*] Waiting for messages. To exit, press CTRL+C');
  } catch (error) {
    console.error('Error:', error);
  }
})();
