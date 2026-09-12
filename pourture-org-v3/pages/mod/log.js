import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req }) {
  const isMod = await isModeratorReq(req);
  if (!isMod) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  const actions = await prisma.moderationAction.findMany({
    include: { moderator: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return { props: { actions: JSON.parse(JSON.stringify(actions)) } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function ModLog({ actions }) {
  return (
    <div className="container">
      <h1 className="sitetitle">MODERATION LOG</h1>
      <p>[<Link href="/mod">Back to moderator space</Link>]</p>

      <table className="admin">
        <thead>
          <tr>
            <th>Date</th>
            <th>Moderator</th>
            <th>Action</th>
            <th>Target</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((a) => (
            <tr key={a.id}>
              <td>{fmt(a.createdAt)}</td>
              <td>{a.moderator?.displayName || a.moderator?.anonId || 'system'}</td>
              <td>{a.action}</td>
              <td>{a.targetType} #{a.targetId}</td>
              <td>{a.reason || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {actions.length === 0 && <p className="muted">No moderation actions logged.</p>}
    </div>
  );
}
