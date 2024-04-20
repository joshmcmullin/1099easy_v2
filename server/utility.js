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

module.exports = { sendResponse, sendError };