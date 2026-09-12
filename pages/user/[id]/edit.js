import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../../styles/profileEdit.module.css';

export default function EditProfile({ isOwner }) {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({ displayName: '', signature: '', bio: '', profileTheme: 'default' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [selectedGif, setSelectedGif] = useState('');
  const [gifs, setGifs] = useState([]);
  const [gifSearch, setGifSearch] = useState('');
  const [gifCategory, setGifCategory] = useState('');

  useEffect(() => {
    if (!id || !isOwner) return;
    loadProfile();
    loadGifs('', '');
  }, [id, isOwner]);

  async function loadProfile() {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data);
      setFormData({ displayName: data.displayName || '', signature: data.signature || '', bio: data.bio || '', profileTheme: data.profileTheme || 'default' });
      setSelectedGif(data.profileGif?.gifId || '');
    } catch {
      setMessage('Error loading profile');
    }
  }

  async function loadGifs(query = gifSearch, category = gifCategory) {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    try {
      const res = await fetch(`/api/gifs/search?${params.toString()}`);
      if (res.ok) setGifs(await res.json());
    } catch (error) {
      console.error('Error loading GIFs:', error);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = new FormData();
      data.append('displayName', formData.displayName);
      data.append('signature', formData.signature);
      data.append('bio', formData.bio);
      data.append('profileTheme', formData.profileTheme);
      if (selectedGif) data.append('selectedGifId', selectedGif);
      if (avatarFile) data.append('avatar', avatarFile);

      const res = await fetch('/api/profile/update', { method: 'PUT', body: data });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Update failed');

      setMessage('Profile updated successfully.');
      setTimeout(() => router.push(`/user/${id}`), 700);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!isOwner) {
    return <div className={styles.container}><h1>Access Denied</h1><p>You can only edit your own POURRITURE.ORG profile.</p></div>;
  }

  if (!user) return <div className={styles.container}>Loading...</div>;

  return (
    <>
      <Head><title>Edit Profile - POURRITURE.ORG</title></Head>
      <div className={styles.container}>
        <h1>Edit Profile</h1>
        <p className={styles.notice}>Changes stay compact and forum-like. Avatars are moderated before they appear publicly.</p>
        {message && <div className={styles.message}>{message}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="displayName">Display Name</label>
            <input type="text" id="displayName" name="displayName" value={formData.displayName} onChange={handleInputChange} maxLength={30} />
            <small>{formData.displayName.length}/30</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="signature">Signature</label>
            <textarea id="signature" name="signature" value={formData.signature} onChange={handleInputChange} maxLength={200} rows={3} />
            <small>{formData.signature.length}/200</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio">About Me</label>
            <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} maxLength={500} rows={5} />
            <small>{formData.bio.length}/500</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="avatar">Avatar</label>
            <input type="file" id="avatar" accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
            <small>Maximum 2 MB. The server checks the real image signature, not just the filename.</small>
            {avatarFile && <small>Selected: {avatarFile.name}</small>}
            {user.avatar && user.avatar.status === 'PENDING' && <div className={styles.pending}>Avatar pending moderation.</div>}
            {user.avatar && user.avatar.status === 'REVIEW_REQUIRED' && <div className={styles.pending}>Avatar sent to moderator review.</div>}
            {user.avatar && user.avatar.status === 'REJECTED' && <div className={styles.rejected}>Avatar rejected: {user.avatar.moderationNote || 'See moderator review.'}</div>}
          </div>

          <div className={styles.formGroup}>
            <label>Profile GIF</label>
            <small>Only GIFs from the approved library can be selected. No arbitrary GIF upload.</small>
            <div className={styles.gifSearch}>
              <input type="text" value={gifSearch} onChange={(e) => setGifSearch(e.target.value)} placeholder="Search the GIF library..." />
              <button type="button" onClick={() => loadGifs(gifSearch, gifCategory)}>Search</button>
            </div>
            <div className={styles.gifSearch}>
              <select value={gifCategory} onChange={(e) => { setGifCategory(e.target.value); loadGifs(gifSearch, e.target.value); }}>
                <option value="">All categories</option>
                <option value="Funny">Funny</option>
                <option value="Reaction">Reaction</option>
                <option value="Animals">Animals</option>
                <option value="Retro">Retro</option>
              </select>
              {selectedGif && <button type="button" onClick={() => setSelectedGif('')}>Clear GIF</button>}
            </div>
            <div className={styles.gifGrid}>
              {gifs.map((gif) => (
                <button type="button" key={gif.id} className={`${styles.gifItem} ${selectedGif === gif.id ? styles.selected : ''}`} onClick={() => setSelectedGif(gif.id)}>
                  <img src={gif.url} alt={gif.title} />
                  <small>{gif.title}</small>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="profileTheme">Profile Theme</label>
            <select name="profileTheme" id="profileTheme" value={formData.profileTheme} onChange={handleInputChange}>
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="retro">Retro</option>
              <option value="blue">Blue</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>{loading ? 'Updating...' : 'Update Profile'}</button>
        </form>
      </div>
    </>
  );
}

export async function getServerSideProps({ req, params }) {
  const cookie = req.cookies?.pourriture_uid;
  if (!cookie) return { props: { isOwner: false } };

  try {
    const prisma = require('../../../lib/prisma');
    const user = await prisma.user.findFirst({ where: { OR: [{ id: params.id }, { anonId: params.id }] }, select: { id: true } });
    return { props: { isOwner: !!user && user.id === cookie } };
  } catch {
    return { props: { isOwner: false } };
  }
}
