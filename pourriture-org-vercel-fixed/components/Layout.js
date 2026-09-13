// Shared layout components for the old-web aesthetic.
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function SiteHeader({ isAdmin }) {
  const [identity, setIdentity] = useState(null);

  useEffect(() => {
    fetch('/api/identity')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setIdentity(d); })
      .catch(() => {});
  }, []);

  const adminVisible = Boolean(isAdmin || identity?.isAdmin);

  return (
    <>
      <style jsx global>{`
        html { min-height: 100%; }
        body {
          min-height: 100vh;
          background:
            radial-gradient(circle at 15% 8%, rgba(255,255,255,.72), transparent 24%),
            radial-gradient(circle at 88% 18%, rgba(255,255,255,.5), transparent 22%),
            linear-gradient(180deg, #8fb79a 0%, #c6d9c5 28%, #d8e0d2 55%, #a9bd9f 100%);
          background-attachment: fixed;
          color: #222;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .22;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,.18) 0, rgba(255,255,255,.18) 1px, transparent 1px, transparent 4px);
          z-index: 9999;
        }
        .site-header {
          position: relative;
          z-index: 10;
          padding: 0;
          background: linear-gradient(#f7f7f7 0, #d5d5d5 48%, #b8b8b8 49%, #eeeeee 100%);
          border-bottom: 1px solid #666;
          box-shadow: 0 1px 3px rgba(0,0,0,.35);
          font-size: 12px;
        }
        .site-header::before {
          content: 'POURRITURE.ORG  —  internet terminal';
          display: block;
          height: 22px;
          line-height: 22px;
          padding: 0 9px;
          color: #333;
          font-weight: bold;
          text-align: center;
          text-shadow: 0 1px #fff;
          border-bottom: 1px solid #999;
          background: linear-gradient(#fdfdfd, #c9c9c9);
        }
        .site-header-logo {
          display: inline-block;
          margin: 5px 10px 5px 8px;
          padding-right: 10px;
          border-right: 1px solid #aaa;
        }
        .wordmark-link {
          display: inline-block;
          font-family: 'Arial Black', Impact, Haettenschweiler, sans-serif;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #284f2a;
          text-decoration: none;
          text-shadow: 1px 1px 0 #fff, -1px 0 #8da58d;
        }
        .wordmark-link:visited { color: #284f2a; }
        .site-header-nav { display: inline-block; vertical-align: middle; }
        .site-header-nav a { color: #0000ee; }
        .site-header-identity {
          float: right;
          margin: 5px 8px;
          padding: 2px 5px;
          border: 1px solid #999;
          background: #eee;
          box-shadow: inset 1px 1px #fff;
          font-size: 11px;
        }
        .site-header-identity a { color: #117743; }
        .container {
          position: relative;
          max-width: 920px;
          margin: 18px auto;
          padding: 10px;
          background: rgba(238,238,238,.97);
          border: 1px solid #777;
          border-top-color: #f8f8f8;
          box-shadow: 0 3px 12px rgba(0,0,0,.38), inset 1px 1px #fff;
        }
        .container::before {
          content: '◉  ◉  ◉     POURRITURE.ORG';
          display: block;
          margin: -10px -10px 9px;
          padding: 4px 8px;
          height: 25px;
          line-height: 17px;
          color: #444;
          font: bold 11px Tahoma, Arial, sans-serif;
          text-shadow: 0 1px #fff;
          background: linear-gradient(#f8f8f8, #c8c8c8 52%, #aaa 53%, #ddd);
          border-bottom: 1px solid #777;
        }
        .topnav, .page-nav {
          background: linear-gradient(#f5f5f5, #d0d0d0);
          border: 1px solid #aaa;
          border-bottom-color: #777;
          box-shadow: inset 1px 1px #fff;
        }
        .site-footer {
          max-width: 920px;
          margin: 24px auto 10px;
          padding: 8px;
          border: 1px solid #888;
          border-top-color: #f8f8f8;
          background: linear-gradient(#dedede, #bdbdbd);
          box-shadow: 0 2px 7px rgba(0,0,0,.25), inset 1px 1px #fff;
          color: #555;
        }
        .site-footer::before {
          content: 'status: online    |    archive: 2009—2017    |    connection: established';
          display: block;
          margin-bottom: 7px;
          padding: 2px 5px;
          border: 1px inset #aaa;
          background: #d7d7d7;
          color: #555;
          font: 10px 'Courier New', monospace;
          text-align: left;
        }
        .site-footer a { color: #0000ee; }
        button, input[type=submit], select, input, textarea {
          box-shadow: inset 1px 1px #fff;
        }
        button:active, input[type=submit]:active { box-shadow: inset 1px 1px #888; }
        @media (max-width: 600px) {
          .site-header::before { content: 'POURRITURE.ORG'; }
          .site-header-identity { float: none; display: block; width: max-content; margin: 0 8px 5px; }
          .container { margin: 8px 4px; padding: 6px; }
          .container::before { margin: -6px -6px 7px; }
          .site-footer { margin: 14px 4px 6px; }
        }
      `}</style>
      <div className="site-header">
        <div className="site-header-logo">
          <Link href="/" className="wordmark-link">POURRITURE.ORG</Link>
        </div>
        <div className="site-header-nav">
          [<Link href="/">Home</Link>]{' '}
          [<Link href="/catalog">Boards</Link>]{' '}
          [<Link href="/catalog">Catalog</Link>]{' '}
          [<Link href="/search">Search</Link>]{' '}
          [<Link href="/faq">FAQ</Link>]{' '}
          [<Link href="/rules">Rules</Link>]{' '}
          [<Link href="/request-board">Request board</Link>]{' '}
          [<Link href="/recover">Recover identity</Link>]
          {identity && <> {' '}[<Link href="/profile/friends">Friends</Link>] [<Link href="/messages">Messages</Link>] [<Link href={`/user/${identity.anonId}`}>Profile</Link>] [<Link href="/profile/edit">Edit profile</Link>]</>}
          {adminVisible && <> {' '}[<Link href="/admin">Admin</Link>]</>}
        </div>
        <div className="site-header-identity">
          {identity ? (
            <span className="anon-id"><Link href={`/user/${identity.anonId}`}>{identity.displayName?.trim() || 'Anonymous'} #{identity.anonId}</Link></span>
          ) : (
            <span className="anon-id">Anonymous</span>
          )}
        </div>
      </div>
    </>
  );
}

export function SiteFooter() {
  return (
    <div className="site-footer">
      <div className="footer-links">
        [<Link href="/rules">Rules</Link>]{' '}
        [<Link href="/faq">FAQ</Link>]{' '}
        [<Link href="/contact">Contact</Link>]{' '}
        [<Link href="/privacy">Privacy</Link>]{' '}
        [<Link href="/status">Status</Link>]
      </div>
      <div className="footer-info">
        <div><b>POURRITURE.ORG</b></div>
        <div>Established 2009</div>
        <div>Community forum</div>
        <div>v3.7 — Last updated: 2017</div>
      </div>
    </div>
  );
}

export function ThreadIndicator({ thread }) {
  return (
    <span className="thread-indicators">
      {thread.sticky && <span className="indicator sticky">[STICKY]</span>}
      {thread.locked && <span className="indicator locked">[LOCKED]</span>}
      {thread.archived && <span className="indicator archived">[ARCHIVED]</span>}
    </span>
  );
}

export function Badge({ badge, color }) {
  if (!badge) return null;
  const c = color || '#808080';
  return <span className="badge" style={{ borderColor: c, color: c }}>[{badge.toUpperCase()}]</span>;
}

export function UserStatus({ status }) {
  if (!status) return null;
  return <span className="user-status">[{status}]</span>;
}
