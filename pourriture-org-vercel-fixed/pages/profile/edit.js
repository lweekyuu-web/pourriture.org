import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../../styles/profileEditor.module.css';

const nameColors = [
  ['#117743', 'green'], ['#0000ee', 'blue'], ['#af0a0f', 'red'], ['#7a3e9d', 'purple'],
  ['#555555', 'gray'], ['#8a5a00', 'brown'], ['#008080', 'teal'],
];

export default function EditProfile() {
  const [form, setForm] = useState({ displayName: '', bio: '', signature: '', avatarUrl: '', bannerUrl: '', profileTheme: 'classic', profileLayout: 'compact', profileNameColor: '#117743', profileNameStyle: 'normal', profileGifUrl: '' });
  const [mediaState, setMediaState] = useState({ avatarStatus: 'approved', bannerStatus: 'approved' });
  const [state, setState] = useState('loading');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Not signed in')))
      .then((data) => {
        setForm((current) => ({ ...current, ...data }));
        setMediaState({ avatarStatus: data.avatarStatus || 'approved', bannerStatus: data.bannerStatus || 'approved' });
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function save(e) {
    e.preventDefault();
    setState('saving'); setNotice('');
    const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      setMediaState({ avatarStatus: data.avatarStatus || 'approved', bannerStatus: data.bannerStatus || 'approved' });
      setNotice(data.notice || 'Profile saved.'); setState('saved');
    } else { setNotice(data.error || 'Unable to save profile.'); setState('error'); }
  }

  if (state === 'loading') return <main className="container"><p>Loading profile editor...</p></main>;
  if (state === 'error' && !form.anonId) return <main className="container"><p className="notification">Unable to load your profile. Make sure your site identity cookie is active.</p><Link href="/">[Return]</Link></main>;

  const titleStyle = { color: form.profileNameColor, fontWeight: form.profileNameStyle.includes('bold') ? 'bold' : 'normal', fontStyle: form.profileNameStyle.includes('italic') ? 'italic' : 'normal' };

  return (
    <main className={`container profile-theme-${form.profileTheme || 'classic'}`}>
      <div className="topnav">[<Link href="/">Home</Link>] [<Link href={`/user/${form.anonId}`}>My profile</Link>] [<Link href="/recover">Recover identity</Link>]</div>
      <div className={styles.editorShell}>
        <h1 className="sitetitle">EDIT MY PROFILE</h1>
        <div className={styles.topNote}><b>MySpace mode:</b> make your page yours. Pick a name style, images, colors and a layout. Changes are visible on your public profile and next to your posts.</div>
        {notice && <div className={styles.notice}>{notice}</div>}

        <div className={styles.editorGrid}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarTitle}>MY PROFILE TOOLS</div>
            <div className={styles.sidebarBody}>
              <div className={styles.menu}>
                <a href="#identity">Profile identity</a>
                <a href="#about">About me</a>
                <a href="#pictures">Pictures</a>
                <a href="#style">Profile style</a>
                <a href="#preview">Preview</a>
              </div>
              <p className="muted">Tip: old-web profiles looked better when they were a little messy.</p>
              <div className={styles.preview} id="preview">
                <div className={styles.previewBanner}>{form.bannerUrl && mediaState.bannerStatus !== 'review' ? <img src={form.bannerUrl} alt="" /> : null}</div>
                <div className={styles.previewMain}>
                  {form.avatarUrl && mediaState.avatarStatus !== 'review' ? <img className={styles.previewAvatar} src={form.avatarUrl} alt="" /> : <div className={styles.previewAvatar}>?</div>}
                  <div>
                    <div className={styles.previewTitle} style={titleStyle}>{form.displayName || 'Anonymous'} <span className={styles.previewBadge}>{form.badge || 'Newbie'}</span></div>
                    <div className={styles.previewMeta}>#{form.anonId || '??????'} · profile preview</div>
                    {form.profileGifUrl && <img className={styles.previewGif} src={form.profileGifUrl} alt="Profile GIF" />}
                  </div>
                </div>
                {form.bio && <div className={styles.previewBio}>{form.bio}</div>}
              </div>
            </div>
          </aside>

          <form onSubmit={save}>
            <section className={styles.section} id="identity">
              <div className={styles.sectionTitle}>1. PROFILE IDENTITY</div>
              <div className={styles.sectionBody}>
                <div className={styles.row}><div className={styles.label}>Display name</div><div><input className={styles.input} name="displayName" value={form.displayName} onChange={change} maxLength={32} placeholder="Your board name" /></div></div>
                <div className={styles.row}><div className={styles.label}>Name color</div><div className={styles.swatches}>{nameColors.map(([value, label]) => <button type="button" key={value} className={`${styles.swatch} ${form.profileNameColor === value ? styles.swatchActive : ''}`} onClick={() => setForm({ ...form, profileNameColor: value })} style={{ color: value }}>{label}</button>)}</div></div>
                <div className={styles.row}><div className={styles.label}>Name style</div><div><select className={styles.select} name="profileNameStyle" value={form.profileNameStyle} onChange={change}><option value="normal">Normal</option><option value="bold">Bold</option><option value="italic">Italic</option><option value="bold-italic">Bold + italic</option></select></div></div>
              </div>
            </section>

            <section className={styles.section} id="about">
              <div className={styles.sectionTitle}>2. ABOUT ME / PERSONAL TEXT</div>
              <div className={styles.sectionBody}>
                <div className={styles.row}><div className={styles.label}>About me</div><div><textarea className={styles.textarea} name="bio" value={form.bio} onChange={change} maxLength={500} rows={7} placeholder="Write something for your profile..." /><div className={styles.help}>500 characters max. Plain text only.</div></div></div>
                <div className={styles.row}><div className={styles.label}>Signature</div><div><textarea className={styles.textarea} name="signature" value={form.signature} onChange={change} maxLength={160} rows={3} placeholder="The little thing that appears under your posts." /></div></div>
              </div>
            </section>

            <section className={styles.section} id="pictures">
              <div className={styles.sectionTitle}>3. PICTURES / MEDIA</div>
              <div className={styles.sectionBody}>
                <div className={styles.row}><div className={styles.label}>Avatar</div><div><input className={styles.input} name="avatarUrl" value={form.avatarUrl} onChange={change} maxLength={500} placeholder="https://..." />{form.avatarUrl && <img className={styles.previewImage} src={form.avatarUrl} alt="Avatar preview" />}{mediaState.avatarStatus === 'review' && <div className={styles.help}>[PENDING MODERATION] This image is not public yet.</div>}<div className={styles.help}>HTTPS image URL. New images may be checked before appearing publicly.</div></div></div>
                <div className={styles.row}><div className={styles.label}>Profile banner</div><div><input className={styles.input} name="bannerUrl" value={form.bannerUrl} onChange={change} maxLength={500} placeholder="https://..." />{form.bannerUrl && <img className={styles.previewImage} src={form.bannerUrl} alt="Banner preview" />}{mediaState.bannerStatus === 'review' && <div className={styles.help}>[PENDING MODERATION] This image is not public yet.</div>}<div className={styles.help}>Wide images work best. The banner is cropped to fit.</div></div></div>
                <div className={styles.row}><div className={styles.label}>Profile GIF</div><div><input className={styles.input} name="profileGifUrl" value={form.profileGifUrl} onChange={change} maxLength={500} placeholder="GIPHY URL" />{form.profileGifUrl && <img className={styles.previewImage} src={form.profileGifUrl} alt="Profile GIF preview" />}<div className={styles.help}>GIPHY only. A GIF can be part of your profile identity.</div></div></div>
              </div>
            </section>

            <section className={styles.section} id="style">
              <div className={styles.sectionTitle}>4. PAGE STYLE</div>
              <div className={styles.sectionBody}>
                <div className={styles.row}><div className={styles.label}>Theme</div><div><select className={styles.select} name="profileTheme" value={form.profileTheme} onChange={change}><option value="classic">Classic board</option><option value="blue">Blue board</option><option value="green">Old green</option><option value="gray">Gray terminal</option><option value="red">Red warning</option><option value="purple">Purple net</option></select></div></div>
                <div className={styles.row}><div className={styles.label}>Layout</div><div><select className={styles.select} name="profileLayout" value={form.profileLayout} onChange={change}><option value="compact">Compact</option><option value="profile">Profile first</option><option value="imageboard">Imageboard</option></select></div></div>
              </div>
            </section>

            <div className={styles.actions}><button className={styles.save} type="submit">{state === 'saving' ? 'Saving...' : 'Save my profile'}</button>{' '}<Link href={`/user/${form.anonId}`}>[View my profile]</Link></div>
          </form>
        </div>
      </div>
    </main>
  );
}
