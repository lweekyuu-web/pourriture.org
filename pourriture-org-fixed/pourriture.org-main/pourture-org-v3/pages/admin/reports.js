import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const reports = await prisma.report.findMany({
    where: { status: 'pending' },
    include: { post: { include: { thread: { include: { board: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return { props: { reports: JSON.parse(JSON.stringify(reports)) } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function AdminReports({ reports }) {
  async function act(action, body) {
    await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    window.location.reload();
  }

  return (
    <div className="container">
      <h1 className="sitetitle">REPORT QUEUE</h1>
      <p>[<Link href="/admin">Back to dashboard</Link>]</p>

      {reports.length === 0 && <p>No pending reports.</p>}

      {reports.map((r) => {
        const slug = r.post?.thread?.board?.id?.replace(/\//g, '') || '';
        return (
          <div className="post report-item" key={r.id}>
            <div className="head">
              <b>#{r.id}</b>{' '}
              <span className="meta">Post: {r.post?.postNumber || 'deleted'}</span>{' '}
              <span className="meta">Reason: {r.reason}</span>{' '}
              <span className="meta">Status: {r.status}</span>{' '}
              <span className="date">{fmt(r.createdAt)}</span>
            </div>
            {r.details && <div className="muted">Details: {r.details}</div>}
            {r.post && (
              <div className="content">{r.post.hidden ? '[post hidden]' : r.post.content}</div>
            )}
            <div className="actions">
              {r.post && slug && <Link href={`/${slug}/thread/${r.post.threadId}`}>[View]</Link>}{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); act('resolve_report', { reportId: r.id }); }}>[Resolve]</a>{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); act('dismiss_report', { reportId: r.id }); }}>[Dismiss]</a>{' '}
              {r.post && <>
                <a href="#" onClick={(e) => { e.preventDefault(); act('hide_post', { postId: r.post.id }); }}>[Hide]</a>{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); act('delete_post', { postId: r.post.id }); }}>[Delete]</a>{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); act('lock_thread', { threadId: r.post.threadId }); }}>[Lock Thread]</a>
              </>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
