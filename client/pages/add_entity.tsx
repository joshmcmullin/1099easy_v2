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
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEntityTINChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        let digits = value.replace(/\D/g, ''); // Strip all non-digits
        let formattedInput = '';
        // Split the digits based on their position and add dashes appropriately
        for (let i = 0; i < digits.length; i++) {
            if (i === 3 || i === 5) {
                formattedInput += '-';
            }
            formattedInput += digits[i];
        }
        // Limit the length of digits to match SSN format (9 digits max)
        if (formattedInput.length > 11) {
            formattedInput = formattedInput.slice(0, 11);
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
                    TIN (SSN or EIN):
                    <input type="text" name="entity_tin" value={formData.entity_tin} onChange={handleEntityTINChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                </label>
                <button type="submit" className="p-1 border-2 border-neutral-700">Submit</button>
            </form>
            <Link href="/dashboard" className="link-style p-1 border-2 border-neutral-700">Dashboard</Link>
        </div>
    );
}