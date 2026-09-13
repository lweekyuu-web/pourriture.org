import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EditProfile() {
  const [form, setForm] = useState({ displayName: '', bio: '', signature: '', avatarUrl: '', bannerUrl: '', profileTheme: 'classic', profileLayout: 'compact', profileGifUrl: '' });
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
    setState('saving');
    setNotice('');
    const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      setMediaState({ avatarStatus: data.avatarStatus || 'approved', bannerStatus: data.bannerStatus || 'approved' });
      setNotice(data.notice || 'Profile saved.');
      setState('saved');
    } else {
      setNotice(data.error || 'Unable to save profile.');
      setState('error');
    }
  }

  if (state === 'loading') return <main className="container"><p>Loading profile editor...</p></main>;
  if (state === 'error' && !form.anonId) return <main className="container"><p className="notification">Unable to load your profile. Make sure your site identity cookie is active.</p><Link href="/">[Return]</Link></main>;

  return (
    <main className={`container profile-editor profile-theme-${form.profileTheme || 'classic'}`}>
      <div className="topnav">[<Link href="/">Home</Link>] [<Link href={`/user/${form.anonId}`}>My profile</Link>]</div>
      <h1 className="sitetitle">EDIT PROFILE</h1>
      <p className="muted">Customize your little corner of the board. Keep it weird, readable, and old-web.</p>
      {notice && <p className="notification">{notice}</p>}
      <form onSubmit={save}>
        <table className="admin profile-form"><tbody>
          <tr><th>Display name</th><td><input name="displayName" value={form.displayName} onChange={change} maxLength={32} /></td></tr>
          <tr><th>Bio</th><td><textarea name="bio" value={form.bio} onChange={change} maxLength={500} rows={5} /></td></tr>
          <tr><th>Signature</th><td><textarea name="signature" value={form.signature} onChange={change} maxLength={160} rows={3} /></td></tr>
          <tr><th>Avatar image</th><td><input name="avatarUrl" value={form.avatarUrl} onChange={change} maxLength={500} placeholder="https://..." /><div className="muted">HTTPS image URL. New images are hidden from public profiles until the moderation gate clears them.</div>{form.avatarUrl && <img className="profile-editor-preview" src={form.avatarUrl} alt="Avatar preview" />}{mediaState.avatarStatus === 'review' && <div className="review-note">[PENDING MODERATION] Other users cannot see this image yet.</div>}</td></tr>
          <tr><th>Banner image</th><td><input name="bannerUrl" value={form.bannerUrl} onChange={change} maxLength={500} placeholder="https://..." /><div className="muted">HTTPS image URL. New images are checked before public display.</div>{form.bannerUrl && <img className="profile-editor-banner-preview" src={form.bannerUrl} alt="Banner preview" />}{mediaState.bannerStatus === 'review' && <div className="review-note">[PENDING MODERATION] Other users cannot see this image yet.</div>}</td></tr>
          <tr><th>Profile GIF</th><td><input name="profileGifUrl" value={form.profileGifUrl} onChange={change} maxLength={500} placeholder="GIPHY URL" /><div className="muted">GIPHY only. Post GIFs still use the site moderation queue.</div></td></tr>
          <tr><th>Theme</th><td><select name="profileTheme" value={form.profileTheme} onChange={change}><option value="classic">Classic board</option><option value="blue">Blue board</option><option value="green">Old green</option><option value="gray">Gray terminal</option><option value="red">Red warning</option><option value="purple">Purple net</option></select></td></tr>
          <tr><th>Layout</th><td><select name="profileLayout" value={form.profileLayout} onChange={change}><option value="compact">Compact</option><option value="profile">Profile first</option><option value="imageboard">Imageboard</option></select></td></tr>
        </tbody></table>
        <p><button type="submit">Save profile</button> {state === 'saving' && <span className="muted">Saving...</span>}</p>
      </form>
    </main>
  );
}
