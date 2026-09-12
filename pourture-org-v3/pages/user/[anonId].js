import Link from 'next/link';
import prisma from '../../lib/prisma';

export async function getServerSideProps({ params }) {
  const user = await prisma.user.findUnique({
    where: { anonId: params.anonId },
    include: { posts: { take: 20, orderBy: { createdAt: 'desc' }, include: { thread: { include: { board: true } } } } },
  });

  if (!user) return { notFound: true };

  // Get boards used by this user
  const boardsUsed = await prisma.post.findMany({
    where: { authorId: user.id },
    select: { thread: { select: { boardId: true } } },
    distinct: ['threadId'],
    take: 100,
  });
  const boardIds = [...new Set(boardsUsed.map((p) => p.thread.boardId))];

  return {
    props: {
      user: JSON.parse(JSON.stringify({
        anonId: user.anonId,
        displayName: user.displayName || 'Anonymous',
        badge: user.badge,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        postCount: user.postCount,
        boardIds,
        recentPosts: user.posts.map((p) => ({
          postNumber: p.postNumber,
          content: p.content.slice(0, 100),
          createdAt: p.createdAt.toISOString(),
          boardId: p.thread.board.id,
          threadId: p.thread.id,
        })),
      })),
    },
  };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'utc' });
}

export default function Profile({ user }) {
  return (
    <div className="container">
      <div className="topnav">
        [<Link href="/">Return</Link>]
      </div>
      <h1 className="sitetitle">USER PROFILE</h1>

      <div className="profile-box">
        <table className="admin">
          <tbody>
            <tr><th>Name</th><td><span className="name">{user.displayName}</span> <span className="badge">[{user.badge}]</span> <span className="user-status">[{user.status}]</span></td></tr>
            <tr><th>Internal ID</th><td>#{user.anonId}</td></tr>
            <tr><th>Joined</th><td>{fmt(user.createdAt)}</td></tr>
            <tr><th>Posts</th><td>{user.postCount}</td></tr>
            <tr><th>Boards</th><td>{user.boardIds.map((b) => <Link key={b} href={`/${b.replace(/\//g, '')}`}>{b}</Link>).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' ', el], [])}</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Recent Posts</h3>
      {user.recentPosts.length === 0 && <p className="muted">No posts to show.</p>}
      {user.recentPosts.map((p, i) => {
        const slug = p.boardId.replace(/\//g, '');
        return (
          <div className="post" key={i}>
            <span className="postnum">→ {p.postNumber}</span>{' '}
            <Link href={`/${slug}`}>{p.boardId}</Link>{' '}
            <span className="date">{fmt(p.createdAt)}</span>
            <div className="content">{p.content}</div>
            <div className="actions"><Link href={`/${slug}/thread/${p.threadId}`}>[View thread]</Link></div>
          </div>
        );
      })}

      <div className="footer">pourriture.org — user profile</div>
    </div>
  );
}
