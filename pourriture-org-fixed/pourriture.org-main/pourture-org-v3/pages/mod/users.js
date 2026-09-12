import { useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req }) {
  const isMod = await isModeratorReq(req);
  if (!isMod) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { warnings: { orderBy: { createdAt: 'desc' }, take: 3 } },
  });

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

  async function toggleBan(user) {
    const action = user.banned ? 'unban' : 'ban';
    await fetch('/api/mod/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action === 'ban' ? 'ban_user' : 'unban_user', userId: user.id }),
    });
    setUsers(users.map((u) => u.id === user.id ? { ...u, banned: !u.banned, badge: !u.banned ? 'Banned' : 'Newbie' } : u));
  }

  async function issueWarning(e) {
    e.preventDefault();
    await fetch('/api/mod/warnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: warnUser.id, reason: warnReason, duration: warnDuration }),
    });
    setWarnUser(null);
    setWarnReason('');
    window.location.reload();
  }

  return (
    <div className="container">
      <h1 className="sitetitle">USER MANAGEMENT</h1>
      <p>[<Link href="/mod">Back to moderator space</Link>]</p>

      {warnUser && (
        <div className="post warn-form">
          <b>Issue Warning to {warnUser.displayName || 'Anonymous #' + warnUser.anonId}</b>
          <form onSubmit={issueWarning}>
            <div>Reason: <input type="text" value={warnReason} onChange={(e) => setWarnReason(e.target.value)} required /></div>
            <div>Duration:
              <select value={warnDuration} onChange={(e) => setWarnDuration(e.target.value)}>
                <option value="24h">24 hours</option>
                <option value="3d">3 days</option>
                <option value="7d">7 days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <button type="submit">Issue Warning</button>
            <button type="button" onClick={() => setWarnUser(null)}>Cancel</button>
          </form>
        </div>
      )}

      <table className="admin">
        <thead>
          <tr>
            <th>Anonymous ID</th>
            <th>Display Name</th>
            <th>Badge</th>
            <th>Status</th>
            <th>Posts</th>
            <th>Joined</th>
            <th>Warnings</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>#{u.anonId}</td>
              <td><Link href={`/user/${u.anonId}`}>{u.displayName || '—'}</Link></td>
              <td>{u.badge}</td>
              <td>{u.status}</td>
              <td>{u.postCount}</td>
              <td>{fmt(u.createdAt)}</td>
              <td>{u.warnings.length}</td>
              <td>
                <a href="#" onClick={(e) => { e.preventDefault(); setWarnUser(u); }}>[Warn]</a>{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); toggleBan(u); }}>[{u.banned ? 'Unban' : 'Ban'}]</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
