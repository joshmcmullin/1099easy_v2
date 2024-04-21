import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Dashboard() {

    // Entity interface follows structure of database table
    interface Entity {
        entity_id: number;
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        user_id: number;
        entity_tin: string;
    }

    const router = useRouter();
    const [entities, setEntities] = useState<Entity[]>([]);

    // Fetch entities upon loading page
    useEffect(() => {
        const fetchEntities = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error("No token found, redirecting to login");
                    router.push('/login');
                    return;
                }
                const response = await axios.get('http://localhost:8080/dashboard', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setEntities(response.data.data as Entity[]);
            } catch (error) {
                console.error("Failed to fetch entities:", error);
            }
        };

        fetchEntities();
    }, [router]); // Router included to satisfy ESLint

    // Fetch entities on changes
    useEffect(() => {
        console.log("Entities updated:", entities);
    }, [entities]);

    return (
        <div>
            <h1>Welcome to your dashboard.</h1>
            <h2>Here is a list of all your entities:</h2>
            <table>
                <thead>
                    <tr>
                        <th className="p-1 border-2 border-neutral-700">entity_id</th>
                        <th className="p-1 border-2 border-neutral-700">name</th>
                        <th className="p-1 border-2 border-neutral-700">street</th>
                        <th className="p-1 border-2 border-neutral-700">city</th>
                        <th className="p-1 border-2 border-neutral-700">state</th>
                        <th className="p-1 border-2 border-neutral-700">zip</th>
                        <th className="p-1 border-2 border-neutral-700">user_id</th>
                        <th className="p-1 border-2 border-neutral-700">entity_tin</th>
                    </tr>
                </thead>
                <tbody>
                    {entities.map((entity, index) => (
                        <tr key={index}>
                            <td className="p-1 border-2 border-neutral-700">{entity.entity_id}</td>
                            <td className="p-1 border-2 border-neutral-700">{entity.name}</td>
                            <td className="p-1 border-2 border-neutral-700">{entity.street}</td>
                            <td className="p-1 border-2 border-neutral-700">{entity.city}</td>
                            <td className="p-1 border-2 border-neutral-700">{entity.state}</td>
                            <td className="p-1 border-2 border-neutral-700">{entity.zip}</td>
                            <td className="p-1 border-2 border-neutral-700">{entity.user_id}</td>
                            <td className="p-1 border-2 border-neutral-700">{entity.entity_tin}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="my-5"><Link href='/' className="link-style p-2 border-2 border-neutral-700">Home</Link></div>
            <div className="my-5"><Link href='/login' className="link-style p-2 border-2 border-neutral-700">Sign out</Link></div>
            <div className="my-5"><Link href='/add_entity' className="link-style p-2 border-2 border-neutral-700">Add Entity</Link></div>
        </div>
    )
}