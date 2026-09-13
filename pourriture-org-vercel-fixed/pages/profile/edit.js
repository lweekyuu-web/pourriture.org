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

  if (state === 'loading') return <main className="container"><p>Loading profile...</p></main>;
  if (state === 'error' && !form.anonId) return <main className="container"><p className="notification">Unable to load your profile. Make sure your site identity cookie is active.</p><Link href="/">[Return]</Link></main>;

  const titleStyle = { color: form.profileNameColor, fontWeight: form.profileNameStyle.includes('bold') ? 'bold' : 'normal', fontStyle: form.profileNameStyle.includes('italic') ? 'italic' : 'normal' };

  return (
    <main className={`container profile-theme-${form.profileTheme || 'classic'}`}>
      <div className={styles.editorShell}>
        <div className={styles.pageHead}>
          <h1 className="sitetitle">MY PROFILE</h1>
          <span className={styles.headLinks}><Link href={`/user/${form.anonId}`}>View profile</Link> | <Link href="/">Home</Link></span>
        </div>
        {notice && <div className={styles.notice}>{notice}</div>}

        <div className={styles.profileWindow}>
          <div className={styles.windowTitle}>EDIT PROFILE</div>
          <form onSubmit={save}>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>PROFILE</div>
              <div className={styles.sectionBody}>
                <div className={styles.row}><div className={styles.label}>Name</div><div><input className={styles.input} name="displayName" value={form.displayName} onChange={change} maxLength={32} placeholder="Anonymous" /></div></div>
                <div className={styles.row}><div className={styles.label}>Name color</div><div className={styles.swatches}>{nameColors.map(([value, label]) => <button type="button" key={value} aria-label={label} title={label} className={`${styles.swatch} ${form.profileNameColor === value ? styles.swatchActive : ''}`} onClick={() => setForm({ ...form, profileNameColor: value })} style={{ color: value }}>{label}</button>)}</div></div>
                <div className={styles.row}><div className={styles.label}>Text style</div><div><select className={styles.select} name="profileNameStyle" value={form.profileNameStyle} onChange={change}><option value="normal">Normal</option><option value="bold">Bold</option><option value="italic">Italic</option><option value="bold-italic">Bold + italic</option></select></div></div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>ABOUT ME</div>
              <div className={styles.sectionBody}>
                <div className={styles.row}><div className={styles.label}>Who am I?</div><div><textarea className={styles.textarea} name="bio" value={form.bio} onChange={change} maxLength={500} rows={7} placeholder="Write about yourself..." /><div className={styles.help}>500 characters max. Plain text.</div></div></div>
                <div className={styles.row}><div className={styles.label}>Signature</div><div><textarea className={styles.textarea} name="signature" value={form.signature} onChange={change} maxLength={160} rows={3} placeholder="Your little line under posts..." /></div></div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>PICTURES</div>
              <div className={styles.sectionBody}>
                <div className={styles.mediaRow}>
                  <div className={styles.mediaBox}><b>Avatar</b><input className={styles.input} name="avatarUrl" value={form.avatarUrl} onChange={change} maxLength={500} placeholder="https://..." />{form.avatarUrl && <img className={styles.avatarPreview} src={form.avatarUrl} alt="Avatar preview" />}{mediaState.avatarStatus === 'review' && <div className={styles.help}>Pending moderation.</div>}</div>
                  <div className={styles.mediaBox}><b>Banner</b><input className={styles.input} name="bannerUrl" value={form.bannerUrl} onChange={change} maxLength={500} placeholder="https://..." />{form.bannerUrl && <img className={styles.bannerPreview} src={form.bannerUrl} alt="Banner preview" />}{mediaState.bannerStatus === 'review' && <div className={styles.help}>Pending moderation.</div>}</div>
                </div>
                <div className={styles.row}><div className={styles.label}>Profile GIF</div><div><input className={styles.input} name="profileGifUrl" value={form.profileGifUrl} onChange={change} maxLength={500} placeholder="GIPHY URL" />{form.profileGifUrl && <img className={styles.previewImage} src={form.profileGifUrl} alt="Profile GIF preview" />}<div className={styles.help}>GIPHY only.</div></div></div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>PAGE DESIGN</div>
              <div className={styles.sectionBody}>
                <div className={styles.designGrid}>
                  <label>Theme<select className={styles.select} name="profileTheme" value={form.profileTheme} onChange={change}><option value="classic">Classic board</option><option value="blue">Blue board</option><option value="green">Old green</option><option value="gray">Gray terminal</option><option value="red">Red warning</option><option value="purple">Purple net</option></select></label>
                  <label>Layout<select className={styles.select} name="profileLayout" value={form.profileLayout} onChange={change}><option value="compact">Compact</option><option value="profile">Profile first</option><option value="imageboard">Imageboard</option></select></label>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>LIVE PREVIEW</div>
              <div className={styles.sectionBody}>
                <div className={styles.preview}>
                  <div className={styles.previewBanner}>{form.bannerUrl && mediaState.bannerStatus !== 'review' ? <img src={form.bannerUrl} alt="" /> : <span>No banner</span>}</div>
                  <div className={styles.previewMain}>
                    {form.avatarUrl && mediaState.avatarStatus !== 'review' ? <img className={styles.previewAvatar} src={form.avatarUrl} alt="" /> : <div className={styles.previewAvatar}>?</div>}
                    <div className={styles.previewInfo}>
                      <div className={styles.previewTitle} style={titleStyle}>{form.displayName || 'Anonymous'} <span className={styles.previewBadge}>{form.badge || 'Newbie'}</span></div>
                      <div className={styles.previewMeta}>User #{form.anonId || '??????'} · member</div>
                      {form.bio && <div className={styles.previewBio}>{form.bio}</div>}
                      {form.signature && <div className={styles.previewSignature}>{form.signature}</div>}
                    </div>
                  </div>
                  {form.profileGifUrl && <img className={styles.previewGif} src={form.profileGifUrl} alt="Profile GIF" />}
                </div>
              </div>
            </section>

            <div className={styles.actions}><button className={styles.save} type="submit">{state === 'saving' ? 'Saving...' : 'Save profile'}</button> <Link href={`/user/${form.anonId}`}>Cancel</Link></div>
          </form>
        </div>
      </div>
    </main>
  );
}
