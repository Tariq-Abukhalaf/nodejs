function checkHeight(req, res, next) 
{
    const height = req.query.height || null;
    if (height !== null)
    {
        if (Number.isInteger(parseInt(height))) 
        {
            if (parseInt(height)>0) {
                next();
            }else{
                res.status(400).json({
                    error : true,
                    statusCode : 400,
                    msg:'height must positive number'
                });
            }
        }else{
            res.status(400).json({
                error : true,
                statusCode : 400,
                msg:'height must be int'
            });
        }
    }else{
        res.status(400).json({
            error : true,
            statusCode : 400,
            msg:'height is required'
        });
    }
}

module.exports = {
    checkHeight
};