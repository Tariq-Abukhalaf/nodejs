const { isValidHttpUrl } = require('../utils/helper.util');

function checkUrl(req, res, next) 
{
    const url = req.query.url || null;
    if (url !== null)
    {
        if (isValidHttpUrl(url)){
            next();
        }else{
            return res.status(400).json({
                error : true,
                statusCode : 400,
                msg:'url is invalid'
            });
        }
    }else{
        res.status(400).json({
            error : true,
            statusCode : 400,
            msg:'url is required'
        });
    }
}

module.exports = {
    checkUrl
};