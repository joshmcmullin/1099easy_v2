import { useRouter } from 'next/router';

export const useLogout = () => {
    const router = useRouter();
    const logout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    }
    return logout;
};