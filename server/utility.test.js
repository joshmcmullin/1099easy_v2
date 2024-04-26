const { sendResponse, sendError, authenticateToken, generateTokens } = require('./utility');
const jwt = require('jsonwebtoken');
const { mockRequest, mockResponse } = require('./__testing__/__mocks__/mockResAndReq');
jest.mock('jsonwebtoken');

describe('Utility functions', () => {
    describe('Response handlers', () => {
        let res;
        beforeEach(() => {
            res = mockResponse();
        });
        test('sendResponse sends a successful response', () => {
            sendResponse(res, 200, { foo: 'bar' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { foo: 'bar' }
            });
        });
    
        test('sendError sends an error response', () => {
            sendError(res, 404, 'Not found');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not found'
            });
        });
    });

    describe('Authentication', () => {
        let req, res, next;
        beforeEach(() => {
            req = mockRequest({
                headers: { authorization: 'Bearer fakeToken' }
            });
            res = mockResponse();
            next = jest.fn();
        });

        test('authenticateToken calls next if token is valid', () => {
            jwt.verify.mockImplementation((token, secret, callback) => callback(null, { userId: 1 }));
            authenticateToken(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('authenticateToken returns 401 if token is missing', () => {
            req.headers.authorization = '';
            authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
        });

        test('authenticateToken returns 401 if token is invalid', () => {
            jwt.verify.mockImplementation((token, secret, callback) => callback(new Error('Invalid token'), null));
            authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        });
    });

    describe('Token Generation', () => {
        test('generateTokens returns access and refresh tokens', () => {
            jwt.sign.mockImplementation((payload, secret, options) => `token-${payload.userId}-${options.expiresIn}`);
            const tokens = generateTokens({ user_id: 123 });
            expect(tokens).toEqual({
                accessToken: 'token-123-15m',
                refreshToken: 'token-123-7d'
            });
        });
    });
});