const winston = require('winston');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');

const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logger = winston.createLogger({
    //format: winston.format.json(),
    format: logFormat,
    transports: [
        // Error
        new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
        // Info, Warn, & Error
        new winston.transports.File({ filename: path.join(logsDir, 'combined.log'), level: 'info' }),
    ],
});

if (process.env.NODE_ENV === 'development') {
    // Silly, Debug, Verbose, HTTP, Info, Warn, Error
    logger.add(new winston.transports.File({ 
        filename: path.join(logsDir, 'everything.log'), 
        level: 'silly' 
    }));
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
        level: 'silly'
    }));
}


function logWithUser(req, level, message) {
    const userId = req.user ? req.user.userId : 'unknown';
    logger[level](`User ID: ${userId}: ${message}`);
}

module.exports = { logWithUser };