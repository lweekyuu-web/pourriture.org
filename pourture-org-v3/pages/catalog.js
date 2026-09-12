import Link from 'next/link';
import prisma from '../lib/prisma';

export async function getServerSideProps() {
  const boards = await prisma.board.findMany({
    where: { status: 'public' },
    orderBy: { id: 'asc' },
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
        threadCount,
        postCount,
        lastActivity: lastPost ? lastPost.createdAt.toISOString() : null,
      };
    })
  );

  return { props: { boards: JSON.parse(JSON.stringify(boardData)) } };
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function Catalog({ boards }) {
  return (
    <div className="container">
      <div className="topnav">
        [<Link href="/">Return</Link>] [<a href="#bottom">Bottom</a>] [<a href="/">Update</a>]
      </div>
      <h1 className="sitetitle">BOARD LIST</h1>
      <div className="subtitle">All public boards on pourriture.org</div>

      <div className="catalog-filters">
        [<a href="#">Show Active</a>] [<a href="#">Show All</a>] [<a href="#">Recently Updated</a>]
      </div>

      <table className="admin">
        <thead>
          <tr>
            <th>Board</th>
            <th>Name</th>
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
