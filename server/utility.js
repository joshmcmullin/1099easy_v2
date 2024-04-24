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
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Utility function for generating access & refresh tokens for authentication
function generateTokens(user) {
    const accessToken = jwt.sign({ userId: user.user_id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1m' });
    const refreshToken = jwt.sign({ userId: user.user_id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}

module.exports = { sendResponse, sendError, authenticateToken, generateTokens };