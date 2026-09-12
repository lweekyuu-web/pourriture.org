import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isModeratorReq } from '../../lib/permissions';

export async function getServerSideProps({ req }) {
  const isMod = await isModeratorReq(req);
  if (!isMod) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  const threads = await prisma.thread.findMany({
    include: { board: true, _count: { select: { posts: true } } },
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

export default function ModThreads({ threads }) {
  async function act(action, threadId) {
    await fetch('/api/mod/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, threadId }),
    });
    window.location.reload();
  }

  return (
    <div className="container">
      <h1 className="sitetitle">THREAD MANAGEMENT</h1>
      <p>[<Link href="/mod">Back to moderator space</Link>]</p>

      <table className="admin">
        <thead>
          <tr>
            <th>#</th>
            <th>Board</th>
            <th>Subject</th>
            <th>Replies</th>
            <th>Status</th>
            <th>Last Activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {threads.map((t) => {
            const slug = t.board.id.replace(/\//g, '');
            return (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.board.id}</td>
                <td>
                  <Link href={`/${slug}/thread/${t.id}`}>{t.subject || '(no subject)'}</Link>
                  {t.sticky && ' [STICKY]'}
                  {t.locked && ' [LOCKED]'}
                  {t.archived && ' [ARCHIVED]'}
                </td>
                <td>{t._count.posts - 1}</td>
                <td>{t.archived ? 'archived' : t.locked ? 'locked' : 'active'}</td>
                <td>{fmt(t.bumpedAt)}</td>
                <td>
                  <a href="#" onClick={(e) => { e.preventDefault(); act(t.locked ? 'unlock_thread' : 'lock_thread', t.id); }}>
                    [{t.locked ? 'Unlock' : 'Lock'}]
                  </a>{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); act(t.sticky ? 'unsticky_thread' : 'sticky_thread', t.id); }}>
                    [{t.sticky ? 'Unsticky' : 'Sticky'}]
                  </a>{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); act(t.archived ? 'unarchive_thread' : 'archive_thread', t.id); }}>
                    [{t.archived ? 'Unarchive' : 'Archive'}]
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
