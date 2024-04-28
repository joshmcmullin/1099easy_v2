import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axiosApi from '../../utils/axiosApi';

export default function viewForms() {
    const router = useRouter();
    const { entityId } = router.query;
    const [entityData, setEntityData] = useState({
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        entity_tin: '',
        is_individual: true,
    });
    const [entityName, setEntityName] = useState('');
    const [forms, setForms] = useState([]);

    useEffect(() => {
        if (entityId) {
            axiosApi.get(`/api/entities/${entityId}`)
                .then(response => {
                    setEntityName(response.data.data.name);
                    setEntityData({
                        name: response.data.data.name,
                        street: response.data.data.street,
                        city: response.data.data.city,
                        state: response.data.data.state,
                        zip: response.data.data.zip,
                        entity_tin: response.data.data.entity_tin,
                        is_individual: response.data.data.is_individual
                    });
                })
                .catch(error => console.error('Failed to load entity details:', error));
        }
    }, [entityId]);

    return (
        <div>
            <h1>{entityName || 'Loading entity...'}</h1>
            <h2>Current entity info:</h2>
            {<table>
                <thead>
                    <tr>
                        <td className="p-1 border-2 border-neutral-700">Name</td>
                        <td className="p-1 border-2 border-neutral-700">Street</td>
                        <td className="p-1 border-2 border-neutral-700">City</td>
                        <td className="p-1 border-2 border-neutral-700">State</td>
                        <td className="p-1 border-2 border-neutral-700">ZIP</td>
                        <td className="p-1 border-2 border-neutral-700">TIN</td>
                        <td className="p-1 border-2 border-neutral-700">Entity Type</td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="p-1 border-2 border-neutral-700">{entityData.name}</td>
                        <td className="p-1 border-2 border-neutral-700">{entityData.street}</td>
                        <td className="p-1 border-2 border-neutral-700">{entityData.city}</td>
                        <td className="p-1 border-2 border-neutral-700">{entityData.state}</td>
                        <td className="p-1 border-2 border-neutral-700">{entityData.zip}</td>
                        <td className="p-1 border-2 border-neutral-700">{entityData.entity_tin}</td>
                        <td className="p-1 border-2 border-neutral-700">{entityData.is_individual ? 'Individual' : 'Business'}</td>
                    </tr>
                </tbody>    
            </table>}
            <div className="my-5"><Link href='/dashboard' className="link-style p-2 border-2 border-neutral-700">Dashboard</Link></div>
        </div>
    );
};