import { useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req }) {
  if (!(await isModeratorReq(req))) return { redirect: { destination: '/admin/login', permanent: false } };
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { warnings: { orderBy: { createdAt: 'desc' }, take: 3 } } });
  return { props: { users: JSON.parse(JSON.stringify(users)) } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' });
}

export default function ModUsers({ users: initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [warnUser, setWarnUser] = useState(null);
  const [warnReason, setWarnReason] = useState('');
  const [warnDuration, setWarnDuration] = useState('24h');

  async function action(user, action) {
    if (action === 'delete_user' && !confirm(`Delete/anonymize user #${user.anonId}? Their posts will be hidden and their account anonymized.`)) return;
    const res = await fetch('/api/mod/moderate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, userId: user.id }),
    });
    if (!res.ok) return alert('Action failed.');
    setUsers(users.map((u) => {
      if (u.id !== user.id) return u;
      if (action === 'ban_user') return { ...u, banned: true, badge: 'Banned', status: 'Banned' };
      if (action === 'unban_user') return { ...u, banned: false, badge: 'Newbie', status: 'Regular' };
      if (action === 'hide_user') return { ...u, status: 'Hidden' };
      if (action === 'restore_user') return { ...u, status: 'Regular' };
      return { ...u, displayName: 'Deleted user', banned: true, status: 'Deleted', recoveryKeyHash: null };
    }));
  }

  async function issueWarning(e) {
    e.preventDefault();
    const res = await fetch('/api/mod/warnings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: warnUser.id, reason: warnReason, duration: warnDuration }),
    });
    if (!res.ok) return alert('Warning could not be issued.');
    setWarnUser(null); setWarnReason(''); window.location.reload();
  }

  return (
    <div className="container">
      <h1 className="sitetitle">USER MANAGEMENT</h1>
      <p>[<Link href="/mod">Back to moderator space</Link>]</p>
      {warnUser && <div className="post warn-form">
        <b>Issue Warning to {warnUser.displayName || 'Anonymous #' + warnUser.anonId}</b>
        <form onSubmit={issueWarning}>
          <div>Reason: <input type="text" value={warnReason} onChange={(e) => setWarnReason(e.target.value)} required /></div>
          <div>Duration: <select value={warnDuration} onChange={(e) => setWarnDuration(e.target.value)}>
            <option value="24h">24 hours</option><option value="3d">3 days</option><option value="7d">7 days</option><option value="permanent">Permanent</option>
          </select></div>
          <button type="submit">Issue Warning</button> <button type="button" onClick={() => setWarnUser(null)}>Cancel</button>
        </form>
      </div>}

      <table className="admin"><thead><tr>
        <th>Anonymous ID</th><th>Display Name</th><th>Badge</th><th>Status</th><th>Posts</th><th>Joined</th><th>Warnings</th><th>Actions</th>
      </tr></thead><tbody>
        {users.map((u) => <tr key={u.id}>
          <td>#{u.anonId}</td>
          <td><Link href={`/user/${u.anonId}`}>{u.displayName || '—'}</Link></td>
          <td>{u.badge}</td><td>{u.status}</td><td>{u.postCount}</td><td>{fmt(u.createdAt)}</td><td>{u.warnings.length}</td>
          <td>
            <a href="#" onClick={(e) => { e.preventDefault(); setWarnUser(u); }}>[Warn]</a>{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); action(u, u.banned ? 'unban_user' : 'ban_user'); }}>[{u.banned ? 'Unban' : 'Ban'}]</a>{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); action(u, u.status === 'Hidden' ? 'restore_user' : 'hide_user'); }}>[{u.status === 'Hidden' ? 'Show' : 'Hide'}]</a>{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); action(u, 'delete_user'); }}>[Delete]</a>
          </td>
        </tr>)}
      </tbody></table>
    </div>
  );
}
