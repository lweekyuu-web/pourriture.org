import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const reports = await prisma.report.findMany({
    where: { resolved: false },
    include: { post: { include: { thread: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return { props: { reports: JSON.parse(JSON.stringify(reports)) } };
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
      <h1 className="sitetitle">Reports</h1>
      {reports.length === 0 && <p>No open reports.</p>}
      {reports.map((r) => (
        <div className="post" key={r.id}>
          <div><b>{r.reason}</b> — post #{r.postId} in thread #{r.post.threadId}</div>
          <div className="content">{r.post.content}</div>
          <div className="actions">
            <a href="#" onClick={() => act('hide_post', { postId: r.postId })}>[Hide post]</a>
            <a href="#" onClick={() => act('delete_post', { postId: r.postId })}>[Delete post]</a>
            <a href="#" onClick={() => act('lock_thread', { threadId: r.post.threadId })}>[Lock thread]</a>
            <a href="#" onClick={() => act('resolve_report', { reportId: r.id })}>[Mark resolved]</a>
          </div>
        </div>
      ))}
    </div>
  );
}
