import { Request, Response } from 'express';

/**
 * Defines the structure for options that can be passed to the
 * mockRequest function.
 */
interface MockRequestOptions {
    headers?: { [key: string]: string };
    body?: any;
    params?: { [key: string]: string };
};

/**
 * Creates a mock response object to mimic an Express
 * request object.
 * @returns A partially mocked response object.   
 */
const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
};

/**
 * Creates a mock request object to mimic an Express
 * response object.
 * @param options Configuration options for headers, body,
 * and URL parameters.
 * @returns A partially mocked request object.
 */
const mockRequest = (options: MockRequestOptions = {}): Partial<Request> => {
    return {
        headers: options.headers || {},
        body: options.body || {},
        params: options.params || {}
    } as Partial<Request>;
};

export { mockRequest, mockResponse };