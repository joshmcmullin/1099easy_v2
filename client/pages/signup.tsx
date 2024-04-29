import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axiosApi from '../utils/axiosApi';
import axios from 'axios';

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
        if (!formData.email || !formData.password) {
            console.log("Email and password fields cannot be blank!")
            alert("Email and password fields cannot be blank!");
            return;
        }
        try {
            const response = await axiosApi.post('/api/signup', formData);
            // Authenticate with token
            if (response.data.data.accessToken) {
                localStorage.setItem('accessToken', response.data.data.accessToken);
                router.push('/dashboard');
            } else {
                console.error("Token not provided in response");
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.error("Error sending data:", error.response.data);
                if (error.response.status === 404) {
                    alert("Account not found");
                } else {
                    alert("login failed: " + error.response.data.error);
                }
            } else {
                alert("An error occured. Please try again later.");
                console.error("Error:", error);
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