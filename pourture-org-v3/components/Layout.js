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

  return (
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
        [<Link href="/rules">Rules</Link>]
        {isAdmin && ' '}[<Link href="/admin">Admin</Link>]
      </div>
      <div className="site-header-identity">
        {identity ? (
          <span className="anon-id">Anonymous #{identity.anonId}</span>
        ) : (
          <span className="anon-id">Anonymous</span>
        )}
      </div>
    </div>
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
        <div>This is a fictional experimental community.</div>
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
  return (
    <span className="badge" style={{ borderColor: c, color: c }}>
      [{badge.toUpperCase()}]
    </span>
  );
}

export function UserStatus({ status }) {
  if (!status) return null;
  return <span className="user-status">[{status}]</span>;
}
