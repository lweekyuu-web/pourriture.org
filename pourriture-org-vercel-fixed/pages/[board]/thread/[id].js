import Link from 'next/link';
import { useState } from 'react';
import prisma from '../../../lib/prisma';
import { getWidgetsForSlot } from '../../../lib/widgets';
import { isModeratorReq } from '../../../lib/permissions';
import WidgetSlot from '../../../components/WidgetSlot';
import GifPicker from '../../../components/GifPicker';

export async function getServerSideProps({ params, req }) {
  const threadId = parseInt(params.id, 10);
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { posts: { orderBy: { createdAt: 'asc' } }, board: true },
  });
  if (!thread) return { notFound: true };

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
  const [gifUrl, setGifUrl] = useState('');
  const [posts, setPosts] = useState(thread.posts);
  const [collapsed, setCollapsed] = useState({});

  async function submitReply(e) {
    e.preventDefault();
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: thread.id, name, message, gifUrl, replyToId: replyTo }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts([...posts, data.post]);
      setMessage('');
      setGifUrl('');
      setReplyTo(null);
    } else {
      const err = await res.json();
      alert(err.error || 'Something went wrong.');
    }
  }

  async function report(postId) {
    const reason = prompt('Why are you reporting this post?\n\nSpam / flood\nHarassment\nIllegal / prohibited content\nPersonal information\nSelf-harm concern\nOther');
    if (!reason) return;
    const details = prompt('Additional details (optional):') || '';
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, reason, details }),
    });
    alert(res.ok ? 'Report submitted.' : 'Unable to submit report.');
  }

  async function modAction(action, postId) {
    await fetch('/api/mod/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, postId }),
    });
    window.location.reload();
  }

  function jumpTo(postId) {
    const target = document.getElementById(`post-${postId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('post-highlight');
    window.setTimeout(() => target.classList.remove('post-highlight'), 1800);
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
        <div className="subtitle">Thread #{thread.id} — {thread.views} views — {posts.length} posts</div>

        <WidgetSlot widgets={topWidgets} />

        {posts.map((p, idx) => (
          <div className={`post ${collapsed[p.id] ? 'post-collapsed' : ''}`} id={`post-${p.id}`} key={p.id}>
            <div className="post-head">
              <input type="checkbox" />{' '}
              <span className="name">{p.displayName}</span>
              {idx === 0 && <span className="badge op-badge">[OP]</span>}
              <span className="date">{fmt(p.createdAt)}</span>
              <span className="postnum">No.{p.postNumber}</span>
              {p.editedAt && <span className="muted"> (edited {fmt(p.editedAt)})</span>}
              <a href="#" className="collapse-link" onClick={(e) => { e.preventDefault(); setCollapsed({ ...collapsed, [p.id]: !collapsed[p.id] }); }}>
                [{collapsed[p.id] ? '+' : '−'}]
              </a>
            </div>

            {!collapsed[p.id] && <>
              {p.replyToId && <div className="quote"><a href="#" onClick={(e) => { e.preventDefault(); jumpTo(p.replyToId); }}>&gt;&gt;{p.replyToId}</a></div>}
              <div className="content">{p.hidden ? '[post removed by moderator]' : p.content}</div>
              {p.gifUrl && !p.hidden && <div className="post-gif"><img src={p.gifUrl} alt="GIF" loading="lazy" /></div>}
              <div className="actions">
                {!thread.locked && !thread.archived && <a href="#" onClick={(e) => { e.preventDefault(); setReplyTo(p.id); }}>[Reply]</a>}
                <a href="#" onClick={(e) => { e.preventDefault(); report(p.id); }}>[Report]</a>
                {isMod && <>
                  {' '}<a href="#" onClick={(e) => { e.preventDefault(); modAction(p.hidden ? 'restore_post' : 'hide_post', p.id); }}>[{p.hidden ? 'Restore' : 'Hide'}]</a>
                  {' '}<a href="#" onClick={(e) => { e.preventDefault(); if (confirm('Delete this post?')) modAction('delete_post', p.id); }}>[Delete]</a>
                </>}
              </div>
            </>}
          </div>
        ))}

        {!thread.locked && !thread.archived ? (
          <div className="post">
            <form onSubmit={submitReply}>
              {replyTo && <div>Replying to <a href="#" onClick={(e) => { e.preventDefault(); jumpTo(replyTo); }}>&gt;&gt;{replyTo}</a> <a href="#" onClick={(e) => { e.preventDefault(); setReplyTo(null); }}>[cancel]</a></div>}
              <div>Name: <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" maxLength={40} /></div>
              <div>Message:<br /><textarea rows={4} cols={50} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} /></div>
              <div className="gif-controls"><GifPicker value={gifUrl} onChange={setGifUrl} /></div>
              <button type="submit">Post Reply</button>
            </form>
          </div>
        ) : <p className="locked-notice">[Thread locked — no new replies can be posted]</p>}

        <WidgetSlot widgets={bottomWidgets} />
        <div id="bottom" className="footer">pourriture.org — {thread.board.id}</div>
      </div>
    </>
  );
}
