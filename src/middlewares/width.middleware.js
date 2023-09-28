function checkWidth(req, res, next) 
{
    const width = req.query.width || null;
    if (width !== null)
    {
        if (Number.isInteger(parseInt(width))) 
        {
            if (parseInt(width)>0) {
                next();
            }else{
                res.status(400).json({
                    error : true,
                    statusCode : 400,
                    msg:'width must positive number'
                });
            }
        }else{
            res.status(400).json({
                error : true,
                statusCode : 400,
                msg:'width must be int'
            });
        }
    }else{
        res.status(400).json({
            error : true,
            statusCode : 400,
            msg:'width is required'
        });
    }
}

module.exports = {
    checkWidth
};