import axios from 'axios';

const axiosApi = axios.create({
    baseURL: 'http://localhost:8080/',
});

axiosApi.interceptors.request.use(function (config) {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

export default axiosApi;
