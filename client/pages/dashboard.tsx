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
        is_individual: boolean;
    }

    const router = useRouter();
    const logout = useLogout();
    const [entities, setEntities] = useState<Entity[]>([]);

    // Fetch entities upon loading page
    useEffect(() => {
        const fetchEntities = async () => {
            try {
                const response = await axiosApi.get('/api/dashboard');
                setEntities(response.data.data as Entity[]);
            } catch (error) {
                console.error("Failed to fetch entities:", error);
            }
        };

        fetchEntities();
    }, [router]);

    // Fetch entities on changes
    useEffect(() => {
        console.log("Entities updated:", entities);
    }, [entities]);

    return (
        <div>
            <h1>Welcome to your dashboard.</h1>
            <h2>Here is a list of all your entities:</h2>
            <table>
                <tbody>
                    {entities.map((entity, index) => (
                        <tr key={index}>
                            <td className="p-1 border-2 border-neutral-700">{entity.name}</td>
                            <td className="p-1 border-2 border-neutral-700">
                                <Link href={`/view-forms/${entity.entity_id}`}>View Forms</Link>
                            </td>
                            <td className="p-1 border-2 border-neutral-700">
                                <Link href={`/view-info/${entity.entity_id}`}>View Info</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="my-5"><button onClick={logout} className="link-style p-2 border-2 border-neutral-700">Sign out</button></div>
            <div className="my-5"><Link href='/add_entity' className="link-style p-2 border-2 border-neutral-700">Add Entity</Link></div>
        </div>
    )
}