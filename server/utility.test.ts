import { sendResponse, sendError, authenticateToken, generateTokens } from './utility';
import { mockRequest, mockResponse } from './__testing__/__mocks__/mockReqRes';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => {
    const originalJwt = jest.requireActual('jsonwebtoken');
    return {
        ...originalJwt,
        verify: jest.fn(),
        sign: jest.fn((payload: any, secret: string, options?: jwt.SignOptions) => {
            return `token-${payload.userId}-${options?.expiresIn}`;
        })
    };
});

const mockVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;


describe('Utility functions', () => {
    let res: Partial<Response>;
    let req: Partial<Request>;
    let next: jest.Mock<NextFunction>;

    beforeEach(() => {
        jest.clearAllMocks();
        res = mockResponse();
        req = mockRequest({ headers: { authorization: 'Bearer fakeToken' } });
        next = jest.fn();
    });

    describe('Response handlers', () => {
        test('sendResponse sends a successful response', () => {
            sendResponse(res as Response, 200, { foo: 'bar' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { foo: 'bar' }
            });
        });
    
        test('sendError sends an error response', () => {
            sendError(res as Response, 404, 'Not found');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not found'
            });
        });
    });

    describe('Authentication', () => {
        test('authenticateToken calls next if token is valid', () => {
            mockVerify.mockImplementation((token, secret, callback: any) => callback(null, { userId: 1 }));
            authenticateToken(req as Request, res as Response, next);
            expect(next).toHaveBeenCalled();
        });

        test('authenticateToken returns 401 if token is missing', () => {
            if (!req.headers) { // should've been handled by mockReqRes
                req.headers = {};
            }
            req.headers.authorization = '';
            authenticateToken(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
        });

        test('authenticateToken returns 401 if token is invalid', () => {
            mockVerify.mockImplementation((token, secret, callback: any) => callback(new Error('Invalid token'), null));
            authenticateToken(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        });
    });

    describe('Token Generation', () => {
        test('generateTokens returns access and refresh tokens', () => {
            const tokens = generateTokens({ 
                user_id: 123,
                email: 'testing@123.com',
                password: '999'
            });
            expect(tokens).toEqual({
                accessToken: 'token-123-15m',
                refreshToken: 'token-123-7d'
            });
        });
    });
});