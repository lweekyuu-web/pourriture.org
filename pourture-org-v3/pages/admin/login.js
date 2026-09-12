import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.push('/admin');
    else setError('Invalid password');
  }

  return (
    <div className="container">
      <h1 className="sitetitle">POURRITURE.ORG ADMIN</h1>
      <form onSubmit={submit} className="post">
        <div>Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}
