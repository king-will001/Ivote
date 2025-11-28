

class HttpError extends Error {
    constructor(Message, errorCode) {
        super(message);
        this.code = errorCode;
    }
}

module.exports = HttpError;