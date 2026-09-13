import { useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

const DEFAULT_BADGES = [
  { name: 'Newbie', color: '#777777', description: 'Fresh off the board.', level: 0, requirement: 'New member' },
  { name: 'Oldfag', color: '#117743', description: 'A long-time board regular.', level: 10, requirement: '100 posts' },
  { name: 'Thread Wizard', color: '#7b2cbf', description: 'Starts threads people actually read.', level: 20, requirement: '25 threads' },
  { name: 'Meme Archaeologist', color: '#cc6600', description: 'Digging up ancient internet artifacts.', level: 30, requirement: '365 days on site' },
  { name: 'Glitter Admin', color: '#d1008f', description: 'Site staff with unnecessary sparkle.', level: 90, requirement: 'Administrator' },
  { name: 'Board Mod', color: '#af0a0f', description: 'Keeps a board from catching fire.', level: 80, requirement: 'Moderator' },
];

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const existing = await prisma.badge.findMany({ orderBy: { level: 'asc' } });
  const names = new Set(existing.map((b) => b.name));
  for (const badge of DEFAULT_BADGES) {
    if (!names.has(badge.name)) await prisma.badge.create({ data: badge });
  }
  const badges = await prisma.badge.findMany({ orderBy: { level: 'asc' } });
  return { props: { badges: JSON.parse(JSON.stringify(badges)) } };
}

export default function AdminBadges({ badges: initialBadges }) {
  const [badges, setBadges] = useState(initialBadges);
  const [form, setForm] = useState({ name: '', color: '#808080', description: '', level: 0, requirement: '' });

  async function createBadge(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/badges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
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
      <h1 className="sitetitle">BADGE VAULT</h1>
      <p>[<Link href="/admin">Back to dashboard</Link>]</p>
      <p className="muted">Small, colorful, deliberately overdramatic old-web badges. Assign the badge value to a user from your moderation/admin tools.</p>

      <table className="admin">
        <thead><tr><th>Badge</th><th>Color</th><th>Level</th><th>Requirement</th><th>Description</th><th>Actions</th></tr></thead>
        <tbody>{badges.map((b) => <tr key={b.id}>
          <td><span className="badge badge-sparkle" style={{ borderColor: b.color, color: b.color }}>[{b.name.toUpperCase()}]</span></td>
          <td><code>{b.color}</code></td><td>{b.level}</td><td>{b.requirement || '—'}</td><td>{b.description || '—'}</td>
          <td><a href="#" onClick={(e) => { e.preventDefault(); deleteBadge(b.id); }}>[Delete]</a></td>
        </tr>)}</tbody>
      </table>

      <h2>Create Badge</h2>
      <form onSubmit={createBadge} className="post">
        <div>Name: <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div>Color: <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /> <code>{form.color}</code></div>
        <div>Level: <input type="number" value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 0 })} /></div>
        <div>Requirement: <input type="text" value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} placeholder="e.g. 500 posts" /></div>
        <div>Description: <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <button type="submit">Create Badge</button>
      </form>
    </div>
  );
}
