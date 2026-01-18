const jwt = require('jsonwebtoken');
const HttpError = require('../models/ErrorModel');

// Extract and verify Bearer token from Authorization header
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers?.authorization || "";
        
        if (!authHeader.startsWith("Bearer ")) {
            return next(new HttpError("Unauthorized - Missing or invalid token", 401));
        }

        const token = authHeader.slice(7).trim();
        
        if (!token) {
            return next(new HttpError("Unauthorized - Missing token", 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return next(new HttpError("Unauthorized - Invalid token", 401));
    }
};

// Verify token AND check if user is admin
const verifyAdminToken = (req, res, next) => {
    try {
        const authHeader = req.headers?.authorization || "";
        
        if (!authHeader.startsWith("Bearer ")) {
            return next(new HttpError("Unauthorized - Missing or invalid token", 401));
        }

        const token = authHeader.slice(7).trim();
        
        if (!token) {
            return next(new HttpError("Unauthorized - Missing token", 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.isAdmin) {
            return next(new HttpError("Forbidden - Admin access required", 403));
        }

        req.user = decoded;
        next();
    } catch (error) {
        return next(new HttpError("Unauthorized - Invalid token", 401));
    }
};

module.exports = {
    verifyToken,
    verifyAdminToken
};
