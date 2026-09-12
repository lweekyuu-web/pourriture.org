import Link from 'next/link';
import { useEffect, useState } from 'react';

function Layout({ children, isAdmin }) {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get user ID from cookie
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };
    setUserId(getCookie('pourriture_uid'));
  }, []);

  return (
    <div className="page-wrapper">
      <SiteHeader isAdmin={isAdmin} userId={userId} />
      {children}
      <SiteFooter />
    </div>
  );
}

export function SiteHeader({ isAdmin, userId }) {
  return (
    <div className="topnav">
      [<Link href="/">Return</Link>] [<Link href="/catalog">Catalog</Link>]
      {userId && [<Link href={`/user/${userId}`} key="profile">Profile</Link>]}
      {userId && [<Link href={`/user/${userId}/edit`} key="edit">Edit Profile</Link>]}
      {isAdmin && [<Link href="/admin" key="admin">Admin</Link>]}
      [<Link href="/rules">Rules</Link>] [<Link href="/faq">FAQ</Link>]
    </div>
  );
}

export function SiteFooter() {
  return (
    <div className="footer-nav">
      [<Link href="/privacy">Privacy</Link>] [<Link href="/contact">Contact</Link>] [<Link href="/status">Status</Link>]
    </div>
  );
}

export default Layout;
