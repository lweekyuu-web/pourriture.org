import Link from 'next/link';
import { useState } from 'react';
import prisma from '../../lib/prisma';
import { getWidgetsForSlot } from '../../lib/widgets';
import { getSetting } from '../../lib/settings';
import WidgetSlot from '../../components/WidgetSlot';

export async function getServerSideProps({ params, query }) {
  const boardId = '/' + params.board + '/';
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return { notFound: true };

  const perPageSetting = await getSetting('threads_per_page');
  const perPage = Math.max(1, parseInt(perPageSetting, 10) || 10);
  const page = Math.max(1, parseInt(query.page, 10) || 1);

  const totalThreads = await prisma.thread.count({ where: { boardId } });
  const totalPages = Math.max(1, Math.ceil(totalThreads / perPage));

  const threads = await prisma.thread.findMany({
    where: { boardId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
    include: {
      posts: { orderBy: { createdAt: 'asc' }, take: 1 },
      _count: { select: { posts: true } },
    },
  });

  const topWidgets = await getWidgetsForSlot('board_top');

  return {
    props: {
      board: JSON.parse(JSON.stringify(board)),
      threads: JSON.parse(JSON.stringify(threads)),
      boardSlug: params.board,
      topWidgets,
      page,
      totalPages,
    },
  };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('en-GB');
}

export default function BoardPage({ board, threads, boardSlug, topWidgets, page, totalPages }) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function submitThread(e) {
    e.preventDefault();
    setErrorMsg('');
    const res = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: board.id, name, subject, message }),
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/${boardSlug}/thread/${data.threadId}`;
    } else {
      const err = await res.json();
      setErrorMsg(err.error || 'Something went wrong.');
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
              {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
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
                <div className="content">{p.hidden ? '[post removed by moderator]' : p.content}</div>
              </div>
            ))}
            <div className="actions">
              <Link href={`/${boardSlug}/thread/${t.id}`}>[Reply]</Link>{' '}
              {t._count.posts > 1 ? `${t._count.posts - 1} replies` : 'No replies'}
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              p === page
                ? <span key={p} className="page-current">[{p}]</span>
                : <Link key={p} href={`/${boardSlug}?page=${p}`}>[{p}]</Link>
            ))}
          </div>
        )}

        <div id="bottom" className="footer">pourture.org — {board.id}</div>
      </div>
    </>
  );
}
