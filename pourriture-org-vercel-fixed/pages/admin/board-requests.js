import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const requests = await prisma.boardRequest.findMany({ orderBy: { createdAt: 'asc' }, take: 100 });
  return { props: { requests: JSON.parse(JSON.stringify(requests)) } };
}

export default function BoardRequests({ requests }) {
  async function review(id, action) {
    const res = await fetch('/api/admin/board-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
    if (!res.ok) { const d = await res.json(); return alert(d.error || 'Action failed.'); }
    window.location.reload();
  }
  return <div className="container">
    <h1 className="sitetitle">BOARD REQUESTS</h1>
    <p>[<Link href="/admin">Admin</Link>] [<Link href="/admin/boards">Board Management</Link>]</p>
    {requests.length === 0 && <p>No board requests.</p>}
    {requests.map((r) => <div className="post" key={r.id}>
      <b>{r.boardId} — {r.name}</b> <span className="muted">[{r.status}]</span>
      <div>{r.description}</div>
      {r.rules && <div><b>Rules:</b> {r.rules}</div>}
      {r.reason && <div><b>Reason:</b> {r.reason}</div>}
      <div className="muted">Requester: {r.requesterAnonId || 'anonymous'} — {new Date(r.createdAt).toLocaleString()}</div>
      {r.status === 'pending' && <div className="actions"><a href="#" onClick={(e) => { e.preventDefault(); review(r.id, 'approve'); }}>[Approve]</a>{' '}<a href="#" onClick={(e) => { e.preventDefault(); review(r.id, 'reject'); }}>[Reject]</a></div>}
    </div>)}
  </div>;
}
