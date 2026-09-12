import Link from 'next/link';
import prisma from '../lib/prisma';

export async function getServerSideProps() {
  const threads = await prisma.thread.findMany({
    where: { board: { status: 'public' } },
    include: { posts: { take: 1, orderBy: { createdAt: 'asc' } }, board: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return { props: { threads: JSON.parse(JSON.stringify(threads)) } };
}

export default function Catalogue({ threads }) {
  return (
    <div className="container">
      <div className="topnav">[<Link href="/">Return</Link>]</div>
      <h1 className="sitetitle">Catalogue</h1>
      {threads.map((t) => (
        <div className="board-row" key={t.id}>
          <span className="bid">{t.board.id}</span>{' '}
          <Link href={`/${t.board.id.replace(/\//g, '')}/thread/${t.id}`}>
            {t.subject || t.posts[0]?.content?.slice(0, 60) || `Thread #${t.id}`}
          </Link>
        </div>
      ))}
    </div>
  );
}
