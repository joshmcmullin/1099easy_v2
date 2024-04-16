import React from 'react';
import Link from 'next/link';

const Signup: React.FC = () => {
    return (
        <div>
            <h1>Signup Page</h1>
            <form>
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" required className="p-1 mr-2 border-2 border-neutral-700"/>
                <label htmlFor="password">Password:</label>
                <input type="password" id="password" name="password" required className="p-1 mr-2 border-2 border-neutral-700"/>
                <label htmlFor="password">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required className="p-1 mr-2 border-2 border-neutral-700"/>
                <button type="submit" className="p-1 border-2 border-neutral-700">Sign up</button>
            </form>
            <Link href="/" className="link-style p-1 border-2 border-neutral-700">Home</Link>
        </div>
    )
}

export default Signup;