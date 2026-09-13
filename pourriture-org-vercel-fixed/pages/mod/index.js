import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req }) {
  const isMod = await isModeratorReq(req);
  if (!isMod) return { redirect: { destination: '/admin/login', permanent: false } };

  const [pendingReports, lockedThreads, bannedUsers, pendingActions, reviewItems] = await Promise.all([
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.thread.count({ where: { locked: true } }),
    prisma.user.count({ where: { banned: true } }),
    prisma.moderationAction.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.post.count({ where: { status: 'review' } }),
  ]);

  return { props: { stats: { pendingReports, lockedThreads, bannedUsers, pendingActions, reviewItems } } };
}

export default function ModDashboard({ stats }) {
  return (
    <div className="container">
      <h1 className="sitetitle">POURRITURE.ORG</h1>
      <h2 className="mod-subtitle">MODERATOR SPACE</h2>
      <pre className="stats-block">{`Reports: ${stats.pendingReports}
Review queue: ${stats.reviewItems}
Pending actions: ${stats.pendingActions}
Locked threads: ${stats.lockedThreads}
Banned users: ${stats.bannedUsers}`}</pre>
      <p>
        [<Link href="/mod/queue">Review Queue</Link>]{' '}
        [<Link href="/mod/reports">Reports</Link>]{' '}
        [<Link href="/mod/posts">Posts</Link>]{' '}
        [<Link href="/mod/threads">Threads</Link>]{' '}
        [<Link href="/mod/users">Users</Link>]{' '}
        [<Link href="/mod/log">Moderation Log</Link>]{' '}
        [<Link href="/mod/warnings">Warnings</Link>]{' '}
        [<Link href="/rules">Rules</Link>]{' '}
        [<Link href="/admin">Admin</Link>]{' '}
        [<Link href="/">Back to site</Link>]
      </p>
      {(stats.pendingReports > 0 || stats.reviewItems > 0) && (
        <div className="notification">[{stats.pendingReports + stats.reviewItems} ITEMS NEED MODERATION]</div>
      )}
    </div>
  );
}
