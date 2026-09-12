import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../../styles/modLogs.module.css';
import { checkModPermission } from '../../lib/permissions';

export default function ModerationLogs({ initialLogs, isAuthorized }) {
  const [logs, setLogs] = useState(initialLogs || []);
  const [filter, setFilter] = useState('ALL'); // ALL | AVATAR | PROFILE | USER
  const [search, setSearch] = useState('');

  const filtered = logs.filter((log) => {
    if (filter !== 'ALL' && log.targetType !== filter.toLowerCase()) return false;
    if (search && !log.reason?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  if (!isAuthorized) {
    return (
      <div className={styles.container}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Moderation Logs - Admin Panel</title>
      </Head>
      <div className={styles.container}>
        <h1>📋 Moderation Logs</h1>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            {['ALL', 'AVATAR', 'PROFILE', 'USER'].map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Logs Table */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No logs found.</p>
          </div>
        ) : (
          <table className={styles.logsTable}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>Moderator</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className={styles[`action-${log.action.toLowerCase()}`]}>
                  <td className={styles.time}>{formatDate(log.createdAt)}</td>
                  <td className={styles.action}>
                    <span className={styles.badge}>{log.action}</span>
                  </td>
                  <td className={styles.target}>
                    {log.targetType} #{log.targetId.substring(0, 8)}
                  </td>
                  <td className={styles.moderator}>
                    {log.moderator?.displayName || log.moderator?.anonId || 'System'}
                  </td>
                  <td className={styles.reason}>{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  try {
    const isAuthorized = await checkModPermission(req.cookies);
    if (!isAuthorized) {
      return {
        props: {
          isAuthorized: false,
          initialLogs: [],
        },
      };
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/mod/logs`);
    const logs = res.ok ? await res.json() : [];

    return {
      props: {
        isAuthorized: true,
        initialLogs: logs,
      },
      revalidate: 30,
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        isAuthorized: false,
        initialLogs: [],
      },
    };
  }
}
