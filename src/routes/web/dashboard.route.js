const express        = require('express');
const router         = express.Router();
const server       = require('../../utils/server.class');

router.get('/',async (req, res, next) =>{
    const serverObj = new server('us-east-1');
    const listSlaveInstances = await serverObj.listSlaveInstances();
    res.render('index', {listSlaveInstances});
});

module.exports = router;
