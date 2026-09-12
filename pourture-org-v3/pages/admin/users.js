import { useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return { props: { users: JSON.parse(JSON.stringify(users)) } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' });
}

export default function AdminUsers({ users: initialUsers }) {
  const [users, setUsers] = useState(initialUsers);

  async function toggleBan(user) {
    const action = user.banned ? 'unban' : 'ban';
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, action }),
    });
    if (res.ok) {
      setUsers(users.map((u) => (u.id === user.id
        ? { ...u, banned: !u.banned, badge: !u.banned ? 'Banned' : 'Newbie', status: !u.banned ? 'Banned' : 'Regular' }
        : u)));
    }
  }

  async function setRole(user, role) {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, action: 'set_role', role }),
    });
    if (res.ok) {
      setUsers(users.map((u) => u.id === user.id ? { ...u, role } : u));
    }
  }

  return (
    <div className="container">
      <h1 className="sitetitle">User Management</h1>
      <p>[<Link href="/admin">Back to dashboard</Link>]</p>
      <table className="admin">
        <thead>
          <tr>
            <th>Anonymous ID</th>
            <th>Display Name</th>
            <th>Badge</th>
            <th>Role</th>
            <th>Status</th>
            <th>Posts</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><Link href={`/user/${u.anonId}`}>#{u.anonId}</Link></td>
              <td>{u.displayName || '—'}</td>
              <td>{u.badge}</td>
              <td>
                <select value={u.role} onChange={(e) => setRole(u, e.target.value)} style={{ fontSize: 11 }}>
                  <option value="user">user</option>
                  <option value="moderator">moderator</option>
                  <option value="administrator">administrator</option>
                </select>
              </td>
              <td>{u.status}</td>
              <td>{u.postCount}</td>
              <td>{fmt(u.createdAt)}</td>
              <td>
                <a href="#" onClick={(e) => { e.preventDefault(); toggleBan(u); }}>
                  [{u.banned ? 'Unban' : 'Ban'}]
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p>No users yet.</p>}
    </div>
  );
}
