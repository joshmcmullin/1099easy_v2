import React from 'react'
import Link from 'next/link';

function index() {
  return (
    <div>
      <div>Login using the button below!</div>
      <div className="my-5"><Link href="/login" className="link-style p-2 border-2 border-neutral-700">Login</Link></div>
      <div>Sign up below!</div>
      <div className="my-5"><Link href="/signup" className="link-style p-2 border-2 border-neutral-700">Signup</Link></div>
    </div>
  )
}

export default index
