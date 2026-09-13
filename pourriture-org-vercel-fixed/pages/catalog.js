import Link from 'next/link';
import prisma from '../lib/prisma';

export async function getServerSideProps({ query }) {
  const filter = ['active', 'all', 'recent'].includes(query.filter) ? query.filter : 'active';
  const where = filter === 'active' ? { status: 'public' } : {};
  const boards = await prisma.board.findMany({
    where,
    orderBy: filter === 'recent' ? { createdAt: 'desc' } : { id: 'asc' },
  });

  const boardData = await Promise.all(
    boards.map(async (b) => {
      const [threadCount, postCount, lastPost] = await Promise.all([
        prisma.thread.count({ where: { boardId: b.id } }),
        prisma.post.count({ where: { thread: { boardId: b.id } } }),
        prisma.post.findFirst({
          where: { thread: { boardId: b.id } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      return {
        id: b.id,
        name: b.name,
        status: b.status,
        threadCount,
        postCount,
        lastActivity: lastPost ? lastPost.createdAt.toISOString() : null,
      };
    })
  );

  return { props: { boards: JSON.parse(JSON.stringify(boardData)), filter } };
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function Catalog({ boards, filter }) {
  return (
    <div className="container">
      <div className="topnav">
        [<Link href="/">Return</Link>] [<a href="#bottom">Bottom</a>] [<Link href="/catalog">Update</Link>]
      </div>
      <h1 className="sitetitle">BOARD LIST</h1>
      <div className="subtitle">All boards known to pourriture.org</div>

      <div className="catalog-filters">
        [<Link href="/catalog?filter=active">Show Active</Link>] [<Link href="/catalog?filter=all">Show All</Link>] [<Link href="/catalog?filter=recent">Recently Created</Link>]
        {' '}<span className="muted">Current: {filter}</span>
      </div>

      <table className="admin">
        <thead>
          <tr>
            <th>Board</th>
            <th>Name</th>
            <th>Status</th>
            <th>Threads</th>
            <th>Posts</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {boards.map((b) => (
            <tr key={b.id}>
              <td><Link href={`/${b.id.replace(/\//g, '')}`}>{b.id}</Link></td>
              <td>{b.name}</td>
              <td>{b.status}</td>
              <td>{b.threadCount}</td>
              <td>{b.postCount}</td>
              <td>{fmt(b.lastActivity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div id="bottom" className="footer">pourriture.org — board catalog</div>
    </div>
  );
}
