import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({ 
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            console.error("passwords do not match");
            alert("Passwords do not match");
            return;
        }
        if (formData.email === '') {
            console.error("Email cannot be left blank!");
            alert("Email cannot be left blank!");
            return;
        }
        if (formData.password === '') {
            console.log("Password cannot be left blank!");
            alert("Password cannot be left blank!");
            return;
        }
        try {
            const response = await axios.post('http://localhost:8080/api/signup', formData);
            console.log('Server Response:', response.data);
            router.push('/dashboard');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.error("Error sending data:", error.response.data);
            } else if (error instanceof Error) {
                console.error('Error sending data:', error.message);
            } else {
                console.error('Unexpected error:', error);
            }
        }
    };

    return (
        <div>
            <form className="my-5" onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                </label>
                <label>
                    Password:
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                </label>
                <label>
                    Confirm Password:
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                </label>
                <button type="submit" className="p-1 border-2 border-neutral-700">Submit</button>
            </form>
            <Link href="/" className="link-style p-1 border-2 border-neutral-700">Home</Link>
        </div>
    );
}