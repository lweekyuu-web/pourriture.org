import { useMemo, useState } from 'react';
import Link from 'next/link';
import { isAdminRequest } from '../../lib/admin';
import prisma from '../../lib/prisma';

const ADMIN_PERMISSIONS = [
  ['DASHBOARD', 'Dashboard'], ['USERS', 'Users'], ['BADGES', 'Badges'], ['BOARDS', 'Boards'],
  ['BOARD_REQUESTS', 'Board requests'], ['MODERATION', 'Moderation'], ['REPORTS', 'Reports'],
  ['PROFILE_MEDIA', 'Profile media'], ['SECURITY', 'Security'], ['WIDGETS', 'Widgets'],
  ['SETTINGS', 'Settings'], ['STATISTICS', 'Statistics'],
];

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const [users, badges] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 1000, include: { badges: { include: { badge: true }, orderBy: { assignedAt: 'asc' } } } }),
    prisma.badge.findMany({ orderBy: [{ level: 'asc' }, { name: 'asc' }] }),
  ]);
  const clean = users.map((u) => ({ ...u, assignedBadges: u.badges.map((x) => x.badge), badges: undefined }));
  return { props: { users: JSON.parse(JSON.stringify(clean)), badges: JSON.parse(JSON.stringify(badges)) } };
}

function fmt(dateStr) { const d = new Date(dateStr); return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }); }
function userLabel(u) { return u.displayName && u.displayName !== 'Anonymous' ? u.displayName : `User #${u.anonId}`; }

export default function AdminUsers({ users: initialUsers, badges }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const selected = users.find((u) => u.id === selectedId) || null;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.displayName, u.anonId, u.role, u.status, u.badge, u.adminTitle, ...(u.assignedBadges || []).map((b) => b.name)]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [users, search]);

  async function post(action, body = {}) {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || 'Update failed.'); return null; }
    if (data.user) setUsers((list) => list.map((u) => u.id === data.user.id ? { ...u, ...data.user } : u));
    return data;
  }

  async function setRole(user, role) { await post('set_role', { userId: user.id, role }); }
  async function badgeAction(user, badgeId, action) { await post(action, { userId: user.id, badgeId }); }

  async function saveAdminAccess() {
    if (!selected || selected.role !== 'administrator') return;
    const checks = Array.from(document.querySelectorAll('input[data-admin-permission]:checked')).map((el) => el.value);
    const title = document.getElementById('admin-title')?.value || '';
    await post('set_admin_access', { userId: selected.id, adminTitle: title, adminPermissions: checks });
  }

  return <div className="container">
    <h1 className="sitetitle">USER & STAFF MANAGEMENT</h1>
    <p>[<Link href="/admin">Back to dashboard</Link>] [<Link href="/admin/badges">Badge definitions</Link>] [<Link href="/admin/moderators">Board moderators</Link>]</p>

    <div className="post user-search-box"><b>Find a user / badge holder</b><br />
      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Display name, anonymous ID, role, badge..." aria-label="Search users" style={{ width: 'min(520px, 100%)' }} />{' '}
      {search && <button type="button" onClick={() => setSearch('')}>[Clear]</button>}
      <div className="muted">Showing {filteredUsers.length} of {users.length} users. Search also matches every assigned badge.</div>
    </div>

    <table className="admin"><thead><tr><th>User</th><th>ID</th><th>Badges</th><th>Role</th><th>Status</th><th>Posts</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
      {filteredUsers.map((u) => <tr key={u.id}>
        <td><Link href={`/user/${u.anonId}`}>{userLabel(u)}</Link></td><td>#{u.anonId}</td>
        <td>{(u.assignedBadges || []).length ? <div>{u.assignedBadges.map((b) => <span key={b.id} className="badge badge-sparkle" style={{ borderColor: b.color, color: b.color, marginRight: 3 }}>[{b.name}]</span>)}</div> : <span className="muted">none</span>}
          <div><select defaultValue="" onChange={(e) => { if (e.target.value) badgeAction(u, e.target.value, 'add_badge'); e.target.value = ''; }} style={{ fontSize: 11, maxWidth: 180 }}><option value="">+ assign badge...</option>{badges.map((b) => <option key={b.id} value={b.id}>{b.name} (L{b.level})</option>)}</select></div>
        </td>
        <td><select value={u.role} onChange={(e) => setRole(u, e.target.value)} style={{ fontSize: 11 }}><option value="user">user</option><option value="moderator">moderator</option><option value="administrator">administrator</option></select></td>
        <td>{u.status}{u.adminTitle && <><br /><span className="muted">{u.adminTitle}</span></>}</td><td>{u.postCount}</td><td>{fmt(u.createdAt)}</td>
        <td><button type="button" onClick={() => setSelectedId(u.id)}>[Manage]</button></td>
      </tr>)}
    </tbody></table>
    {filteredUsers.length === 0 && <p>No matching users.</p>}

    {selected && <div className="post" style={{ marginTop: 12 }}>
      <b>USER / STAFF / BADGES: {userLabel(selected)}</b> — #{selected.anonId}<br />
      <div style={{ marginTop: 6 }}>Legacy badge: <b>{selected.badge}</b> · Role: <b>{selected.role}</b></div>
      <div style={{ marginTop: 6 }}><b>Assigned badges</b><br />
        {(selected.assignedBadges || []).length === 0 && <span className="muted">No custom badges assigned.</span>}
        {(selected.assignedBadges || []).map((b) => <div key={b.id} style={{ marginTop: 3 }}><span className="badge badge-sparkle" style={{ borderColor: b.color, color: b.color }}>[{b.name}]</span> <span className="muted">Level {b.level} · {b.requirement || 'manual'}</span> <button type="button" onClick={() => badgeAction(selected, b.id, 'remove_badge')}>[Remove]</button></div>)}
      </div>
      <div style={{ marginTop: 8 }}><b>Add another badge</b> <select defaultValue="" onChange={(e) => { if (e.target.value) badgeAction(selected, e.target.value, 'add_badge'); e.target.value = ''; }}><option value="">Choose...</option>{badges.map((b) => <option key={b.id} value={b.id}>{b.name} — L{b.level}</option>)}</select></div>
      <p className="muted">You can assign several badges at once. Levels are metadata for ranking/display; admins can manually award any badge. Administrator staff status remains protected from moderator badge management.</p>
      <label>Admin title / function<br /><input id="admin-title" type="text" defaultValue={selected.adminTitle || ''} placeholder="e.g. Glitter Admin, Community Admin" maxLength={40} style={{ width: 'min(420px, 100%)' }} /></label>
      {selected.role === 'administrator' ? <>
        <div style={{ marginTop: 8 }}><b>Admin interfaces / tasks</b></div>
        <div className="perm-list">{ADMIN_PERMISSIONS.map(([value, label]) => <label key={value}><input data-admin-permission value={value} type="checkbox" defaultChecked={(selected.adminPermissions || []).includes(value)} /> {label}</label>)}</div>
        <button type="button" onClick={saveAdminAccess}>[Save admin access]</button>
      </> : <p className="muted">Set the Role to <b>administrator</b> above to configure delegated admin interfaces and tasks.</p>}
      <button type="button" onClick={() => setSelectedId('')} style={{ marginLeft: 8 }}>[Close]</button>
    </div>}
  </div>;
}
