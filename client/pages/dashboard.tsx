import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axiosApi from '../utils/axiosApi';
import { useLogout } from '../utils/auth';

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
    const logout = useLogout();
    const [entities, setEntities] = useState<Entity[]>([]);

    // Fetch entities upon loading page
    useEffect(() => {
        const fetchEntities = async () => {
            try {
                const response = await axiosApi.get('/dashboard');
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
            <div className="my-5"><button onClick={logout} className="link-style p-2 border-2 border-neutral-700">Sign out</button></div>
            <div className="my-5"><Link href='/add_entity' className="link-style p-2 border-2 border-neutral-700">Add Entity</Link></div>
        </div>
    )
}