import { useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const badges = await prisma.badge.findMany({ orderBy: { level: 'asc' } });
  return { props: { badges: JSON.parse(JSON.stringify(badges)) } };
}

export default function AdminBadges({ badges: initialBadges }) {
  const [badges, setBadges] = useState(initialBadges);
  const [form, setForm] = useState({ name: '', color: '#808080', description: '', level: 0, requirement: '' });

  async function createBadge(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const b = await res.json();
      setBadges([...badges, b]);
      setForm({ name: '', color: '#808080', description: '', level: 0, requirement: '' });
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function deleteBadge(id) {
    if (!confirm('Delete this badge?')) return;
    await fetch(`/api/admin/badges?id=${id}`, { method: 'DELETE' });
    setBadges(badges.filter((b) => b.id !== id));
  }

  return (
    <div className="container">
      <h1 className="sitetitle">Badge Management</h1>
      <p>[<Link href="/admin">Back to dashboard</Link>]</p>

      <table className="admin">
        <thead>
          <tr><th>Name</th><th>Color</th><th>Level</th><th>Requirement</th><th>Description</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {badges.map((b) => (
            <tr key={b.id}>
              <td><span className="badge" style={{ borderColor: b.color, color: b.color }}>[{b.name.toUpperCase()}]</span></td>
              <td><code>{b.color}</code></td>
              <td>{b.level}</td>
              <td>{b.requirement || '—'}</td>
              <td>{b.description || '—'}</td>
              <td><a href="#" onClick={(e) => { e.preventDefault(); deleteBadge(b.id); }}>[Delete]</a></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Create Badge</h2>
      <form onSubmit={createBadge} className="post">
        <div>Name: <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div>Color: <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#008000" /></div>
        <div>Level: <input type="number" value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 0 })} /></div>
        <div>Requirement: <input type="text" value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} placeholder="e.g. 500 posts" /></div>
        <div>Description: <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <button type="submit">Create Badge</button>
      </form>
    </div>
  );
}
