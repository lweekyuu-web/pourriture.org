import Link from 'next/link';
import prisma from '../lib/prisma';
import { getWidgetsForSlot } from '../lib/widgets';
import WidgetSlot from '../components/WidgetSlot';

export async function getServerSideProps() {
  const boards = await prisma.board.findMany({
    where: { status: 'public' },
    include: {
      threads: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { posts: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
    orderBy: { id: 'asc' },
  });

  const boardData = await Promise.all(
    boards.map(async (b) => {
      const threadCount = await prisma.thread.count({ where: { boardId: b.id } });
      const last = b.threads[0];
      const lastPost = last?.posts?.[0];
      return {
        id: b.id,
        name: b.name,
        description: b.description,
        threadCount,
        lastActivity: lastPost ? lastPost.createdAt.toISOString() : b.createdAt.toISOString(),
      };
    })
  );

  const [topWidgets, bottomWidgets] = await Promise.all([
    getWidgetsForSlot('home_top'),
    getWidgetsForSlot('home_bottom'),
  ]);

  return { props: { boards: JSON.parse(JSON.stringify(boardData)), topWidgets, bottomWidgets } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('en-GB');
}

export default function Home({ boards, topWidgets, bottomWidgets }) {
  return (
    <>
      <div className="topnav">
        [<Link href="/">Return</Link>] [<Link href="/catalogue">Catalogue</Link>] [<a href="#bottom">Bottom</a>] [<a href="/">Update</a>]
      </div>
      <div className="container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="POURTURE.ORG" className="site-logo" width={480} height={92} />

        <WidgetSlot widgets={topWidgets} />

        {boards.map((b) => (
          <div className="board-row" key={b.id}>
            <span className="bid">[{b.id.replace(/\//g, '')}]</span> <Link href={`/${b.id.replace(/\//g, '')}`}>{b.id} {b.name}</Link>
            <div className="desc">{b.description}</div>
            <div className="meta">{b.threadCount} threads — Last activity: {fmt(b.lastActivity)}</div>
          </div>
        ))}

        <WidgetSlot widgets={bottomWidgets} />

        <div id="bottom" className="footer">
          pourture.org — prototype expérimental — contenu fictif — <Link href="/admin">admin</Link>
        </div>
      </div>
    </>
  );
}
