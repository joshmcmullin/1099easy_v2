import React, { useEffect, useState } from 'react'
import Link from 'next/link';

function index() {

  const [message, setMessage] = useState("Loading")

  useEffect(() => {
    fetch("http://localhost:8080/api/home").then(
      response => response.json()
    ).then(
      data => {
        console.log(data)
        setMessage(data.message)
      }
    )
  }, [])

  return (
    <div>
      <div>{message}</div>
      <div className="my-5"><Link href="/login" className="link-style p-2 border-2 border-neutral-700">Login</Link></div>
      <div>Don't have an account yet? Sign up below!</div>
      <div className="my-5"><Link href="/signup" className="link-style p-2 border-2 border-neutral-700">Signup</Link></div>
    </div>
  )
}

export default index
