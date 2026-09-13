import Link from 'next/link';
import prisma from '../../lib/prisma';

export async function getServerSideProps({ params }) {
  const user = await prisma.user.findUnique({
    where: { anonId: params.anonId },
    include: { posts: { take: 20, orderBy: { createdAt: 'desc' }, include: { thread: { include: { board: true } } } } },
  });
  if (!user) return { notFound: true };

  const boardsUsed = await prisma.post.findMany({ where: { authorId: user.id }, select: { thread: { select: { boardId: true } } }, distinct: ['threadId'], take: 100 });
  const boardIds = [...new Set(boardsUsed.map((p) => p.thread.boardId))];

  return { props: { user: JSON.parse(JSON.stringify({
    anonId: user.anonId,
    displayName: user.displayName || 'Anonymous',
    badge: user.badge,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    postCount: user.postCount,
    bio: user.bio || '',
    signature: user.signature || '',
    avatarUrl: user.avatarUrl || '',
    bannerUrl: user.bannerUrl || '',
    profileTheme: user.profileTheme,
    profileLayout: user.profileLayout,
    profileGifUrl: user.profileGifUrl || '',
    avatarStatus: user.avatarStatus,
    boardIds,
    recentPosts: user.posts.map((p) => ({ postNumber: p.postNumber, content: p.content.slice(0, 160), createdAt: p.createdAt.toISOString(), boardId: p.thread.board.id, threadId: p.thread.id })),
  })) } };
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'utc' });
}

export default function Profile({ user }) {
  const themeClass = `profile-theme-${user.profileTheme || 'classic'}`;
  return (
    <main className={`container profile-page ${themeClass}`}>
      <div className="topnav">[<Link href="/">Return</Link>] [<Link href="/profile/edit">Edit my profile</Link>]</div>
      {user.bannerUrl && <div className="profile-banner"><img src={user.bannerUrl} alt="" /></div>}
      <section className={`profile-header ${user.profileLayout === 'profile' ? 'profile-layout-first' : ''}`}>
        {user.avatarUrl && user.avatarStatus === 'approved' ? <img className="profile-avatar" src={user.avatarUrl} alt="" /> : <div className="profile-avatar avatar-placeholder">?</div>}
        <div className="profile-title">
          <h1 className="sitetitle">{user.displayName}</h1>
          <div><span className="badge">[{user.badge}]</span> <span className="user-status">[{user.status}]</span></div>
          <div className="profile-id">Anonymous #{user.anonId}</div>
        </div>
      </section>

      {user.profileGifUrl && <div className="profile-gif"><img src={user.profileGifUrl} alt="Profile GIF" /></div>}
      {user.bio && <div className="profile-bio"><b>About:</b><br />{user.bio}</div>}

      <div className="profile-box">
        <table className="admin"><tbody>
          <tr><th>Joined</th><td>{fmt(user.createdAt)}</td></tr>
          <tr><th>Posts</th><td>{user.postCount}</td></tr>
          <tr><th>Boards</th><td>{user.boardIds.map((b, i) => <span key={b}>{i > 0 && ' '}<Link href={`/${b.replace(/\//g, '')}`}>{b}</Link></span>)}</td></tr>
        </tbody></table>
      </div>

      <h3>Recent Posts</h3>
      {user.recentPosts.length === 0 && <p className="muted">No posts to show.</p>}
      {user.recentPosts.map((p) => {
        const slug = p.boardId.replace(/\//g, '');
        return <div className="post" key={p.postNumber}>
          <div className="post-head"><span className="postnum">→ {p.postNumber}</span> <Link href={`/${slug}`}>{p.boardId}</Link> <span className="date">{fmt(p.createdAt)}</span></div>
          <div className="content">{p.content}</div>
          {user.signature && <div className="profile-signature">— {user.signature}</div>}
          <div className="actions"><Link href={`/${slug}/thread/${p.threadId}`}>[View thread]</Link></div>
        </div>;
      })}

      <div className="footer">pourriture.org — user profile</div>
    </main>
  );
}
