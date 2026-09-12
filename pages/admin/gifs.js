import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../../styles/gifManagement.module.css';
import { checkAdminCookie } from '../../lib/admin';

export default function GifManagement({ isAdmin, error }) {
  const [gifs, setGifs] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [disabledCategories, setDisabledCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadGifData();
    }
  }, [isAdmin]);

  async function loadGifData() {
    try {
      const res = await fetch('/api/admin/gifs');
      if (res.ok) {
        const data = await res.json();
        setGifs(data.gifs || []);
        setBlacklist(data.blacklist || []);
        setDisabledCategories(data.disabledCategories || []);
      }
    } catch (error) {
      console.error('Error loading GIF data:', error);
    }
  }

  async function toggleBlacklist(gifId) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gifs/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gifId, action: blacklist.includes(gifId) ? 'remove' : 'add' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBlacklist(updated.blacklist);
        setMessage(`GIF ${blacklist.includes(gifId) ? 'removed from' : 'added to'} blacklist`);
      }
    } catch (error) {
      setMessage('Error updating blacklist');
    } finally {
      setLoading(false);
    }
  }

  async function toggleCategory(category) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gifs/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          action: disabledCategories.includes(category) ? 'enable' : 'disable',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDisabledCategories(updated.disabledCategories);
        setMessage(`Category ${disabledCategories.includes(category) ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      setMessage('Error updating categories');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
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
        <title>GIF Management - Admin Panel</title>
      </Head>
      <div className={styles.container}>
        <h1>🎬 GIF Management</h1>

        {message && <div className={styles.message}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}

        {/* Disabled Categories */}
        <div className={styles.section}>
          <h2>Categories</h2>
          <p>Disable categories to hide them from all users</p>
          <div className={styles.categoryGrid}>
            {['funny', 'reaction', 'animals', 'retro', 'anime', 'memes'].map((category) => (
              <div key={category} className={styles.categoryCard}>
                <div className={styles.categoryName}>{category}</div>
                <button
                  onClick={() => toggleCategory(category)}
                  disabled={loading}
                  className={disabledCategories.includes(category) ? styles.disabled : styles.enabled}
                >
                  {disabledCategories.includes(category) ? '⊘ Disabled' : '✓ Enabled'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* GIF Blacklist */}
        <div className={styles.section}>
          <h2>GIF Blacklist</h2>
          <p>Blacklist individual GIFs to prevent their selection</p>
          <div className={styles.gifGrid}>
            {gifs.map((gif) => (
              <div
                key={gif.id}
                className={`${styles.gifCard} ${blacklist.includes(gif.id) ? styles.blacklisted : ''}`}
              >
                <img src={gif.url} alt={gif.title} />
                <div className={styles.gifInfo}>
                  <div className={styles.gifTitle}>{gif.title}</div>
                  <button
                    onClick={() => toggleBlacklist(gif.id)}
                    disabled={loading}
                    className={blacklist.includes(gif.id) ? styles.remove : styles.block}
                  >
                    {blacklist.includes(gif.id) ? '✓ Blacklisted' : 'Blacklist'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  try {
    const isAdmin = await checkAdminCookie(req.cookies);
    if (!isAdmin) {
      return {
        props: { isAdmin: false },
      };
    }

    return {
      props: { isAdmin: true },
    };
  } catch (error) {
    return {
      props: { isAdmin: false, error: error.message },
    };
  }
}
