import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import axios from 'axios';
import axiosApi from '../utils/axiosApi';
import { useRouter } from 'next/router';

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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
            const response = await axiosApi.post('/api/login', formData);
            console.log('Server Response:', response.data);
            console.log("TOKEN: ", response.data.data.accessToken);
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
                    alert("Login failed: " + error.response.data.error);
                }
            } else {
                alert("An error occurred. Please try again later.");
                console.error('Error:', error);
            }
        }
    };

    return (
        <div>
            <h1>Login Page</h1>
            <form className="my-5" onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                </label>
                <label>
                    Password:
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
                </label>
                <button type="submit" className="p-1 border-2 border-neutral-700">Log In</button>
            </form>
            <Link href="/" className="link-style p-1 border-2 border-neutral-700">Home</Link>
        </div>
    )
}