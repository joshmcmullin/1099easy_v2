import axios, { AxiosError } from 'axios';

// Standardizing axios use
const axiosApi = axios.create({
    baseURL: 'http://localhost:8080/',
    withCredentials: true
});

// Add auth token header to requests
axiosApi.interceptors.request.use(function (config) {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Handle token refresh logic
axiosApi.interceptors.response.use(response => response, async error => {
    console.log("Line 22 of AxiosAPI triggered.");
    const originalRequest = error.config;
    // Check if it's a token expired error and this is the first retry of the request
    if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Marking request as tried
        try {
            const refreshResponse = await axios.post('http://localhost:8080/api/refresh_token', {}, {
                withCredentials: true
            });
            localStorage.setItem('accessToken', refreshResponse.data.accessToken); // Update the access token in localStorage
            originalRequest.headers['Authorization'] = 'Bearer ' + refreshResponse.data.accessToken; // Update the token in the original request
            return axiosApi(originalRequest); // Retry the original request with the new token
        } catch (error: unknown) {  // Explicitly declaring error as unknown
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError; // Now TypeScript knows it's an AxiosError
                console.error('Axios Error during token refresh:', axiosError.message);
                if (axiosError.response) {
                    console.log("Line 39 triggered in AxiosAPI");
                    console.error("Data:", axiosError.response.data); // TODO: Start debugging here, line 37 triggering.
                    console.error("Status:", axiosError.response.status); 
                    console.error("Headers:", axiosError.response.headers); 
                } else if (axiosError.request) {
                    console.log("Line 42 triggered in AxiosAPI");
                    // The request was made but no response was received
                    console.error("Request made, no response received.");
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error setting up the request:', axiosError.message);
                }
            } else {
                // The error is not from Axios or other expected types
                console.error('Non-Axios Error:', error);
            }
        }
    }
    return Promise.reject(error);
});

export default axiosApi;
