const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');

const transportError = new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '1826d' // delete old logs after 5 years (effectively never auto-delete)
});

const transportCombined = new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxSize: '20m',
    maxFiles: '1826d' // delete old logs after 5 years (effectively never auto-delete)
});

const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logger = winston.createLogger({
    format: logFormat,
    transports: [ 
        transportError,
        transportCombined,
    ],
});

if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
        format: logFormat,
        level: 'silly'
    }));
}


function logWithUser(req, level, message) {
    const userId = req.user ? req.user.userId : 'unknown';
    logger[level](`User ID: ${userId}: ${message}`);
}

module.exports = { logWithUser };