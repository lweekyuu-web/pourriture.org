import { useMemo, useState } from 'react';
import Head from 'next/head';
import styles from '../../styles/aiReview.module.css';

export default function AIReview({ initialReviews, error, isAuthorized }) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [filter, setFilter] = useState('PENDING');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const filteredReviews = useMemo(() => reviews.filter((r) => filter === 'ALL' || (filter === 'PENDING' ? !r.reviewedAt : !!r.reviewedAt)), [reviews, filter]);
  const current = filteredReviews[currentIndex];

  async function handleAction(action, notes) {
    if (!current) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mod/ai-review/${current.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, notes }) });
      if (!res.ok) throw new Error((await res.json()).message || 'Action failed');
      const updated = await res.json();
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      if (currentIndex < filteredReviews.length - 1) setCurrentIndex((i) => i + 1);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (!isAuthorized) return <div className={styles.container}><h1>Access Denied</h1><p>You do not have permission to access AI moderation.</p></div>;
  if (error) return <div className={styles.container}><h1>Error</h1><p>{error}</p></div>;

  return (
    <>
      <Head><title>AI Review - POURRITURE.ORG</title></Head>
      <div className={styles.container}>
        <h1>AI Moderation Review</h1>
        <p>AI suggestions are advisory. Human moderators make the final decision.</p>
        <div className={styles.filterBar}>{['PENDING', 'REVIEWED', 'ALL'].map((f) => <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`} onClick={() => { setFilter(f); setCurrentIndex(0); }}>{f} ({reviews.filter((r) => f === 'ALL' || (f === 'PENDING' ? !r.reviewedAt : !!r.reviewedAt)).length})</button>)}</div>

        {!current ? <div className={styles.empty}><p>No {filter.toLowerCase()} reviews.</p></div> : (
          <div className={styles.reviewQueue}><div className={styles.reviewCard}>
            <div className={styles.header}><div className={styles.status}><span className={styles.badge}>{current.decision}</span><span className={styles.confidence}>{(current.confidence * 100).toFixed(0)}%</span></div><small>Target: {current.targetType} #{current.targetId} · User {current.userId}</small></div>
            <div className={styles.preview}>{current.targetType === 'avatar' && current.targetUrl ? <img src={current.targetUrl} alt="Avatar under review" /> : <div className={styles.textPreview}><p>{current.targetContent || 'No preview available.'}</p></div>}</div>
            <div className={styles.details}><div className={styles.reasons}><strong>AI reasons:</strong><ul>{(current.reasons || []).map((reason, i) => <li key={i}>{reason}</li>)}</ul></div>{current.flaggedKeywords?.length > 0 && <div className={styles.keywords}><strong>Flagged:</strong>{current.flaggedKeywords.map((kw, i) => <span key={i} className={styles.keyword}>{kw}</span>)}</div>}</div>
            {current.reviewedAt && <div className={styles.reviewed}><p><strong>Reviewed {new Date(current.reviewedAt).toLocaleString()}</strong></p><p>Decision: {current.reviewDecision}</p>{current.reviewNotes && <p>Notes: {current.reviewNotes}</p>}</div>}
            {!current.reviewedAt && <div className={styles.actions}>
              {current.targetUrl && <a className={styles.approve} href={current.targetUrl} target="_blank" rel="noreferrer">View Avatar</a>}
              <button onClick={() => handleAction('APPROVE_ANYWAY', 'Moderator approved despite AI result')} disabled={actionLoading} className={styles.approve}>Approve Anyway</button>
              <button onClick={() => handleAction('REJECT', 'Moderator rejected after review')} disabled={actionLoading} className={styles.reject}>Reject</button>
              <button onClick={() => handleAction('FALSE_POSITIVE', 'AI false positive')} disabled={actionLoading} className={styles.falsePositive}>AI False Positive</button>
              <button onClick={() => handleAction('REQUEST_REVIEW', 'Needs further human review')} disabled={actionLoading} className={styles.uncertain}>Request Review</button>
              <button onClick={() => handleAction('REMOVE', 'Content removed by moderator')} disabled={actionLoading} className={styles.reject}>Remove</button>
              <button onClick={() => handleAction('WARN_USER', 'Warning issued from moderation review')} disabled={actionLoading} className={styles.uncertain}>Warn User</button>
              <button onClick={() => handleAction('SUSPEND_USER', 'Temporary suspension issued from moderation review')} disabled={actionLoading} className={styles.reject}>Suspend User</button>
            </div>}
            <div className={styles.navigation}><button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>← Previous</button><span>{currentIndex + 1} / {filteredReviews.length}</span><button onClick={() => setCurrentIndex((i) => Math.min(filteredReviews.length - 1, i + 1))} disabled={currentIndex >= filteredReviews.length - 1}>Next →</button></div>
          </div></div>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  try {
    const { checkModPermission } = require('../../lib/permissions');
    const isAuthorized = await checkModPermission(req);
    if (!isAuthorized) return { props: { isAuthorized: false, initialReviews: [] } };
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const res = await fetch(`${protocol}://${host}/api/mod/ai-review`, { headers: { cookie: req.headers.cookie || '' } });
    return { props: { isAuthorized: true, initialReviews: res.ok ? await res.json() : [] } };
  } catch (error) {
    return { props: { isAuthorized: false, error: 'Error loading reviews', initialReviews: [] } };
  }
}
