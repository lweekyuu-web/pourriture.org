import Link from 'next/link';
import prisma from '../lib/prisma';

export async function getServerSideProps() {
  const [boards, threads, posts, users] = await Promise.all([
    prisma.board.count(),
    prisma.thread.count(),
    prisma.post.count(),
    prisma.user.count(),
  ]);

  // Most active board
  const boardStats = await prisma.thread.groupBy({
    by: ['boardId'],
    _count: true,
    orderBy: { _count: { boardId: 'desc' } },
    take: 1,
  });
  const mostActiveBoard = boardStats[0]?.boardId || '—';

  return { props: { stats: { boards, threads, posts, users, mostActiveBoard } } };
}

export default function Status({ stats }) {
  return (
    <div className="container">
      <div className="topnav">[<Link href="/">Return</Link>]</div>
      <h1 className="sitetitle">SITE STATUS</h1>
      <div className="rules-section">
        <table className="admin">
          <tbody>
            <tr><th>Database</th><td>Online</td></tr>
            <tr><th>Boards</th><td>{stats.boards}</td></tr>
            <tr><th>Threads</th><td>{stats.threads}</td></tr>
            <tr><th>Posts</th><td>{stats.posts}</td></tr>
            <tr><th>Users</th><td>{stats.users}</td></tr>
            <tr><th>Most active board</th><td>{stats.mostActiveBoard}</td></tr>
            <tr><th>Archive status</th><td>Active</td></tr>
            <tr><th>Version</th><td>3.7</td></tr>
            <tr><th>Established</th><td>2009</td></tr>
            <tr><th>Last major update</th><td>2017</td></tr>
          </tbody>
        </table>
        <p className="muted">Last modified: 01/15/2017</p>
      </div>
    </div>
  );
}
