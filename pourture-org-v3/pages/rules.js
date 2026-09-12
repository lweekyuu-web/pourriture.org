import Link from 'next/link';
import prisma from '../lib/prisma';
import { getAllSettings } from '../lib/settings';

export async function getServerSideProps() {
  const settings = await getAllSettings();
  const boards = await prisma.board.findMany({
    where: { status: 'public' },
    orderBy: { id: 'asc' },
  });
  return { props: { settings, boards: JSON.parse(JSON.stringify(boards)) } };
}

export default function Rules({ settings, boards }) {
  return (
    <div className="container">
      <div className="topnav">
        [<Link href="/">Return</Link>]
      </div>
      <h1 className="sitetitle">RULES</h1>

      <div className="rules-section">
        <h3>Global Rules</h3>
        <pre className="rules-text">{settings.rules_text}</pre>

        <h3>Board-Specific Rules</h3>
        {boards.map((b) => (
          <div className="post" key={b.id}>
            <div className="head">
              <span className="bid">{b.id}</span> {b.name}
            </div>
            {b.rules ? (
              <pre className="rules-text">{b.rules}</pre>
            ) : (
              <p className="muted">No specific rules. Follow global rules.</p>
            )}
          </div>
        ))}
      </div>

      <div className="last-modified">Last modified: 07/22/2016</div>
      <div className="footer">pourriture.org — rules</div>
    </div>
  );
}
