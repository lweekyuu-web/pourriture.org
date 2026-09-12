import { useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const [boards, mods] = await Promise.all([
    prisma.board.findMany({ orderBy: { id: 'asc' } }),
    prisma.boardModerator.findMany({ include: { user: true, board: true } }),
  ]);
  const users = await prisma.user.findMany({
    where: { OR: [{ role: 'moderator' }, { role: 'administrator' }] },
    orderBy: { createdAt: 'asc' },
  });
  return {
    props: {
      boards: JSON.parse(JSON.stringify(boards)),
      mods: JSON.parse(JSON.stringify(mods)),
      users: JSON.parse(JSON.stringify(users)),
    },
  };
}

const ALL_PERMS = ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS', 'BAN_USERS', 'EDIT_RULES', 'MANAGE_MODERATORS', 'MANAGE_BOARDS'];

export default function AdminModerators({ boards, mods: initialMods, users }) {
  const [mods, setMods] = useState(initialMods);
  const [form, setForm] = useState({ boardId: '', userId: '', permissions: ['VIEW_REPORTS', 'MODERATE_POSTS', 'LOCK_THREADS'] });

  async function assignMod(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/moderators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const m = await res.json();
      setMods([...mods, m]);
      setForm({ ...form, userId: '' });
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function removeMod(id) {
    if (!confirm('Remove this moderator?')) return;
    await fetch(`/api/admin/moderators?id=${id}`, { method: 'DELETE' });
    setMods(mods.filter((m) => m.id !== id));
  }

  function togglePerm(perm) {
    setForm({
      ...form,
      permissions: form.permissions.includes(perm)
        ? form.permissions.filter((p) => p !== perm)
        : [...form.permissions, perm],
    });
  }

  return (
    <div className="container">
      <h1 className="sitetitle">Board Moderators</h1>
      <p>[<Link href="/admin">Back to dashboard</Link>]</p>

      <table className="admin">
        <thead>
          <tr><th>Board</th><th>Moderator</th><th>Permissions</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {mods.map((m) => (
            <tr key={m.id}>
              <td>{m.board.id}</td>
              <td>{m.user.displayName || 'Anonymous #' + m.user.anonId}</td>
              <td>{m.permissions.join(', ')}</td>
              <td><a href="#" onClick={(e) => { e.preventDefault(); removeMod(m.id); }}>[Remove]</a></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Assign Moderator</h2>
      <form onSubmit={assignMod} className="post">
        <div>Board:
          <select value={form.boardId} onChange={(e) => setForm({ ...form, boardId: e.target.value })} required>
            <option value="">— select —</option>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.id} {b.name}</option>)}
          </select>
        </div>
        <div>User:
          <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required>
            <option value="">— select —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.displayName || 'Anonymous #' + u.anonId} ({u.role})</option>)}
          </select>
        </div>
        <div>Permissions:</div>
        <div className="perm-list">
          {ALL_PERMS.map((p) => (
            <label key={p}>
              <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} /> {p}
            </label>
          ))}
        </div>
        <button type="submit">Assign</button>
      </form>
    </div>
  );
}
