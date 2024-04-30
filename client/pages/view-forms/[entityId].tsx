import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axiosApi from '../../utils/axiosApi';
import axios from 'axios';

interface Form {
    form_id: string;
    name: string;
    tin: string;
    type: string;
}

export default function viewForms() {
    const router = useRouter();
    const { entityId } = router.query;
    const [entityName, setEntityName] = useState<string>('');
    const [forms, setForms] = useState<Form[]>([]);

    useEffect(() => {
        if (entityId) {
            axiosApi.get(`/api/entities/${entityId}`)
                .then(response => {
                    setEntityName(response.data.data.name);
                    fetchForms();
                })
                .catch(error => console.error('Failed to load entity details:', error));

            const fetchForms = async () => {
                try {
                    const response = await axiosApi.get(`/api/forms/${entityId}`);
                    setForms(response.data.data);
                } catch (error) {
                    console.error('Failed to fetch forms:', error);
                }
            };
        }
    }, [entityId]);

    return (
        <div>
            <h1>{entityName || 'Loading entity...'}</h1>
            <h2>Current forms:</h2>
            {forms.length > 0 ? (
                <table>
                    <tbody>
                    {forms.map(form => (
                        <tr key={form.form_id}>
                            <td className="p-1 border-2 border-neutral-700">{form.name}</td>
                            <td className="p-1 border-2 border-neutral-700">{form.tin}</td>
                            <td className="p-1 border-2 border-neutral-700">1099-{form.type}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                    
            ) : <p>No forms found for this entity.</p>}
            {/* Interface to create the 1099s */}
            <div className="my-5"><Link href='/dashboard' className="link-style p-2 border-2 border-neutral-700">Dashboard</Link></div>
        </div>
    );
};