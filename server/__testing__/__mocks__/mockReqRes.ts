import { Request, Response } from 'express';

interface MockRequestOptions {
    headers?: { [key: string]: string };
    body?: any;
    params?: { [key: string]: string };
};

const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
};

const mockRequest = (options: MockRequestOptions = {}): Partial<Request> => {
    return {
        headers: options.headers || {},
        body: options.body || {},
        params: options.params || {}
    } as Partial<Request>;
};

export { mockRequest, mockResponse };