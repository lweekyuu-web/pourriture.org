import { useMemo, useState } from 'react';
import Link from 'next/link';
import { isAdminRequest } from '../../lib/admin';
import prisma from '../../lib/prisma';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 });
  return { props: { users: JSON.parse(JSON.stringify(users)) } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' });
}

function userLabel(u) {
  return u.displayName && u.displayName !== 'Anonymous' ? u.displayName : `User #${u.anonId}`;
}

export default function AdminUsers({ users: initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.displayName, u.anonId, u.role, u.status, u.badge]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)));
  }, [users, search]);

  async function toggleBan(user) {
    const action = user.banned ? 'unban' : 'ban';
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, action }) });
    if (res.ok) setUsers((list) => list.map((u) => u.id === user.id ? { ...u, banned: !u.banned, badge: !u.banned ? 'Banned' : 'Newbie', status: !u.banned ? 'Banned' : 'Regular' } : u));
  }

  async function setRole(user, role) {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, action: 'set_role', role }) });
    if (res.ok) setUsers((list) => list.map((u) => u.id === user.id ? { ...u, role } : u));
  }

  return (
    <div className="container">
      <h1 className="sitetitle">USER MANAGEMENT</h1>
      <p>[<Link href="/admin">Back to dashboard</Link>]</p>

      <div className="post user-search-box">
        <b>Find a user</b><br />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Display name, anonymous ID, role..." aria-label="Search users" style={{ width: 'min(420px, 100%)' }} />{' '}
        {search && <button type="button" onClick={() => setSearch('')}>[Clear]</button>}
        <div className="muted">Showing {filteredUsers.length} of {users.length} users.</div>
      </div>

      <table className="admin"><thead><tr>
        <th>User</th><th>Anonymous ID</th><th>Display Name</th><th>Badge</th><th>Role</th><th>Status</th><th>Posts</th><th>Joined</th><th>Actions</th>
      </tr></thead><tbody>
        {filteredUsers.map((u) => <tr key={u.id}>
          <td><Link href={`/user/${u.anonId}`}>{userLabel(u)}</Link></td>
          <td>#{u.anonId}</td>
          <td>{u.displayName && u.displayName !== 'Anonymous' ? u.displayName : <span className="muted">(no display name)</span>}</td>
          <td>{u.badge}</td>
          <td><select value={u.role} onChange={(e) => setRole(u, e.target.value)} style={{ fontSize: 11 }}><option value="user">user</option><option value="moderator">moderator</option><option value="administrator">administrator</option></select></td>
          <td>{u.status}</td><td>{u.postCount}</td><td>{fmt(u.createdAt)}</td>
          <td><a href="#" onClick={(e) => { e.preventDefault(); toggleBan(u); }}>[{u.banned ? 'Unban' : 'Ban'}]</a></td>
        </tr>)}
      </tbody></table>
      {filteredUsers.length === 0 && <p>No matching users.</p>}
    </div>
  );
}
