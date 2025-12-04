// unsupported/404 endpoints

const notFound = (req, res, next) => {
    const error = new Error(`not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}



// Error malddleware
const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    res.status(error.code || 500).json({message: error.message || "An unknown error occurred!"});
}


module.exports = {
    notFound,
    errorHandler

}