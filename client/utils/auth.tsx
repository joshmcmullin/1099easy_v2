import { useRouter } from 'next/router';
import axiosApi from '../utils/axiosApi';
import axios from 'axios';

// Handles JWT Token invalidation & cookie removal upon logout
// TODO: Implement blacklisting invalid tokens
export const useLogout = () => {
    const router = useRouter();
    const logout = async () => {
        // invalidate access token
        localStorage.removeItem('accessToken');
        // invalidate refresh token
        try {
            const response = await axiosApi.post('/api/logout');
            if (response.status === 200) {
                router.push('/login');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Axios error during logout:', error.message);
            } else {
                console.error('Error during logout:', error);
            }
        }
        router.push('/login');
    }
    return logout;
};