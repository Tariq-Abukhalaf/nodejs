const amqp                                                = require('amqplib');
const { client,ObjectId }                                 = require('../services/db.service');
const { takeScreenshot,uploadScreenshot,formatFileSize }  = require('../utils/helper.util');
const { callbackToQueue }                                 = require('../models/callback.model');

(async function() {
  try {
    const rabbitmqHost     = process.env.RMQ_HOST;
    const rabbitmqUsername = process.env.RMQ_USERNAME;
    const rabbitmqPassword = process.env.RMQ_PASSWORD;
    const rabbitmqPort     = process.env.RMQ_PORT;
    const connectionURL    = `amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}:${rabbitmqPort}`;
    const connection = await amqp.connect(connectionURL);
    const channel    = await connection.createChannel();
    const queue      = 'jobs_events';
    const db         = client.db(process.env.MONGO_DATABASE);
    await channel.prefetch(parseInt(process.env.RMQ_PREFETCH)); 
    const callback = async (msg) => {
      try {
        let processSuccess = true;
        const json = JSON.parse(msg.content.toString());
        /**
         * take a screenshot
         */
        const start_takeScreenshot = Date.now();
        const {buffer,info} = await takeScreenshot(json.url,json.width,json.height);
        const stop_takeScreenshot = Date.now();
        const st = (stop_takeScreenshot - start_takeScreenshot) /1000;
        const spentTime_takeScreenshot = st.toFixed(2);
        if (buffer){
            /**
             * get link after upload to s3 as [buffer]
             */
            const link = await uploadScreenshot(buffer);
            if (link){
                /**
                 * if uploaded to s3 only
                 */
                await db.collection('jobs').updateOne(
                    { _id: new ObjectId(json._id) },
                    { $set: 
                        { 
                            screenshotURL : link,
                            screenshotMeta : info
                        } 
                    }
                );
            }
        }else{
            processSuccess = false;
        }
        if (processSuccess) 
        {
            await db.collection('jobs').updateOne(
                { _id: new ObjectId(json._id), status: 'queued' },
                { $set: 
                    { status: 'success' } 
                }
            );
            /**
             * callback rmq
             */
            const doc = {
                jobId: new ObjectId(json._id),
                callback: json.callback,
                callbackTriggerd : false,
                status:'waiting',
                addedTime: new Date()
            };
            const result = await db.collection('callback').insertOne(doc);
            if(result.insertedId){
                // publish one
                await callbackToQueue(result.insertedId)
            }

            // Acknowledge the message, remove it from the queue
            channel.ack(msg);
            console.log(`screenshot time: ${spentTime_takeScreenshot}s ${json._id} - ACK`);
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
                await db.collection('jobs').updateOne(
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
