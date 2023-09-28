const { isValidHttpUrl } = require('../utils/helper.util');

function checkCallback(req, res, next) 
{
    const callback = req.query.callback || null;
    if (callback !== null)
    {
        if (isValidHttpUrl(callback)){
            next();
        }else{
            return res.status(400).json({
                error : true,
                statusCode : 400,
                msg:'callback is invalid'
            });
        }
    }else{
        res.status(400).json({
            error : true,
            statusCode : 400,
            msg:'callback is required'
        });
    }
}

module.exports = {
    checkCallback
};