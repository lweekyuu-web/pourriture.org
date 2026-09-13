import { useMemo, useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const users = await prisma.user.findMany({
    where: { OR: [{ banned: true }, { suspendedUntil: { gt: new Date() } }] },
    orderBy: [{ banned: 'desc' }, { suspendedUntil: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, anonId: true, displayName: true, role: true, status: true, banned: true, suspendedUntil: true, createdAt: true },
  });
  return { props: { users: JSON.parse(JSON.stringify(users)) } };
}

export default function BanRegistry({ users: initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.displayName, u.anonId, u.role, u.status].filter(Boolean).some((x) => String(x).toLowerCase().includes(q)));
  }, [users, search]);

  async function unban(userId) {
    const r = await fetch('/api/mod/moderate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unban_user', userId }) });
    if (r.ok) setUsers((list) => list.filter((u) => u.id !== userId));
    else alert('Unable to unban this user.');
  }

  return <main className="container">
    <div className="topnav">[<Link href="/admin">Admin</Link>] [<Link href="/admin/users">Users</Link>] [<Link href="/mod">Moderator Space</Link>]</div>
    <h1 className="sitetitle">BAN / SUSPENSION REGISTRY</h1>
    <p className="muted">Active bans and temporary posting suspensions. Only staff with the appropriate moderation access should use these controls.</p>
    <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or anonymous ID" aria-label="Search bans" style={{ width: 'min(420px, 100%)' }} />
    <p>{filtered.length} active restriction{filtered.length === 1 ? '' : 's'}.</p>
    <table className="admin"><thead><tr><th>User</th><th>ID</th><th>Role</th><th>Restriction</th><th>Until</th><th>Action</th></tr></thead><tbody>
      {filtered.map((u) => <tr key={u.id}>
        <td><Link href={`/user/${u.anonId}`}>{u.displayName || 'Anonymous'}</Link></td>
        <td>#{u.anonId}</td><td>{u.role}</td>
        <td>{u.banned ? <b>BANNED</b> : 'MUTED / SUSPENDED'}</td>
        <td>{u.banned ? 'permanent' : new Date(u.suspendedUntil).toLocaleString()}</td>
        <td><button type="button" onClick={() => unban(u.id)}>[Remove restriction]</button></td>
      </tr>)}
    </tbody></table>
    {filtered.length === 0 && <p>No active bans or suspensions.</p>}
  </main>;
}
