import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req }) {
  if (!(await isModeratorReq(req))) return { redirect: { destination: '/admin/login', permanent: false } };
  const [posts, mediaUsers] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'review' },
      include: { thread: { include: { board: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
    prisma.user.findMany({
      where: { OR: [{ avatarStatus: 'review' }, { bannerStatus: 'review' }] },
      select: { id: true, anonId: true, displayName: true, avatarUrl: true, bannerUrl: true, avatarStatus: true, bannerStatus: true, avatarAiFlagged: true, bannerAiFlagged: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
  ]);
  return { props: { posts: JSON.parse(JSON.stringify(posts)), mediaUsers: JSON.parse(JSON.stringify(mediaUsers)) } };
}

export default function ModerationQueue({ posts, mediaUsers }) {
  async function reviewPost(postId, action) {
    const res = await fetch('/api/mod/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, postId }),
    });
    if (res.ok) window.location.reload();
    else alert('Moderation action failed.');
  }

  async function reviewMedia(userId, type, action) {
    const res = await fetch('/api/admin/profile-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, action }),
    });
    if (res.ok) window.location.reload();
    else alert('Media moderation failed.');
  }

  const total = posts.length + mediaUsers.reduce((n, u) => n + (u.avatarStatus === 'review' ? 1 : 0) + (u.bannerStatus === 'review' ? 1 : 0), 0);

  return (
    <div className="container">
      <h1 className="sitetitle">MODERATION QUEUE</h1>
      <p>[<Link href="/mod">Moderator Space</Link>] [<Link href="/mod/reports">Reports</Link>] [<Link href="/admin">Admin</Link>]</p>
      <p className="muted">Everything held by automatic checks appears here before it becomes public. AI is only a first-pass filter; human moderators make the final decision.</p>
      <div className="stats-block">Pending items: {total}</div>

      <h2>POSTS / GIFS</h2>
      {posts.length === 0 ? <p>No posts waiting for review.</p> : posts.map((p) => (
        <article className="post" key={`post-${p.id}`}>
          <div className="post-head"><b>{p.displayName}</b> — {p.thread.board.id} / thread #{p.thread.id} — No.{p.postNumber}</div>
          <div className="notification">HELD FOR MODERATOR REVIEW</div>
          <div className="content">{p.content || '[GIF-only post]'}</div>
          {p.gifUrl && <div className="post-gif"><img src={p.gifUrl} alt="Submitted GIF" /></div>}
          <div className="actions">
            <a href="#" onClick={(e) => { e.preventDefault(); reviewPost(p.id, 'approve_review'); }}>[Approve]</a>{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); reviewPost(p.id, 'reject_review'); }}>[Reject]</a>
          </div>
        </article>
      ))}

      <h2>PROFILE IMAGES</h2>
      {mediaUsers.length === 0 ? <p>No profile images waiting for review.</p> : mediaUsers.map((u) => (
        <article className="post media-review" key={`media-${u.id}`}>
          <div><b>{u.displayName || 'Anonymous'}</b> <span className="muted">#{u.anonId}</span></div>
          {u.avatarStatus === 'review' && <div className="media-review-item"><h3>Avatar {u.avatarAiFlagged && <span className="badge badge-hot">[AI FLAG]</span>}</h3><img className="moderation-media-preview" src={u.avatarUrl} alt="Pending avatar" /><div><button onClick={() => reviewMedia(u.id, 'avatar', 'approve')}>[Approve]</button> <button onClick={() => reviewMedia(u.id, 'avatar', 'reject')}>[Reject + remove]</button></div></div>}
          {u.bannerStatus === 'review' && <div className="media-review-item"><h3>Banner {u.bannerAiFlagged && <span className="badge badge-hot">[AI FLAG]</span>}</h3><img className="moderation-banner-preview" src={u.bannerUrl} alt="Pending banner" /><div><button onClick={() => reviewMedia(u.id, 'banner', 'approve')}>[Approve]</button> <button onClick={() => reviewMedia(u.id, 'banner', 'reject')}>[Reject + remove]</button></div></div>}
        </article>
      ))}
    </div>
  );
}
