import Link from 'next/link';
import { useState } from 'react';
import prisma from '../../../lib/prisma';
import { getWidgetsForSlot } from '../../../lib/widgets';
import { getUidFromReq } from '../../../lib/identity';
import { isModeratorReq } from '../../../lib/permissions';
import WidgetSlot from '../../../components/WidgetSlot';

export async function getServerSideProps({ params, req }) {
  const threadId = parseInt(params.id, 10);
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { posts: { orderBy: { createdAt: 'asc' } }, board: true },
  });
  if (!thread) return { notFound: true };

  // Increment views
  await prisma.thread.update({ where: { id: threadId }, data: { views: { increment: 1 } } });

  const [topWidgets, bottomWidgets] = await Promise.all([
    getWidgetsForSlot('thread_top'),
    getWidgetsForSlot('thread_bottom'),
  ]);

  const isMod = await isModeratorReq(req);

  return {
    props: {
      thread: JSON.parse(JSON.stringify({ ...thread, views: thread.views + 1 })),
      boardSlug: params.board,
      topWidgets,
      bottomWidgets,
      isMod,
    },
  };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function ThreadPage({ thread, boardSlug, topWidgets, bottomWidgets, isMod }) {
  const [replyTo, setReplyTo] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState(thread.posts);

  async function submitReply(e) {
    e.preventDefault();
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: thread.id, name, message, replyToId: replyTo }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts([...posts, data.post]);
      setMessage('');
      setReplyTo(null);
    } else {
      const err = await res.json();
      alert(err.error || 'Something went wrong.');
    }
  }

  async function report(postId) {
    const reason = prompt('Reason: Spam / Harassment / Hate speech / Threat / Self-harm / Other');
    if (!reason) return;
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, reason }),
    });
    alert('Report submitted.');
  }

  async function modAction(action, postId) {
    await fetch('/api/mod/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, postId }),
    });
    window.location.reload();
  }

  return (
    <>
      <div className="topnav">
        [<Link href="/">Return</Link>] [<Link href={`/${boardSlug}`}>{thread.board.id}</Link>] [<Link href="/catalog">Catalog</Link>] [<a href="#bottom">Bottom</a>] [<a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>Update</a>]
      </div>
      <div className="container">
        <h1 className="sitetitle">
          {thread.subject || 'Thread'}{' '}
          {thread.sticky && <span className="indicator sticky">[STICKY]</span>}
          {thread.locked && <span className="indicator locked">[LOCKED]</span>}
          {thread.archived && <span className="indicator archived">[ARCHIVED]</span>}
        </h1>
        <div className="subtitle">
          Thread #{thread.id} — {thread.views} views — {posts.length} posts
        </div>

        <WidgetSlot widgets={topWidgets} />

        {posts.map((p, idx) => (
          <div className="post" key={p.id}>
            <input type="checkbox" />{' '}
            <span className="name">{p.displayName}</span>
            {idx === 0 && <span className="badge op-badge">[OP]</span>}
            <span className="date">{fmt(p.createdAt)}</span>
            <span className="postnum">→ {p.postNumber}</span>
            {p.editedAt && <span className="muted"> (edited {fmt(p.editedAt)})</span>}
            {p.replyToId && <div className="quote">&gt;&gt;{p.replyToId}</div>}
            <div className="content">{p.hidden ? '[post removed by moderator]' : p.content}</div>
            <div className="actions">
              {!thread.locked && !thread.archived && (
                <a href="#" onClick={(e) => { e.preventDefault(); setReplyTo(p.id); }}>[Reply]</a>
              )}
              <a href="#" onClick={(e) => { e.preventDefault(); report(p.id); }}>[Report]</a>
              {isMod && (
                <>
                  {' '}<a href="#" onClick={(e) => { e.preventDefault(); modAction(p.hidden ? 'restore_post' : 'hide_post', p.id); }}>[{p.hidden ? 'Restore' : 'Hide'}]</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); if (confirm('Delete?')) modAction('delete_post', p.id); }}>[Delete]</a>
                </>
              )}
            </div>
          </div>
        ))}

        {!thread.locked && !thread.archived ? (
          <div className="post">
            <form onSubmit={submitReply}>
              {replyTo && <div>Replying to &gt;&gt;{replyTo} <a href="#" onClick={(e) => { e.preventDefault(); setReplyTo(null); }}>[cancel]</a></div>}
              <div>Name: <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" /></div>
              <div>Message:<br /><textarea rows={4} cols={50} value={message} onChange={(e) => setMessage(e.target.value)} required /></div>
              <button type="submit">Post Reply</button>
            </form>
          </div>
        ) : (
          <p className="locked-notice">[Thread locked — no new replies can be posted]</p>
        )}

        <WidgetSlot widgets={bottomWidgets} />

        <div id="bottom" className="footer">pourriture.org — {thread.board.id}</div>
      </div>
    </>
  );
}
