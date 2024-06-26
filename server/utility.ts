import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserPayload } from './express-augmentations';

dotenv.config({ path: '.env.local' });

/**
 * Sends a success response
 * @param res Express response object
 * @param status HTTP status code
 * @param data Message, object, or other data
 */
export function sendResponse(res: Response, status: number, data: any): void {
    res.status(status).json({
        success: true,
        data: data
    });
}

/**
 * Sends an error response
 * @param res Express response object
 * @param status HTTP status code
 * @param message Error message
 */
export function sendError(res: Response, status: number, message: string): void {
    res.status(status).json({
        success: false,
        message: message
    });
}

/**
 * Authenticates the user with local access token
 * @param req Express request object
 * @param res Express response object
 * @param next Express next object
 * @returns HTTP code 401 with failure message, or void if successful
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): Response | void {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded as UserPayload;
        next();
    });
}

/**
 * Represents the user structure.
 * @interface
 * @property user_id - The unique identifier of the user.
 * @property email - The user's unique email address.
 * @property password - The user's confirmed password.
 */
interface User {
    user_id: number;
    email: string;
    password: string;
}

/**
 * Generates access & refresh tokens
 * @param user Current user
 * @returns Object with accessToken & refreshToken
 */
export function generateTokens(user: User): { accessToken: string; refreshToken: string} {
    console.log(user.user_id);
    const accessToken = jwt.sign({ userId: user.user_id }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.user_id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}