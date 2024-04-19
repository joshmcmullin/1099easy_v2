import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function Home() {
    const [formData, setFormData] = useState({ 
        username: '',
        email: ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/data', formData);
            console.log('Server Response:', response.data);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error sending data:', error.message);
            } else {
                console.error('Unexpected error:', error);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Username:
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
            </label>
            <label>
                Email:
                <input type="text" name="email" value={formData.email} onChange={handleChange} className="p-1 mr-2 border-2 border-neutral-700"/>
            </label>
            <button type="submit" className="p-1 border-2 border-neutral-700">Submit</button>
        </form>
    );
}
// const Signup: React.FC = () => {
//     return (
//         <div>
//             <h1>Signup Page</h1>
//             <form onSubmit={handleSubmit}>
//                 <label htmlFor="username">Username:</label>
//                 <input type="text" id="username" name="username" required className="p-1 mr-2 border-2 border-neutral-700"/>
//                 <label htmlFor="password">Password:</label>
//                 <input type="password" id="password" name="password" required className="p-1 mr-2 border-2 border-neutral-700"/>
//                 <label htmlFor="password">Confirm Password:</label>
//                 <input type="password" id="confirmPassword" name="confirmPassword" required className="p-1 mr-2 border-2 border-neutral-700"/>
//                 <button type="submit" className="p-1 border-2 border-neutral-700">Sign up</button>
//             </form>
//             <Link href="/" className="link-style p-1 border-2 border-neutral-700">Home</Link>
//         </div>
//     )
// }

// export default Signup;