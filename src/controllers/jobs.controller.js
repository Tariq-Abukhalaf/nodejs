const { client }                  = require('../services/db.service');
const { isValidHttpUrl,isString } = require('../utils/helper.util');
const {toQueue}                   = require('../models/jobs.model');
const db                          = client.db(process.env.MONGO_DATABASE);

async function create(req, res, next) {
    const method      = req.method || null;
    const endPoint    = req.originalUrl.split("?").shift() || null;
    const url         = req.query.url;
    const callback    = req.query.callback;
    const width       = req.query.width || null;
    const height      = req.query.height || null;
    // insert new record into jobs collection
    const result = await db.collection('jobs').insertOne({
        endPoint:endPoint,
        method:method,
        url:url,
        callback:callback,
        width:parseInt(width),
        height:parseInt(height),
        screenshotURL:null,
        screenshotMeta:null,
        status:'waiting',
        addedTime: new Date()
    });
    if(result.insertedId){
        // toQueue
        await toQueue(result.insertedId);
        return res.status(201).json({
            error : false,
            statusCode : 201,
            data :{
                job_id : result.insertedId.toString()
            }
        });
    }
}

module.exports = {
  create
};
