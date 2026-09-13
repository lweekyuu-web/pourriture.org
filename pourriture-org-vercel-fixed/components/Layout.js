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
            radial-gradient(circle at 50% 4%, rgba(255,255,255,.95), transparent 16%),
            linear-gradient(180deg, #7ec4ef 0%, #c8ecff 34%, #eaf7ff 57%, #b8e08a 72%, #70b24b 100%);
          background-attachment: fixed;
          color: #222;
        }
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -1;
          opacity: .32;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,.16) 0, rgba(255,255,255,.16) 1px, transparent 1px, transparent 5px);
        }
        .site-header {
          position: relative;
          z-index: 10;
          padding: 0;
          background: linear-gradient(#f8fbff 0, #dceaf7 45%, #b8d3ea 46%, #e9f2f9 100%);
          border-bottom: 1px solid #5d7891;
          box-shadow: 0 1px 5px rgba(0,35,70,.35);
          font-size: 12px;
        }
        .site-header::before {
          content: 'POURRITURE.ORG  —  Internet Terminal';
          display: block;
          height: 22px;
          line-height: 22px;
          padding: 0 9px;
          color: #173b62;
          font-weight: bold;
          text-align: center;
          text-shadow: 0 1px #fff;
          border-bottom: 1px solid #8da6bc;
          background: linear-gradient(#ffffff, #d8e6f3 48%, #bfd2e3 49%, #edf5fb);
        }
        .site-header-logo {
          display: inline-block;
          margin: 5px 10px 5px 8px;
          padding-right: 10px;
          border-right: 1px solid #9eb5c9;
        }
        .wordmark-link {
          display: inline-block;
          font-family: 'Arial Black', Impact, Haettenschweiler, sans-serif;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #155a9b;
          text-decoration: none;
          text-shadow: 1px 1px 0 #fff, 0 0 1px #315b7d;
        }
        .wordmark-link:visited { color: #155a9b; }
        .site-header-nav { display: inline-block; vertical-align: middle; }
        .site-header-nav a { color: #0000ee; }
        .site-header-identity {
          float: right;
          margin: 5px 8px;
          padding: 2px 5px;
          border: 1px solid #7d9bb4;
          background: linear-gradient(#fff, #e7f0f7);
          box-shadow: inset 1px 1px #fff;
          font-size: 11px;
        }
        .site-header-identity a { color: #117743; }
        .container {
          position: relative;
          max-width: 980px;
          margin: 18px auto;
          padding: 10px;
          background: rgba(244,248,252,.97);
          border: 1px solid #66839d;
          border-top-color: #fff;
          box-shadow: 0 4px 15px rgba(0,45,90,.4), inset 1px 1px #fff;
        }
        .container::before {
          content: '◉  ◉  ◉     POURRITURE.ORG';
          display: block;
          margin: -10px -10px 9px;
          padding: 4px 8px;
          height: 25px;
          line-height: 17px;
          color: #17466e;
          font: bold 11px Tahoma, Arial, sans-serif;
          text-shadow: 0 1px #fff;
          background: linear-gradient(#fdfefe, #d9e8f5 50%, #b7cee1 51%, #eaf3fa);
          border-bottom: 1px solid #66839d;
        }
        .topnav, .page-nav {
          background: linear-gradient(#f8fcff, #d7e7f4);
          border: 1px solid #88a7c0;
          border-bottom-color: #5e7d98;
          box-shadow: inset 1px 1px #fff;
        }
        .site-footer {
          max-width: 980px;
          margin: 24px auto 10px;
          padding: 8px;
          border: 1px solid #6c879d;
          border-top-color: #fff;
          background: linear-gradient(#e5f0f8, #bcd1e1);
          box-shadow: 0 2px 8px rgba(0,45,90,.3), inset 1px 1px #fff;
          color: #4a5e6d;
        }
        .site-footer::before {
          content: 'status: online    |    archive: 2009—2017    |    connection: established';
          display: block;
          margin-bottom: 7px;
          padding: 2px 5px;
          border: 1px inset #9eb4c6;
          background: #d5e1ea;
          color: #4d6274;
          font: 10px 'Courier New', monospace;
          text-align: left;
        }
        .site-footer a { color: #0000ee; }
        button, input[type=submit], select, input, textarea {
          box-shadow: inset 1px 1px #fff;
        }
        button, input[type=submit] {
          background: linear-gradient(#fff, #e1eaf2 48%, #c8d9e7 49%, #edf4f9);
          border-color: #7894aa;
        }
        button:hover, input[type=submit]:hover { background: linear-gradient(#fff, #dcecff); }
        button:active, input[type=submit]:active { box-shadow: inset 1px 1px #6d8497; }
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
