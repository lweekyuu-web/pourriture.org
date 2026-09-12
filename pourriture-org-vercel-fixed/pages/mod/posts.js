import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req, query }) {
  const isMod = await isModeratorReq(req);
  if (!isMod) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const perPage = 50;

  const posts = await prisma.post.findMany({
    include: { thread: { include: { board: true } } },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  const total = await prisma.post.count();

  return {
    props: {
      posts: JSON.parse(JSON.stringify(posts)),
      page,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function ModPosts({ posts, page, totalPages }) {
  async function act(action, postId) {
    await fetch('/api/mod/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, postId }),
    });
    window.location.reload();
  }

  return (
    <div className="container">
      <h1 className="sitetitle">POST MANAGEMENT</h1>
      <p>[<Link href="/mod">Back to moderator space</Link>]</p>

      {posts.map((p) => {
        const slug = p.thread.board.id.replace(/\//g, '');
        return (
          <div className="post" key={p.id}>
            <input type="checkbox" />{' '}
            <span className="name">{p.displayName}</span>{' '}
            <span className="date">{fmt(p.createdAt)}</span>{' '}
            <span className="postnum">→ {p.postNumber}</span>{' '}
            <Link href={`/${slug}/thread/${p.threadId}`}>{p.thread.board.id}</Link>
            <div className="content">{p.hidden ? '[post hidden]' : p.content}</div>
            <div className="actions">
              {p.hidden ? (
                <a href="#" onClick={(e) => { e.preventDefault(); act('restore_post', p.id); }}>[Restore]</a>
              ) : (
                <a href="#" onClick={(e) => { e.preventDefault(); act('hide_post', p.id); }}>[Hide]</a>
              )}{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); if (confirm('Delete this post?')) act('delete_post', p.id); }}>[Delete]</a>{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); act('lock_thread', { threadId: p.threadId }); }}>[Lock Thread]</a>
            </div>
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            p === page
              ? <span key={p} className="page-current">[{p}]</span>
              : <Link key={p} href={`/mod/posts?page=${p}`}>[{p}]</Link>
          ))}
        </div>
      )}
    </div>
  );
}
