import { useMemo, useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const [boards, mods, users] = await Promise.all([
    prisma.board.findMany({ orderBy: { id: 'asc' } }),
    prisma.boardModerator.findMany({ include: { user: true, board: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' }, take: 1000 }),
  ]);
  return { props: { boards: JSON.parse(JSON.stringify(boards)), mods: JSON.parse(JSON.stringify(mods)), users: JSON.parse(JSON.stringify(users)) } };
}

const ALL_PERMS = ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS', 'BAN_USERS', 'EDIT_RULES', 'MANAGE_MODERATORS', 'MANAGE_BOARDS'];
function userLabel(u) { return u.displayName && u.displayName !== 'Anonymous' ? u.displayName : `User #${u.anonId}`; }

export default function AdminModerators({ boards, mods: initialMods, users }) {
  const [mods, setMods] = useState(initialMods);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ boardId: '', userId: '', permissions: ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS'] });
  const filteredUsers = useMemo(() => { const q = search.trim().toLowerCase(); return q ? users.filter((u) => [u.displayName, u.anonId, u.role, u.badge].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))) : users; }, [users, search]);

  async function assignMod(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/moderators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { const err = await res.json().catch(() => ({})); return alert(err.error || 'Unable to assign board moderator.'); }
    const m = await res.json(); setMods([...mods, m]); setForm({ ...form, userId: '' });
  }
  async function removeMod(id) {
    if (!confirm('Remove this board moderator assignment?')) return;
    const res = await fetch(`/api/admin/moderators?id=${id}`, { method: 'DELETE' });
    if (res.ok) setMods(mods.filter((m) => m.id !== id));
  }
  function togglePerm(perm) { setForm({ ...form, permissions: form.permissions.includes(perm) ? form.permissions.filter((p) => p !== perm) : [...form.permissions, perm] }); }

  return <div className="container">
    <h1 className="sitetitle">BOARD MODERATORS</h1>
    <p>[<Link href="/admin">Back to dashboard</Link>] [<Link href="/admin/users">User management</Link>]</p>
    <div className="notification">A board moderator gets moderation powers for the selected board. This does not expose the master admin password.</div>
    <table className="admin"><thead><tr><th>Board</th><th>User</th><th>Role</th><th>Badge</th><th>Permissions</th><th>Action</th></tr></thead><tbody>
      {mods.map((m) => <tr key={m.id}><td>{m.board.id}</td><td><Link href={`/user/${m.user.anonId}`}>{userLabel(m.user)}</Link></td><td>{m.user.role}</td><td>{m.user.badge}</td><td>{m.permissions.join(', ')}</td><td><a href="#" onClick={(e) => { e.preventDefault(); removeMod(m.id); }}>[Remove]</a></td></tr>)}
    </tbody></table>
    <h2>Assign a board moderator</h2>
    <form onSubmit={assignMod} className="post">
      <div>Find user: <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="name or anonymous ID" /></div>
      <div>User: <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required><option value="">— select —</option>{filteredUsers.map((u) => <option key={u.id} value={u.id}>{userLabel(u)} — {u.role} — [{u.badge}]</option>)}</select></div>
      <div>Board: <select value={form.boardId} onChange={(e) => setForm({ ...form, boardId: e.target.value })} required><option value="">— select —</option>{boards.map((b) => <option key={b.id} value={b.id}>{b.id} {b.name}</option>)}</select></div>
      <div>Permissions:</div><div className="perm-list">{ALL_PERMS.map((p) => <label key={p}><input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} /> {p}</label>)}</div>
      <button type="submit">[Assign moderator]</button>
    </form>
  </div>;
}
