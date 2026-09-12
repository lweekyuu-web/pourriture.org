import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../../styles/aiReview.module.css';
import { checkModPermission } from '../../lib/permissions';

export default function AIReview({ initialReviews, error, isAuthorized }) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [filter, setFilter] = useState('PENDING'); // PENDING | REVIEWED | ALL
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const current = reviews[currentIndex];
  const filteredReviews = reviews.filter((r) => {
    if (filter === 'PENDING') return !r.reviewedAt;
    if (filter === 'REVIEWED') return r.reviewedAt;
    return true;
  });

  async function handleAction(decision, notes) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mod/ai-review/${current.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision, // APPROVED | REJECTED | FALSE_POSITIVE | UNCERTAIN
          notes,
        }),
      });

      if (res.ok) {
        // Update local state
        const updated = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
        if (currentIndex < reviews.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error handling action:', error);
    } finally {
      setActionLoading(false);
    }
  }

  if (!isAuthorized) {
    return (
      <div className={styles.container}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>AI Review - Moderator Panel</title>
      </Head>
      <div className={styles.container}>
        <h1>AI Moderation Review</h1>

        {/* Filter */}
        <div className={styles.filterBar}>
          {['PENDING', 'REVIEWED', 'ALL'].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {f} ({reviews.filter((r) => f === 'ALL' || (f === 'PENDING' ? !r.reviewedAt : r.reviewedAt)).length})
            </button>
          ))}
        </div>

        {/* Queue */}
        {filteredReviews.length === 0 ? (
          <div className={styles.empty}>
            <p>No {filter.toLowerCase()} reviews.</p>
          </div>
        ) : (
          <div className={styles.reviewQueue}>
            {current && (
              <div className={styles.reviewCard}>
                {/* Header */}
                <div className={styles.header}>
                  <div className={styles.status}>
                    <span className={styles.badge}>{current.decision}</span>
                    <span className={styles.confidence}>{(current.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <small>Target: {current.targetType} #{current.targetId}</small>
                </div>

                {/* Preview */}
                <div className={styles.preview}>
                  {current.targetType === 'avatar' && current.targetUrl && (
                    <img src={current.targetUrl} alt="Avatar" />
                  )}
                  {current.targetType !== 'avatar' && (
                    <div className={styles.textPreview}>
                      <p>{current.targetContent}</p>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className={styles.details}>
                  <div className={styles.reasons}>
                    <strong>Reasons:</strong>
                    <ul>
                      {current.reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {current.flaggedKeywords && current.flaggedKeywords.length > 0 && (
                    <div className={styles.keywords}>
                      <strong>Flagged:</strong>
                      {current.flaggedKeywords.map((kw, i) => (
                        <span key={i} className={styles.keyword}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review Status */}
                {current.reviewedAt && (
                  <div className={styles.reviewed}>
                    <p>
                      <strong>Reviewed {new Date(current.reviewedAt).toLocaleString()}</strong>
                    </p>
                    <p>Decision: {current.reviewDecision}</p>
                    {current.reviewNotes && <p>Notes: {current.reviewNotes}</p>}
                  </div>
                )}

                {/* Actions */}
                {!current.reviewedAt && (
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleAction('APPROVED', 'AI decision is correct')}
                      disabled={actionLoading}
                      className={styles.approve}
                    >
                      ✓ AI Correct
                    </button>
                    <button
                      onClick={() => handleAction('REJECTED', 'AI decision incorrect')}
                      disabled={actionLoading}
                      className={styles.reject}
                    >
                      ✗ AI Wrong
                    </button>
                    <button
                      onClick={() => handleAction('FALSE_POSITIVE', 'Content is legitimate')}
                      disabled={actionLoading}
                      className={styles.falsePositive}
                    >
                      ⚠ False Positive
                    </button>
                    <button
                      onClick={() => handleAction('UNCERTAIN', 'Unclear - needs more review')}
                      disabled={actionLoading}
                      className={styles.uncertain}
                    >
                      ? Uncertain
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <div className={styles.navigation}>
                  <button
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                  >
                    ← Previous
                  </button>
                  <span>
                    {currentIndex + 1} / {filteredReviews.length}
                  </span>
                  <button
                    onClick={() => setCurrentIndex((i) => Math.min(filteredReviews.length - 1, i + 1))}
                    disabled={currentIndex === filteredReviews.length - 1}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  try {
    // Check if user is moderator/admin
    const isAuthorized = await checkModPermission(req.cookies);
    if (!isAuthorized) {
      return {
        props: {
          isAuthorized: false,
          initialReviews: [],
        },
      };
    }

    // Fetch AI reviews
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/mod/ai-review`);
    const reviews = res.ok ? await res.json() : [];

    return {
      props: {
        isAuthorized: true,
        initialReviews: reviews,
      },
      revalidate: 10,
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        isAuthorized: false,
        error: 'Error loading reviews',
        initialReviews: [],
      },
    };
  }
}
