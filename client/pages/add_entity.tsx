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
    
        // Update the state with the newly formatted input
        setFormData({ ...formData, entity_tin: formattedInput });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.name === '') {
            console.error("Name cannot be left blank!");
            alert("Name cannot be left blank!");
            return;
        }
        if (formData.street === '') {
            console.log("Street cannot be left blank!");
            alert("Street cannot be left blank!");
            return;
        }
        if (formData.city === '') {
            console.error("City cannot be left blank!");
            alert("City cannot be left blank!");
            return;
        }
        if (formData.state === '') {
            console.log("State cannot be left blank!");
            alert("State cannot be left blank!");
            return;
        }
        if (formData.state.length !== 2) {
            console.log("State should only be two characters!");
            alert("State should only be 2 characters!");
            return;
        }
        if (formData.zip === '') {
            console.error("ZIP cannot be left blank!");
            alert("ZIP cannot be left blank!");
            return;
        }
        if (formData.entity_tin === '') {
            console.log("TIN cannot be left blank!");
            alert("TIN cannot be left blank!");
            return;
        }
        try {
            const response = await axiosApi.post('/api/add_entity', formData);
            console.log('Server Response:', response.data);
            router.push('/dashboard');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // This means the error response is from Axios
                if (error.response) {
                    // The server responded with a status code outside the 2xx range
                    console.error("Server responded with an error:", error.response.status, error.response.data);
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error("No response received:", error.request);
                } else {
                    // Something else happened in setting up the request
                    console.error("Error setting up the request:", error.message);
                }
            } else {
                // The error is not from Axios
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