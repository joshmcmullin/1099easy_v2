import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import axiosApi from '../utils/axiosApi';

export default function AddEntity() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        entity_tin: '',
        is_individual: true,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    
    const handleEntityTINChange = (e: ChangeEvent<HTMLInputElement>) => {
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

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Validation checks
        if (!formData.name || !formData.street || !formData.city || !formData.state || !formData.zip || !formData.entity_tin) {
            console.error("All fields must be filled!");
            alert("All fields must be filled!");
            return;
        }
        try {
            const response = await axiosApi.post('/api/add_entity', formData);
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

    return (
        <div>
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
            </form>
            <Link href="/dashboard" className="link-style p-1 border-2 border-neutral-700">Dashboard</Link>
        </div>
    );
}