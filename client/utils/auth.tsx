import { useRouter } from 'next/router';

// Handles JWT Token invalidation upon logout
export const useLogout = () => {
    const router = useRouter();
    const logout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    }
    return logout;
};