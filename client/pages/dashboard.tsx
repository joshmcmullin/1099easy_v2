import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function dashboard() {
    const router = useRouter();
    const [entities, setEntities] = useState([]);

    useEffect(() => {
        const fetchEntities = async () => {
            try {
                const token = localStorage.getItem('token'); // Assuming the token is stored in localStorage after login
                if (!token) {
                    console.error("No token found, redirecting to login");
                    router.push('/login');
                    return;
                }
                const response = await axios.get('http://localhost:8080/dashboard?user_id=1', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setEntities(response.data.data);
            } catch (error) {
                console.error("Failed to fetch entities:", error);
            }
        };

        fetchEntities();
    }, []);

    return (
        <div>
            <h1>Welcome to your dashboard.</h1>
            <h2>Here is a list of all your entities:</h2>
            <div className="my-5"><Link href='/' className="link-style p-2 border-2 border-neutral-700">Home</Link></div>
            <div className="my-5"><Link href='/login' className="link-style p-2 border-2 border-neutral-700">Sign out</Link></div>
        </div>
    )
}