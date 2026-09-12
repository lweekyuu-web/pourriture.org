import Link from 'next/link';
import { useState } from 'react';
import prisma from '../lib/prisma';
import { getWidgetsForSlot } from '../lib/widgets';
import { getAllSettings } from '../lib/settings';
import { isAdminRequest } from '../lib/admin';
import WidgetSlot from '../components/WidgetSlot';

export async function getServerSideProps({ req }) {
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

  const [topWidgets, bottomWidgets, settings] = await Promise.all([
    getWidgetsForSlot('home_top'),
    getWidgetsForSlot('home_bottom'),
    getAllSettings(),
  ]);

  const isAdmin = isAdminRequest(req);

  return { props: { boards: JSON.parse(JSON.stringify(boardData)), topWidgets, bottomWidgets, settings, isAdmin } };
}

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) +
    ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' });
}

export default function Home({ boards, topWidgets, bottomWidgets, settings, isAdmin }) {
  const [editingMotd, setEditingMotd] = useState(false);
  const [motdValue, setMotdValue] = useState(settings.motd || '');
  const [saved, setSaved] = useState(false);

  function handleUpdateClick(e) {
    if (!isAdmin) return; // comportement normal (lien vers "/") pour les visiteurs
    e.preventDefault();
    setEditingMotd(!editingMotd);
  }

  async function saveMotd() {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motd: motdValue }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      setEditingMotd(false);
      window.location.reload();
    }
  }

  return (
    <>
      <div className="topnav">
        [<Link href="/">Return</Link>] [<Link href="/catalogue">Catalogue</Link>] [<a href="#bottom">Bottom</a>] [<a href="/" onClick={handleUpdateClick}>Update</a>]
      </div>
      <div className="container">
        <div className="site-logo-text">
          <div className="wordmark">{settings.site_title}</div>
          <div className="est-line">est. unknown — a place on the internet</div>
        </div>
        <div className="subtitle">{settings.site_tagline}</div>

        {isAdmin && editingMotd && (
          <div className="motd-editor">
            <div><b>Admin: write anything here — it will show as the site banner.</b></div>
            <textarea
              rows={3}
              cols={60}
              value={motdValue}
              onChange={(e) => setMotdValue(e.target.value)}
              placeholder="Type your announcement, notice, or anything you want visitors to see..."
            />
            <div>
              <button type="button" onClick={saveMotd}>Update</button>{' '}
              <button type="button" onClick={() => setEditingMotd(false)}>Cancel</button>
              {saved && <span style={{ marginLeft: 8, color: 'green' }}>Saved.</span>}
            </div>
          </div>
        )}

        {!editingMotd && settings.motd && settings.motd.trim() && (
          <div className="motd">
            {settings.motd}
            {isAdmin && <span className="motd-edit-hint"> [<a href="#" onClick={handleUpdateClick}>edit</a>]</span>}
          </div>
        )}

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
          {settings.footer_text} — <Link href="/admin">admin</Link>
        </div>
      </div>
    </>
  );
}
