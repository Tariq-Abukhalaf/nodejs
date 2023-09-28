const { MongoClient,ObjectId } = require("mongodb");
require('dotenv').config();

const mongoHost     = process.env.MONGO_HOST;
const mongoPort     = process.env.MONGO_PORT;
const connectionURL = `mongodb://${mongoHost}:${mongoPort}`;
const client        = new MongoClient(connectionURL);

(async function() {
  try {
    await client.connect();
  }catch(e){
    console.error(e);
  } 
})();

module.exports = { client,ObjectId }