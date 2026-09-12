import Link from 'next/link';
import { useState } from 'react';
import prisma from '../../lib/prisma';
import { getWidgetsForSlot } from '../../lib/widgets';
import WidgetSlot from '../../components/WidgetSlot';

export async function getServerSideProps({ params }) {
  const boardId = '/' + params.board + '/';
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return { notFound: true };

  const threads = await prisma.thread.findMany({
    where: { boardId },
    orderBy: { createdAt: 'desc' },
    include: {
      posts: { orderBy: { createdAt: 'asc' } },
    },
  });

  const topWidgets = await getWidgetsForSlot('board_top');

  return {
    props: {
      board: JSON.parse(JSON.stringify(board)),
      threads: JSON.parse(JSON.stringify(threads)),
      boardSlug: params.board,
      topWidgets,
    },
  };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('en-GB');
}

export default function BoardPage({ board, threads, boardSlug, topWidgets }) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  async function submitThread(e) {
    e.preventDefault();
    const res = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: board.id, name, subject, message }),
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/${boardSlug}/thread/${data.threadId}`;
    }
  }

  return (
    <>
      <div className="topnav">
        [<Link href="/">Return</Link>] [<a href="#" onClick={() => setShowNew(!showNew)}>New Thread</a>] [<a href="#bottom">Bottom</a>]
      </div>
      <div className="container">
        <h1 className="sitetitle">{board.id} — {board.name}</h1>
        <div className="subtitle">{board.description}</div>

        <WidgetSlot widgets={topWidgets} />

        {showNew && (
          <div className="post">
            <form onSubmit={submitThread}>
              <div>Name: <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" /></div>
              <div>Subject: <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div>Message:<br /><textarea rows={5} cols={50} value={message} onChange={(e) => setMessage(e.target.value)} required /></div>
              <button type="submit">Post</button>
            </form>
          </div>
        )}

        {threads.length === 0 && <p>No threads yet.</p>}

        {threads.map((t) => (
          <div className="post" key={t.id}>
            {t.subject && <b>{t.subject}</b>}
            {t.locked && <span> [Thread locked]</span>}
            {t.posts.slice(0, 1).map((p) => (
              <div key={p.id}>
                <div className="head">
                  <span className="name">{p.displayName}</span>
                  <span className="date">{fmt(p.createdAt)}</span>
                  <span className="postnum">→ {p.postNumber}</span>
                </div>
                <div className="content">{p.content}</div>
              </div>
            ))}
            <div className="actions">
              <Link href={`/${boardSlug}/thread/${t.id}`}>[Reply]</Link>{' '}
              {t.posts.length > 1 ? `${t.posts.length - 1} replies` : 'No replies'}
            </div>
          </div>
        ))}
        <div id="bottom" className="footer">pourture.org — {board.id}</div>
      </div>
    </>
  );
}
