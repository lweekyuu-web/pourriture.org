import { useState } from 'react';
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
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
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
        ? { ...u, banned: !u.banned, badge: !u.banned ? 'Banned' : 'Newbie' }
        : u)));
    }
  }

  return (
    <div className="container">
      <h1 className="sitetitle">User Management</h1>
      <p>[<a href="/admin">Back to dashboard</a>]</p>
      <table className="admin">
        <thead>
          <tr>
            <th>Anonymous ID</th>
            <th>Display Name</th>
            <th>Badge</th>
            <th>Posts</th>
            <th>Joined</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>Anonymous #{u.anonId}</td>
              <td>{u.displayName || '—'}</td>
              <td>{u.badge}</td>
              <td>{u.postCount}</td>
              <td>{fmt(u.createdAt)}</td>
              <td>{u.banned ? 'Banned' : 'Active'}</td>
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
