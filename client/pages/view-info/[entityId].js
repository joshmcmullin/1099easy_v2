import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axiosApi from '../../utils/axiosApi';
import axios from 'axios';

export default function viewForms() {
    const router = useRouter();
    const { entityId } = router.query;
    const [entityData, setEntityData] = useState({
        entity_id: entityId,
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        entity_tin: '',
        is_individual: true,
    });
    const [entityName, setEntityName] = useState('');
    const [formData, setFormData] = useState({
        entity_id: entityId,
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        entity_tin: '',
        is_individual: true,
    });
    const [showUpdateForm, setShowUpdateForm] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Clear the TIN field whenever checkbox changes
        if (name === 'is_individual') {
            setFormData({
                ...formData,
                [name]: checked,
                entity_tin: ''  
            });
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value
            });
        }
    };
    
    const handleEntityTINChange = (e) => {
        const { value } = e.target;
        let digits = value.replace(/\D/g, '');
        let formattedInput = '';

        if (formData.is_individual) { // Format as SSN: xxx-xx-xxxx
            for (let i = 0; i < digits.length; i++) {
                if (i === 3 || i === 5) {
                    formattedInput += '-';
                }
                formattedInput += digits[i];
            }
            if (formattedInput.length > 11) {
                formattedInput = formattedInput.slice(0, 11);
            }
        } else { // Format as EIN: xx-xxxxxxx
            for (let i = 0; i < digits.length; i++) {
                if (i === 2) {
                    formattedInput += '-';
                }
                formattedInput += digits[i];
            }
            if (formattedInput.length > 10) {
                formattedInput = formattedInput.slice(0, 10);
            }
        }

        setFormData({ ...formData, entity_tin: formattedInput });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation checks
        if (!formData.name || !formData.street || !formData.city || !formData.state || !formData.zip || !formData.entity_tin) {
            console.error("All fields must be filled!");
            alert("All fields must be filled!");
            return;
        }
        try {
            const response = await axiosApi.post('/api/update_entity', formData); // removed post route to prevent accidents. Update to /api/update_entity
            router.push('/dashboard');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.error("Server responded with an error:", error.response.status, error.response.data);
                if (error.response.status === 401) {
                    router.push('/login');
                }
            } else {
                console.error("Error during entity addition:", error);
            }
        }
    };

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
            <table>
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
            </table>
            { !showUpdateForm && 
                <button type="button" className="p-1 mt-2 border-2 border-neutral-700" onClick={() => setShowUpdateForm(true)}>Update Info</button> 
            }
            {showUpdateForm && 
                <form className="my-5" onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                    </label>
                    <label>
                        Street:
                        <input type="text" name="street" value={formData.street} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                    </label>
                    <label>
                        City:
                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                    </label>
                    <label>
                        State:
                        <input type="text" name="state" value={formData.state} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                    </label>
                    <label>
                        ZIP:
                        <input type="text" name="zip" value={formData.zip} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                    </label>
                    <label>
                        Payer is Individual:
                        <input type="checkbox" name="is_individual" checked={formData.is_individual} onChange={handleChange} className="p-1 m-2"/>
                    </label>
                    <label>
                        TIN (SSN or EIN):
                        <input type="text" name="entity_tin" value={formData.entity_tin} onChange={handleEntityTINChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                    </label>
                    <button type="submit" className="p-1 border-2 border-neutral-700">Submit</button>
                    <button type="button" className="p-1 ml-2 border-2 border-neutral-700" onClick={() => setShowUpdateForm(false)}>Cancel</button>
                </form>
            }
            <div className="my-5"><Link href='/dashboard' className="link-style p-2 border-2 border-neutral-700">Dashboard</Link></div>
        </div>
    );
};