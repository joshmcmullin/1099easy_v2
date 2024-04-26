const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
};

const mockRequest = (options = {}) => {
    return {
        headers: options.headers || {},
        body: options.body || {},
        params: options.params || {}
    };
};

module.exports = {
    mockRequest,
    mockResponse
}