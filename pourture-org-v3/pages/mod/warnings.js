import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req }) {
  const isMod = await isModeratorReq(req);
  if (!isMod) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  const warnings = await prisma.warning.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return { props: { warnings: JSON.parse(JSON.stringify(warnings)) } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function ModWarnings({ warnings }) {
  return (
    <div className="container">
      <h1 className="sitetitle">WARNINGS</h1>
      <p>[<Link href="/mod">Back to moderator space</Link>]</p>

      <table className="admin">
        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Reason</th>
            <th>Duration</th>
            <th>Expires</th>
            <th>Issued</th>
          </tr>
        </thead>
        <tbody>
          {warnings.map((w) => (
            <tr key={w.id}>
              <td>{w.id}</td>
              <td><Link href={`/user/${w.user.anonId}`}>{w.user.displayName || 'Anonymous #' + w.user.anonId}</Link></td>
              <td>{w.reason}</td>
              <td>{w.duration}</td>
              <td>{w.expiresAt ? fmt(w.expiresAt) : '—'}</td>
              <td>{fmt(w.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {warnings.length === 0 && <p className="muted">No warnings issued.</p>}
    </div>
  );
}
