import Link from 'next/link';
import prisma from '../lib/prisma';

export async function getServerSideProps() {
  const threads = await prisma.thread.findMany({
    where: { archived: true },
    include: {
      board: true,
      posts: { orderBy: { createdAt: 'asc' }, take: 1 },
      _count: { select: { posts: true } },
    },
    orderBy: { bumpedAt: 'desc' },
    take: 100,
  });

  return { props: { threads: JSON.parse(JSON.stringify(threads)) } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function Archive({ threads }) {
  return (
    <div className="container">
      <div className="topnav">
        [<Link href="/">Return</Link>] [<a href="#bottom">Bottom</a>]
      </div>
      <h1 className="sitetitle">ARCHIVE</h1>
      <div className="subtitle">Old threads preserved for posterity. Read-only.</div>

      <table className="admin">
        <thead>
          <tr>
            <th>Board</th>
            <th>Thread</th>
            <th>Replies</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {threads.map((t) => {
            const slug = t.board.id.replace(/\//g, '');
            return (
              <tr key={t.id}>
                <td>{t.board.id}</td>
                <td>
                  <Link href={`/${slug}/thread/${t.id}`}>
                    {t.subject || t.posts[0]?.content?.slice(0, 60) || `Thread #${t.id}`}
                  </Link>
                  {' '}<span className="indicator archived">[ARCHIVED]</span>
                </td>
                <td>{t._count.posts - 1}</td>
                <td>{fmt(t.bumpedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {threads.length === 0 && <p className="muted">No archived threads.</p>}

      <div className="archive-note">
        This section has not been updated in years.
        Last modified: 11/03/2013
      </div>

      <div id="bottom" className="footer">pourriture.org — archive</div>
    </div>
  );
}
