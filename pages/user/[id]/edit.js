import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../../styles/profileEdit.module.css';

export default function EditProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    signature: '',
    bio: '',
    profileTheme: 'default',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [gifs, setGifs] = useState([]);
  const [gifSearch, setGifSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    loadProfile();
    loadGifs();
  }, [id]);

  async function loadProfile() {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFormData({
          displayName: data.displayName || '',
          signature: data.signature || '',
          bio: data.bio || '',
          profileTheme: data.profileTheme || 'default',
        });
        if (data.selectedGifId) {
          setSelectedGif(data.selectedGifId);
        }
      }
    } catch (error) {
      setMessage('Error loading profile');
    }
  }

  async function loadGifs() {
    try {
      const res = await fetch('/api/gifs/search?query=');
      if (res.ok) {
        const data = await res.json();
        setGifs(data);
      }
    } catch (error) {
      console.error('Error loading GIFs:', error);
    }
  }

  async function searchGifs() {
    try {
      const res = await fetch(`/api/gifs/search?query=${encodeURIComponent(gifSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setGifs(data);
      }
    } catch (error) {
      console.error('Error searching GIFs:', error);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAvatarChange(e) {
    setAvatarFile(e.target.files?.[0] || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('displayName', formData.displayName);
      data.append('signature', formData.signature);
      data.append('bio', formData.bio);
      data.append('profileTheme', formData.profileTheme);
      if (selectedGif) {
        data.append('selectedGifId', selectedGif);
      }
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const res = await fetch(`/api/profile/update`, {
        method: 'PUT',
        body: data,
      });

      if (res.ok) {
        setMessage('Profile updated successfully!');
        setTimeout(() => {
          router.push(`/user/${id}`);
        }, 1500);
      } else {
        const error = await res.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Edit Profile - POURRITURE.ORG</title>
      </Head>
      <div className={styles.container}>
        <h1>Edit Profile</h1>

        {message && <div className={styles.message}>{message}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Display Name */}
          <div className={styles.formGroup}>
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              maxLength="30"
              placeholder="Your name"
            />
            <small>{formData.displayName.length}/30</small>
          </div>

          {/* Signature */}
          <div className={styles.formGroup}>
            <label htmlFor="signature">Signature</label>
            <textarea
              id="signature"
              name="signature"
              value={formData.signature}
              onChange={handleInputChange}
              maxLength="200"
              rows="3"
              placeholder="Your forum signature"
            />
            <small>{formData.signature.length}/200</small>
          </div>

          {/* Bio */}
          <div className={styles.formGroup}>
            <label htmlFor="bio">About Me</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              maxLength="500"
              rows="5"
              placeholder="Tell us about yourself..."
            />
            <small>{formData.bio.length}/500</small>
          </div>

          {/* Avatar Upload */}
          <div className={styles.formGroup}>
            <label htmlFor="avatar">Avatar</label>
            <input type="file" id="avatar" accept="image/*" onChange={handleAvatarChange} />
            {avatarFile && <small>Selected: {avatarFile.name}</small>}
            {user.avatar && user.avatar.status === 'PENDING' && (
              <div className={styles.pending}>Avatar pending moderation</div>
            )}
            {user.avatar && user.avatar.status === 'REJECTED' && (
              <div className={styles.rejected}>Avatar rejected: {user.avatar.moderationNote}</div>
            )}
          </div>

          {/* GIF Selection */}
          <div className={styles.formGroup}>
            <label>Profile GIF</label>
            <div className={styles.gifSearch}>
              <input
                type="text"
                value={gifSearch}
                onChange={(e) => setGifSearch(e.target.value)}
                placeholder="Search GIFs..."
              />
              <button type="button" onClick={searchGifs}>
                Search
              </button>
            </div>
            <div className={styles.gifGrid}>
              {gifs.map((gif) => (
                <div
                  key={gif.id}
                  className={`${styles.gifItem} ${selectedGif === gif.id ? styles.selected : ''}`}
                  onClick={() => setSelectedGif(gif.id)}
                >
                  <img src={gif.url} alt={gif.title} />
                  <small>{gif.title}</small>
                </div>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className={styles.formGroup}>
            <label htmlFor="profileTheme">Profile Theme</label>
            <select name="profileTheme" id="profileTheme" value={formData.profileTheme} onChange={handleInputChange}>
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="retro">Retro</option>
              <option value="blue">Blue</option>
            </select>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </>
  );
}
