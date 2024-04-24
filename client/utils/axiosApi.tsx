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
    const originalRequest = error.config;
    // Check if it's a token expired error and this is the first retry of the request
    if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Marking request as tried
        try {
            const refreshResponse = await axios.post('http://localhost:8080/api/refresh_token', {}, {
                withCredentials: true
            });
            // Update access token in local storage
            localStorage.setItem('accessToken', refreshResponse.data.accessToken);
            // update the token from the original request
            originalRequest.headers['Authorization'] = 'Bearer ' + refreshResponse.data.accessToken;
            return axiosApi(originalRequest); // Retry the original request with the new token
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Axios Error during token refresh:', axiosError.message);
                if (axiosError.response) {
                    console.error("Data:", axiosError.response.data);
                    console.error("Status:", axiosError.response.status); 
                    console.error("Headers:", axiosError.response.headers); 
                } else if (axiosError.request) {
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
