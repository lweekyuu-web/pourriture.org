import Link from 'next/link';
import { useEffect, useState } from 'react';
import prisma from '../../lib/prisma';

export async function getServerSideProps({ params }) {
  const user = await prisma.user.findUnique({ where: { anonId: params.anonId }, include: { posts: { take: 20, orderBy: { createdAt: 'desc' }, include: { thread: { include: { board: true } } } }, badges: { include: { badge: true }, orderBy: { assignedAt: 'asc' } } } });
  if (!user) return { notFound: true };
  const boardsUsed = await prisma.post.findMany({ where: { authorId: user.id }, select: { thread: { select: { boardId: true } } }, distinct: ['threadId'], take: 100 });
  const boardIds = [...new Set(boardsUsed.map((p) => p.thread.boardId))];
  const friendships = await prisma.friendship.findMany({ where: { OR: [{ requesterId: user.id }, { recipientId: user.id }], status: 'accepted' }, include: { requester: { select: { id: true, anonId: true, displayName: true, avatarUrl: true, avatarStatus: true } }, recipient: { select: { id: true, anonId: true, displayName: true, avatarUrl: true, avatarStatus: true } } }, orderBy: [{ topFriend: 'desc' }, { updatedAt: 'desc' }], take: 50 });
  const friends = friendships.map((f) => { const other = f.requesterId === user.id ? f.recipient : f.requester; return { anonId: other.anonId, displayName: other.displayName || 'Anonymous', avatarUrl: other.avatarStatus === 'approved' ? (other.avatarUrl || '') : '', topFriend: f.topFriend }; });
  const effectiveBadge = user.role === 'administrator' ? 'ADMIN' : user.role === 'moderator' && (!user.badge || user.badge === 'Newbie') ? 'MOD' : user.badge;
  const badges = [{ name: effectiveBadge, color: user.role === 'administrator' ? '#d1008f' : user.role === 'moderator' ? '#af0a0f' : '#777777', level: user.role === 'administrator' ? 100 : user.role === 'moderator' ? 80 : 0, system: true }, ...user.badges.map((x) => ({ name: x.badge.name, color: x.badge.color, level: x.badge.level, system: false }))];
  const uniqueBadges = badges.filter((b, i, arr) => arr.findIndex((x) => x.name === b.name) === i).sort((a, b) => b.level - a.level);
  return { props: { user: JSON.parse(JSON.stringify({ anonId: user.anonId, displayName: user.displayName || 'Anonymous', badge: effectiveBadge, role: user.role, adminTitle: user.adminTitle || '', status: user.status, createdAt: user.createdAt.toISOString(), postCount: user.postCount, bio: user.bio || '', signature: user.signature || '', avatarUrl: user.avatarStatus === 'approved' ? (user.avatarUrl || '') : '', bannerUrl: user.bannerStatus === 'approved' ? (user.bannerUrl || '') : '', profileTheme: user.profileTheme, profileLayout: user.profileLayout, profileNameColor: user.profileNameColor, profileNameStyle: user.profileNameStyle, profileGifUrl: user.profileGifUrl || '', boardIds, badges: uniqueBadges, friends, recentPosts: user.posts.map((p) => ({ postNumber: p.postNumber, content: p.content.slice(0, 160), createdAt: p.createdAt.toISOString(), boardId: p.thread.board.id, threadId: p.thread.id })) })) } };
}

function fmt(dateStr) { return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'utc' }); }

export default function Profile({ user }) {
  const themeClass = `profile-theme-${user.profileTheme || 'classic'}`;
  const nameStyle = { color: user.profileNameColor || '#af0a0f', fontWeight: user.profileNameStyle === 'bold' || user.profileNameStyle === 'bold-italic' ? 'bold' : 'normal', fontStyle: user.profileNameStyle === 'italic' || user.profileNameStyle === 'bold-italic' ? 'italic' : 'normal' };
  const [friendState, setFriendState] = useState('');
  const [isMine, setIsMine] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then((r) => r.ok ? r.json() : null).then((me) => setIsMine(!!me && me.anonId === user.anonId)).catch(() => {});
  }, [user.anonId]);

  async function friend(action) {
    setFriendState('...');
    const r = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, anonId: user.anonId }) });
    const data = await r.json().catch(() => ({}));
    setFriendState(r.ok ? (action === 'request' ? 'Request sent.' : 'Done.') : (data.error || 'Unable to update.'));
  }

  return <main className={`container profile-page ${themeClass}`}>
    <div className="topnav">[<Link href="/">Return</Link>] [<Link href="/profile/edit">Edit my profile</Link>] [<Link href="/profile/friends">Friends</Link>]</div>
    {user.bannerUrl && <div className="profile-banner"><img src={user.bannerUrl} alt="" /></div>}
    <section className={`profile-header ${user.profileLayout === 'profile' ? 'profile-layout-first' : ''} ${user.profileLayout === 'imageboard' ? 'profile-layout-imageboard' : ''}`}>
      {user.avatarUrl ? <img className="profile-avatar" src={user.avatarUrl} alt="" /> : <div className="profile-avatar avatar-placeholder">?</div>}
      <div className="profile-title">
        <h1 className="sitetitle" style={nameStyle}>{user.displayName}</h1>
        <div className="profile-badges">{user.badges.map((b) => <span key={b.name} className="badge badge-sparkle" style={{ borderColor: b.color, color: b.color }}>[{b.name}]</span>)} {user.adminTitle && user.role === 'administrator' && <span className="user-status">({user.adminTitle})</span>}</div>
        <div className="profile-id">Anonymous #{user.anonId}</div>
        {!isMine && <div className="profile-friend-action"><button type="button" onClick={() => friend('request')}>[ Add as friend ]</button> {friendState && <span className="muted">{friendState}</span>}</div>}
      </div>
    </section>
    {user.profileGifUrl && <div className="profile-gif"><img src={user.profileGifUrl} alt="Profile GIF" /></div>}

    <div className="profile-columns">
      <div>
        {user.bio && <div className="profile-box profile-bio"><div className="profile-box-title">ABOUT</div>{user.bio}</div>}
        <div className="profile-box"><div className="profile-box-title">BADGES</div><div className="profile-badge-list">{user.badges.map((b) => <span key={b.name} className="badge badge-sparkle" style={{ borderColor: b.color, color: b.color }}>[{b.name}] <small>L{b.level}</small></span>)}</div></div>
        <div className="profile-box"><div className="profile-box-title">FRIENDS</div>
          {user.friends.length === 0 ? <span className="muted">No friends listed yet.</span> : <div className="friend-grid">{user.friends.map((f) => <Link key={f.anonId} href={`/user/${f.anonId}`} className="friend-tile">{f.avatarUrl ? <img src={f.avatarUrl} alt="" /> : <span className="friend-avatar">?</span>}<span>{f.topFriend && <b title="Top friend">★ </b>}{f.displayName}</span></Link>)}</div>}
        </div>
        <div className="profile-box"><div className="profile-box-title">INFO</div><table className="admin"><tbody><tr><th>Joined</th><td>{fmt(user.createdAt)}</td></tr><tr><th>Posts</th><td>{user.postCount}</td></tr><tr><th>Boards</th><td>{user.boardIds.map((b, i) => <span key={b}>{i > 0 && ' '}<Link href={`/${b.replace(/\//g, '')}`}>{b}</Link></span>)}</td></tr></tbody></table></div>
      </div>
      <aside>
        <div className="profile-box"><div className="profile-box-title">PRESENTATION</div><div className="profile-signature">{user.signature || '—'}</div><p className="muted">This page is styled by its owner.</p></div>
      </aside>
    </div>

    <h3>Recent Posts</h3>
    {user.recentPosts.length === 0 && <p className="muted">No posts to show.</p>}
    {user.recentPosts.map((p) => { const slug = p.boardId.replace(/\//g, ''); return <div className="post" key={p.postNumber}><div className="post-head"><span className="postnum">→ {p.postNumber}</span> <Link href={`/${slug}`}>{p.boardId}</Link> <span className="date">{fmt(p.createdAt)}</span></div><div className="content">{p.content}</div>{user.signature && <div className="profile-signature">— {user.signature}</div>}<div className="actions"><Link href={`/${slug}/thread/${p.threadId}`}>[View thread]</Link></div></div>; })}
    <div className="footer">pourriture.org — user profile</div>
  </main>;
}
