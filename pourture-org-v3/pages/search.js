import { useState } from 'react';
import Link from 'next/link';
import prisma from '../lib/prisma';

export async function getServerSideProps({ query }) {
  const q = (query.q || '').trim();
  const type = query.type || 'posts';

  let results = [];

  if (q.length >= 2) {
    if (type === 'posts') {
      results = await prisma.post.findMany({
        where: { content: { contains: q, mode: 'insensitive' }, hidden: false },
        include: { thread: { include: { board: true } } },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      results = results.map((p) => ({
        id: p.id,
        postNumber: p.postNumber,
        content: p.content.slice(0, 120),
        displayName: p.displayName,
        createdAt: p.createdAt.toISOString(),
        boardId: p.thread.board.id,
        threadId: p.thread.id,
        type: 'post',
      }));
    } else if (type === 'threads') {
      results = await prisma.thread.findMany({
        where: {
          OR: [
            { subject: { contains: q, mode: 'insensitive' } },
            { posts: { some: { content: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        include: { board: true, _count: { select: { posts: true } } },
        take: 50,
        orderBy: { bumpedAt: 'desc' },
      });
      results = results.map((t) => ({
        id: t.id,
        subject: t.subject || '(no subject)',
        boardId: t.board.id,
        replies: t._count.posts - 1,
        createdAt: t.createdAt.toISOString(),
        type: 'thread',
      }));
    } else if (type === 'users') {
      results = await prisma.user.findMany({
        where: { displayName: { contains: q, mode: 'insensitive' } },
        take: 50,
      });
      results = results.map((u) => ({
        id: u.id,
        anonId: u.anonId,
        displayName: u.displayName || 'Anonymous',
        postCount: u.postCount,
        badge: u.badge,
        createdAt: u.createdAt.toISOString(),
        type: 'user',
      }));
    }
  }

  return { props: { results: JSON.parse(JSON.stringify(results)), q, type } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' });
}

export default function Search({ results, q, type: initialType }) {
  const [query, setQuery] = useState(q);
  const [searchType, setSearchType] = useState(initialType);

  return (
    <div className="container">
      <div className="topnav">
        [<Link href="/">Return</Link>]
      </div>
      <h1 className="sitetitle">SEARCH</h1>

      <form method="GET" action="/search" className="search-form">
        <input type="text" name="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." />
        <select name="type" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
          <option value="posts">Search posts</option>
          <option value="threads">Search threads</option>
          <option value="users">Search users</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {q && (
        <div className="search-results">
          <p>{results.length} result(s) for "<b>{q}</b>"</p>
          {results.map((r) => {
            if (r.type === 'post') {
              const slug = r.boardId.replace(/\//g, '');
              return (
                <div className="post search-result" key={`post-${r.id}`}>
                  <span className="postnum">→ {r.postNumber}</span>{' '}
                  <Link href={`/${slug}`}>{r.boardId}</Link>{' '}
                  <span className="name">{r.displayName}</span>{' '}
                  <span className="date">{fmt(r.createdAt)}</span>
                  <div className="content">{r.content}</div>
                  <div className="actions">
                    <Link href={`/${slug}/thread/${r.threadId}`}>[View thread]</Link>
                  </div>
                </div>
              );
            }
            if (r.type === 'thread') {
              const slug = r.boardId.replace(/\//g, '');
              return (
                <div className="post search-result" key={`thread-${r.id}`}>
                  <Link href={`/${slug}/thread/${r.id}`}>{r.subject}</Link>{' '}
                  <span className="meta">{r.boardId} — {r.replies} replies — {fmt(r.createdAt)}</span>
                </div>
              );
            }
            if (r.type === 'user') {
              return (
                <div className="post search-result" key={`user-${r.id}`}>
                  <Link href={`/user/${r.anonId}`}>{r.displayName}</Link>{' '}
                  <span className="badge">[{r.badge}]</span>{' '}
                  <span className="meta">{r.postCount} posts — Joined {fmt(r.createdAt)}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {!q && <p className="muted">Type something above to search.</p>}
    </div>
  );
}
