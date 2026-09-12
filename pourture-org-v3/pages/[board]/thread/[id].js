import Link from 'next/link';
import { useState } from 'react';
import prisma from '../../../lib/prisma';
import { getWidgetsForSlot } from '../../../lib/widgets';
import WidgetSlot from '../../../components/WidgetSlot';

export async function getServerSideProps({ params }) {
  const threadId = parseInt(params.id, 10);
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { posts: { orderBy: { createdAt: 'asc' } }, board: true },
  });
  if (!thread) return { notFound: true };

  const [topWidgets, bottomWidgets] = await Promise.all([
    getWidgetsForSlot('thread_top'),
    getWidgetsForSlot('thread_bottom'),
  ]);

  return {
    props: {
      thread: JSON.parse(JSON.stringify(thread)),
      boardSlug: params.board,
      topWidgets,
      bottomWidgets,
    },
  };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function ThreadPage({ thread, boardSlug, topWidgets, bottomWidgets }) {
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

  return (
    <>
      <div className="topnav">
        [<Link href="/">Return</Link>] [<Link href={`/${boardSlug}`}>{thread.board.id}</Link>] [<a href="#bottom">Bottom</a>]
      </div>
      <div className="container">
        <h1 className="sitetitle">{thread.subject || 'Thread'} {thread.locked && '[Locked]'}</h1>

        <WidgetSlot widgets={topWidgets} />

        {posts.map((p) => (
          <div className="post" key={p.id}>
            <input type="checkbox" />{' '}
            <span className="name">{p.displayName}</span>
            <span className="date">{fmt(p.createdAt)}</span>
            <span className="postnum">→ {p.postNumber}</span>
            {p.replyToId && <div className="quote">&gt;&gt;{p.replyToId}</div>}
            <div className="content">{p.hidden ? '[post removed by moderator]' : p.content}</div>
            <div className="actions">
              <a href="#" onClick={() => setReplyTo(p.id)}>[Reply]</a>
              <a href="#" onClick={() => report(p.id)}>[Report]</a>
            </div>
          </div>
        ))}

        {!thread.locked ? (
          <div className="post">
            <form onSubmit={submitReply}>
              {replyTo && <div>Replying to &gt;&gt;{replyTo} <a href="#" onClick={() => setReplyTo(null)}>[cancel]</a></div>}
              <div>Name: <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" /></div>
              <div>Message:<br /><textarea rows={4} cols={50} value={message} onChange={(e) => setMessage(e.target.value)} required /></div>
              <button type="submit">Post Reply</button>
            </form>
          </div>
        ) : (
          <p>[Thread locked]</p>
        )}

        <WidgetSlot widgets={bottomWidgets} />

        <div id="bottom" className="footer">pourriture.org — {thread.board.id}</div>
      </div>
    </>
  );
}
