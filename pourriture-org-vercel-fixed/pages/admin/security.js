import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';
import styles from '../../styles/admin.module.css';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/', permanent: false } };
  const users = await prisma.user.findMany({
    select: { anonId: true, displayName: true, role: true, lastLoginAt: true, lastLoginIp: true },
    orderBy: { lastLoginAt: 'desc' },
    take: 100,
  });
  return { props: { users: JSON.parse(JSON.stringify(users)) } };
}

export default function Security({ users }) {
  return <>
    <div className="topnav">[<Link href="/"><a>Home</a></Link>] [<Link href="/admin"><a>Admin</a></Link>] [<Link href="/admin/security"><a>Security</a></Link>]</div>
    <main className="container">
      <section className={styles.panel}>
        <h1>SECURITY / LOGIN ACTIVITY</h1>
        <p className="muted">IP addresses are private security information. They are visible here only to authorized site administrators, not to ordinary users or friends.</p>
        <table className={styles.table}>
          <thead><tr><th>Identity</th><th>Name</th><th>Role</th><th>Last login</th><th>IP</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u.anonId}>
            <td>{u.anonId}</td><td>{u.displayName || 'Anonymous'}</td><td>{u.role}</td>
            <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
            <td>{u.lastLoginIp || '—'}</td>
          </tr>)}</tbody>
        </table>
      </section>
    </main>
  </>;
}
