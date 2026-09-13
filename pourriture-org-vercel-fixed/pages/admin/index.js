import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const [boards, threads, posts, users, reports, archived, banned, badges, boardRequests, profileMedia, messages] = await Promise.all([
    prisma.board.count(), prisma.thread.count(), prisma.post.count(), prisma.user.count(),
    prisma.report.count({ where: { status: 'pending' } }), prisma.thread.count({ where: { archived: true } }),
    prisma.user.count({ where: { banned: true } }), prisma.badge.count(), prisma.boardRequest.count({ where: { status: 'pending' } }),
    prisma.user.count({ where: { OR: [{ avatarStatus: 'review' }, { bannerStatus: 'review' }] } }),
    prisma.directMessage.count({ where: { readAt: null } }),
  ]);
  const boardStats = await prisma.thread.groupBy({ by: ['boardId'], _count: true, orderBy: { _count: { boardId: 'desc' } }, take: 1 });
  const mostActiveBoard = boardStats[0]?.boardId || '—';
  return { props: { stats: { boards, threads, posts, users, reports, archived, banned, badges, boardRequests, profileMedia, messages, mostActiveBoard } } };
}

export default function AdminDashboard({ stats }) {
  return <div className="container">
    <h1 className="sitetitle">POURRITURE.ORG ADMIN</h1>
    <pre className="stats-block">{`--------------------------------
Boards: ${stats.boards}
Threads: ${stats.threads.toLocaleString()}
Posts: ${stats.posts.toLocaleString()}
Users: ${stats.users.toLocaleString()}
Reports: ${stats.reports}
Board requests: ${stats.boardRequests}
Profile media review: ${stats.profileMedia}
Unread admin messages: ${stats.messages}
Archived: ${stats.archived}
Banned: ${stats.banned}
Badges: ${stats.badges}
Most active board: ${stats.mostActiveBoard}
--------------------------------`}</pre>
    <p>
      [<Link href="/admin/boards">Boards</Link>] [<Link href="/admin/board-requests">Board Requests</Link>] [<Link href="/admin/reports">Reports</Link>] [<Link href="/admin/users">Users</Link>] [<Link href="/admin/badges">Badges</Link>] [<Link href="/admin/profile-media">Profile Media</Link>] [<Link href="/admin/messages">Admin Mailbox</Link>] [<Link href="/admin/moderators">Moderators</Link>] [<Link href="/admin/widgets">Widgets / Ads</Link>] [<Link href="/admin/settings">Settings</Link>] [<Link href="/admin/security">Security / IP</Link>] [<Link href="/mod">Moderator Space</Link>] [<Link href="/status">Statistics</Link>] [<Link href="/">Back to site</Link>]
    </p>
    {stats.boardRequests > 0 && <div className="notification">[{stats.boardRequests} BOARD REQUEST{stats.boardRequests > 1 ? 'S' : ''} WAITING]</div>}
    {stats.profileMedia > 0 && <div className="notification">[{stats.profileMedia} PROFILE IMAGE{stats.profileMedia > 1 ? 'S' : ''} WAITING FOR REVIEW]</div>}
    {stats.messages > 0 && <div className="notification">[{stats.messages} NEW ADMIN MESSAGE{stats.messages > 1 ? 'S' : ''}]</div>}
  </div>;
}
