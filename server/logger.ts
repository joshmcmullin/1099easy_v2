import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { Request } from 'express';
import { UserPayload } from './express-augmentations';

const logsDir = path.join(__dirname, 'logs');

const transportError = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    level: 'error',
    maxSize: '20m',
    maxFiles: '1826d' // Retains logs for 5 years
});

const transportCombined = new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    level: 'info',
    maxSize: '20m',
    maxFiles: '1826d' // Retains logs for 5 years
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

/**
 * Logs messages with user information
 * @param req Express request object
 * @param level Log level ('info', 'warn', 'error', etc.)
 * @param message Log message
 */
export function logWithUser(req: Request, level: keyof winston.Logger, message: string) {
    const userId = req.user ? req.user.userId : 'unknown';
    logger[level](`User ID: ${userId}: ${message}`);
}