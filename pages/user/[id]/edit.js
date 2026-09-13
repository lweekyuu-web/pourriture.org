import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../../styles/profileEdit.module.css';

export default function EditProfile({ isOwner }) {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({ displayName:'', signature:'', bio:'', profileTheme:'default', profileLayout:'standard', showPostCount:true, showJoinDate:true, badge:'' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [selectedGif, setSelectedGif] = useState('');
  const [gifs, setGifs] = useState([]);
  const [gifSearch, setGifSearch] = useState('');
  const [gifCategory, setGifCategory] = useState('');

  useEffect(() => { if (id && isOwner) { loadProfile(); loadGifs('', ''); } }, [id, isOwner]);

  async function loadProfile() {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data);
      setFormData({ displayName:data.displayName || '', signature:data.signature || '', bio:data.bio || '', profileTheme:data.profileTheme || data.customizations?.theme || 'default', profileLayout:data.customizations?.profileLayout || 'standard', showPostCount:data.customizations?.showPostCount !== false, showJoinDate:data.customizations?.showJoinDate !== false, badge:data.badge || '' });
      setSelectedGif(data.profileGif?.gifId || '');
      setAvatarPreview(data.avatar?.url || '');
      setBannerPreview(data.bannerUrl || '');
    } catch { setMessage('Error loading profile'); }
  }

  async function loadGifs(query = gifSearch, category = gifCategory) {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    try { const res = await fetch(`/api/gifs/search?${params.toString()}`); if (res.ok) setGifs(await res.json()); } catch (error) { console.error(error); }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleImageChange(e, type) {
    const file = e.target.files?.[0] || null;
    if (type === 'avatar') { setAvatarFile(file); setAvatarPreview(file ? URL.createObjectURL(file) : (user?.avatar?.url || '')); }
    if (type === 'banner') { setBannerFile(file); setBannerPreview(file ? URL.createObjectURL(file) : (user?.bannerUrl || '')); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, String(value)));
      if (selectedGif) data.append('selectedGifId', selectedGif); else data.append('clearGif', 'true');
      if (avatarFile) data.append('avatar', avatarFile);
      if (bannerFile) data.append('banner', bannerFile);
      const res = await fetch('/api/profile/update', { method:'PUT', body:data });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Update failed');
      setMessage('Profile saved. New images may stay hidden until moderation approves them.');
      setTimeout(() => router.push(`/user/${encodeURIComponent(id)}`), 900);
    } catch (error) { setMessage(`Error: ${error.message}`); }
    finally { setLoading(false); }
  }

  if (!isOwner) return <div className={styles.container}><div className={styles.panel}><h1>Access Denied</h1><p>You can only edit your own POURRITURE.ORG profile.</p></div></div>;
  if (!user) return <div className={styles.container}><div className={styles.panel}>Loading profile...</div></div>;

  const selectedGifObject = gifs.find(gif => gif.id === selectedGif);

  return <>
    <Head><title>Edit Profile - POURRITURE.ORG</title></Head>
    <div className={styles.container}>
      <div className={styles.topbar}><strong>POURRITURE.ORG</strong><span>CONTROL PANEL / PROFILE</span></div>
      <div className={styles.breadcrumb}><Link href={`/user/${encodeURIComponent(id)}`}><a>&lt; Back to profile</a></Link> · Edit Profile</div>
      <div className={styles.headingRow}><div><h1>Edit Profile</h1><p>Customize your old-web profile without free HTML or scripts.</p></div><div className={styles.accountLabel}>ACCOUNT<br/><strong>{user.displayName || user.anonId}</strong></div></div>
      {message && <div className={styles.message}>{message}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <fieldset><legend>Identity</legend>
          <div className={styles.formGroup}><label htmlFor="displayName">Display Name</label><input type="text" id="displayName" name="displayName" value={formData.displayName} onChange={handleInputChange} maxLength={30}/><small>{formData.displayName.length}/30 characters</small></div>
          <div className={styles.formGroup}><label htmlFor="badge">Displayed Badge</label><input type="text" id="badge" name="badge" value={formData.badge} onChange={handleInputChange} maxLength={40}/><small>Must match an existing site badge. Badges never grant permissions.</small></div>
        </fieldset>

        <fieldset><legend>Text</legend>
          <div className={styles.formGroup}><label htmlFor="bio">About Me</label><textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} maxLength={500} rows={5}/><small>{formData.bio.length}/500 characters</small></div>
          <div className={styles.formGroup}><label htmlFor="signature">Signature</label><textarea id="signature" name="signature" value={formData.signature} onChange={handleInputChange} maxLength={200} rows={3}/><small>{formData.signature.length}/200 — plain text only.</small></div>
        </fieldset>

        <fieldset><legend>Classic profile style</legend>
          <div className={styles.styleGrid}>
            <div className={styles.formGroup}><label>Profile Theme</label><select name="profileTheme" value={formData.profileTheme} onChange={handleInputChange}><option value="default">Default</option><option value="dark">Dark</option><option value="retro">Retro</option><option value="blue">Blue</option></select></div>
            <div className={styles.formGroup}><label>Profile Layout</label><select name="profileLayout" value={formData.profileLayout} onChange={handleInputChange}><option value="standard">Standard</option><option value="compact">Compact</option><option value="classic">Classic</option></select></div>
          </div>
          <div className={styles.formGroup}><label>Visibility</label><label className={styles.check}><input type="checkbox" name="showPostCount" checked={formData.showPostCount} onChange={handleInputChange}/> Show post count</label><label className={styles.check}><input type="checkbox" name="showJoinDate" checked={formData.showJoinDate} onChange={handleInputChange}/> Show join date</label></div>
        </fieldset>

        <fieldset><legend>Images</legend>
          <div className={styles.imageColumns}>
            <div className={styles.formGroup}><label htmlFor="avatar">Avatar</label><input type="file" id="avatar" accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp" onChange={e=>handleImageChange(e,'avatar')}/><small>Max 512×512 / 2 MB. File signature is checked and the image is moderated.</small>{avatarPreview && <div className={styles.preview}><span>Preview</span><img src={avatarPreview} alt="Avatar preview" /></div>}{user.avatar?.status === 'PENDING' && <div className={styles.pending}>PENDING — waiting for moderation.</div>}{user.avatar?.status === 'REVIEW_REQUIRED' && <div className={styles.pending}>REVIEW REQUIRED — sent to a moderator.</div>}{user.avatar?.status === 'REJECTED' && <div className={styles.rejected}>REJECTED — {user.avatar.moderationNote || 'See moderator review.'}</div>}</div>
            <div className={styles.formGroup}><label htmlFor="banner">Profile Banner</label><input type="file" id="banner" accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp" onChange={e=>handleImageChange(e,'banner')}/><small>Max 900×180 / 3 MB. Banners are checked and moderated too.</small>{bannerPreview && <div className={styles.bannerPreview}><span>Preview</span><img src={bannerPreview} alt="Banner preview" /></div>}</div>
          </div>
        </fieldset>

        <fieldset><legend>Profile GIF — approved library</legend>
          <p className={styles.help}>No arbitrary GIF upload. Pick an item already approved by the site.</p>
          <div className={styles.gifSearch}><input type="text" value={gifSearch} onChange={e=>setGifSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();loadGifs(gifSearch,gifCategory);}}} placeholder="Search GIF library..."/><button type="button" onClick={()=>loadGifs(gifSearch,gifCategory)}>Search</button></div>
          <div className={styles.gifFilters}><select value={gifCategory} onChange={e=>{setGifCategory(e.target.value);loadGifs(gifSearch,e.target.value);}}><option value="">All categories</option><option value="Funny">Funny</option><option value="Reaction">Reaction</option><option value="Animals">Animals</option><option value="Internet">Internet</option><option value="Retro">Retro</option><option value="Anime">Anime</option><option value="Memes">Memes</option></select>{selectedGif && <button type="button" onClick={()=>setSelectedGif('')}>Clear selection</button>}</div>
          {selectedGifObject && <div className={styles.selectedGif}><strong>Selected:</strong> {selectedGifObject.title}<img src={selectedGifObject.url} alt={selectedGifObject.title}/></div>}
          <div className={styles.gifGrid}>{gifs.map(gif=><button type="button" key={gif.id} className={`${styles.gifItem} ${selectedGif===gif.id?styles.selected:''}`} onClick={()=>setSelectedGif(gif.id)}><img src={gif.url} alt={gif.title}/><small>{gif.title}</small></button>)}</div>
        </fieldset>

        <div className={styles.saveBar}><span>Changes are saved together.</span><button type="submit" disabled={loading} className={styles.submitBtn}>{loading?'Saving...':'Save Profile'}</button></div>
      </form>
    </div>
  </>;
}

export async function getServerSideProps({ req, params }) {
  const cookie = req.cookies?.pourriture_uid;
  if (!cookie) return { props:{isOwner:false} };
  try {
    const prisma = require('../../../lib/prisma');
    const user = await prisma.user.findFirst({ where:{ OR:[{id:params.id},{anonId:params.id}] }, select:{id:true} });
    return { props:{isOwner:!!user && user.id===cookie} };
  } catch { return { props:{isOwner:false} }; }
}
