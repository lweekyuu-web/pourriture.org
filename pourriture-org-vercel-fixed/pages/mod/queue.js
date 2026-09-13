import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req }) {
  if (!(await isModeratorReq(req))) return { redirect: { destination: '/admin/login', permanent: false } };
  const posts = await prisma.post.findMany({
    where: { status: 'review' },
    include: { thread: { include: { board: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  return { props: { posts: JSON.parse(JSON.stringify(posts)) } };
}

export default function ModerationQueue({ posts: initialPosts }) {
  async function review(postId, action) {
    const res = await fetch('/api/mod/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, postId }),
    });
    if (res.ok) window.location.reload();
    else alert('Moderation action failed.');
  }

  return (
    <div className="container">
      <h1 className="sitetitle">MODERATION QUEUE</h1>
      <p>[<Link href="/mod">Moderator Space</Link>] [<Link href="/admin">Admin</Link>]</p>
      <p className="muted">Items held for review stay hidden from normal visitors until a moderator approves them.</p>
      {initialPosts.length === 0 ? <p>No items waiting for review.</p> : initialPosts.map((p) => (
        <article className="post" key={p.id}>
          <div className="post-head"><b>{p.displayName}</b> — {p.thread.board.id} / thread #{p.thread.id} — No.{p.postNumber}</div>
          <div className="notification">HELD FOR MODERATOR REVIEW</div>
          <div className="content">{p.content || '[GIF-only post]'}</div>
          {p.gifUrl && <div className="post-gif"><img src={p.gifUrl} alt="Submitted GIF" /></div>}
          <div className="actions">
            <a href="#" onClick={(e) => { e.preventDefault(); review(p.id, 'approve_review'); }}>[Approve]</a>
            <a href="#" onClick={(e) => { e.preventDefault(); review(p.id, 'reject_review'); }}>[Reject]</a>
          </div>
        </article>
      ))}
    </div>
  );
}
