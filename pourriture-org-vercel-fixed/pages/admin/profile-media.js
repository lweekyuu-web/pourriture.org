import { useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const users = await prisma.user.findMany({
    where: { OR: [{ avatarStatus: 'review' }, { bannerStatus: 'review' }] },
    orderBy: { createdAt: 'desc' },
    select: { id: true, anonId: true, displayName: true, avatarUrl: true, bannerUrl: true, avatarStatus: true, bannerStatus: true, avatarAiFlagged: true, bannerAiFlagged: true },
  });
  return { props: { users: JSON.parse(JSON.stringify(users)) } };
}

export default function ProfileMediaQueue({ users: initial }) {
  const [users, setUsers] = useState(initial);
  async function moderate(userId, type, action) {
    const res = await fetch('/api/admin/profile-media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, type, action }) });
    if (!res.ok) return alert('Moderation action failed.');
    setUsers((list) => list.map((u) => {
      if (u.id !== userId) return u;
      const next = { ...u };
      if (type === 'avatar') { next.avatarStatus = action === 'approve' ? 'approved' : 'rejected'; if (action === 'reject') next.avatarUrl = ''; next.avatarAiFlagged = false; }
      if (type === 'banner') { next.bannerStatus = action === 'approve' ? 'approved' : 'rejected'; if (action === 'reject') next.bannerUrl = ''; next.bannerAiFlagged = false; }
      return next;
    }).filter((u) => u.avatarStatus === 'review' || u.bannerStatus === 'review'));
  }

  return <main className="container">
    <h1 className="sitetitle">PROFILE MEDIA QUEUE</h1>
    <p>[<Link href="/admin">Back to dashboard</Link>] [<Link href="/mod">Moderator space</Link>]</p>
    <p className="muted">Images marked for review stay hidden from public profiles. The AI is only a first-pass filter; moderators make the final decision.</p>
    {users.length === 0 && <p>No profile images are waiting for review.</p>}
    {users.map((u) => <section className="post media-review" key={u.id}>
      <div><b>{u.displayName || 'Anonymous'}</b> <span className="muted">#{u.anonId}</span></div>
      {u.avatarStatus === 'review' && <div className="media-review-item"><h3>Avatar {u.avatarAiFlagged && <span className="badge badge-hot">[AI FLAG]</span>}</h3><img className="moderation-media-preview" src={u.avatarUrl} alt="Pending avatar" /><div><button onClick={() => moderate(u.id, 'avatar', 'approve')}>[Approve]</button> <button onClick={() => moderate(u.id, 'avatar', 'reject')}>[Reject + remove]</button></div></div>}
      {u.bannerStatus === 'review' && <div className="media-review-item"><h3>Banner {u.bannerAiFlagged && <span className="badge badge-hot">[AI FLAG]</span>}</h3><img className="moderation-banner-preview" src={u.bannerUrl} alt="Pending banner" /><div><button onClick={() => moderate(u.id, 'banner', 'approve')}>[Approve]</button> <button onClick={() => moderate(u.id, 'banner', 'reject')}>[Reject + remove]</button></div></div>}
    </section>)}
  </main>;
}
