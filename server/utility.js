require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

// Utility function for sending a success response
function sendResponse(res, status, data) {
    res.status(status).json({
        success: true,
        data: data
    });
}

// Utility function for sending an error response
function sendError(res, status, message) {
    res.status(status).json({
        success: false,
        message: message
    });
}

// Utility function for user authentication
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token == null) {
        return sendError(res, 401, 'No token provided');
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return sendError(res, 403, 'Invalid token');
        }
        req.user = user;
        next();
    });
}

module.exports = { sendResponse, sendError, authenticateToken };