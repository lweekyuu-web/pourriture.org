import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const [boards, threads, posts, users, reports] = await Promise.all([
    prisma.board.count(),
    prisma.thread.count(),
    prisma.post.count(),
    prisma.user.count(),
    prisma.report.count({ where: { resolved: false } }),
  ]);
  return { props: { stats: { boards, threads, posts, users, reports } } };
}

export default function AdminDashboard({ stats }) {
  async function runSeed() {
    const res = await fetch('/api/admin/seed', { method: 'POST' });
    if (res.ok) {
      alert('Base de données peuplée avec les boards et threads de démo.');
      window.location.reload();
    } else {
      alert('Erreur lors du seed.');
    }
  }

  return (
    <div className="container">
      <h1 className="sitetitle">POURTURE.ORG ADMIN</h1>
      <pre>{`Boards: ${stats.boards}
Threads: ${stats.threads}
Posts: ${stats.posts}
Users: ${stats.users}
Reports: ${stats.reports}`}</pre>
      <p>
        [<Link href="/admin/boards">Boards</Link>]{' '}
        [<Link href="/admin/reports">Reports</Link>]{' '}
        [<Link href="/admin/users">Users</Link>]{' '}
        [<Link href="/admin/widgets">Widgets / Ads</Link>]{' '}
        [<Link href="/admin/settings">Settings</Link>]{' '}
        [<Link href="/">Back to site</Link>]
      </p>
      {stats.boards === 0 && (
        <p>
          Aucune donnée en base. <a href="#" onClick={runSeed}>[Peupler la base avec les boards/threads de démo]</a>
        </p>
      )}
    </div>
  );
}
