import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EditProfile() {
  const [form, setForm] = useState({ displayName: '', bio: '', signature: '', avatarUrl: '', bannerUrl: '', profileTheme: 'classic', profileLayout: 'compact', profileGifUrl: '' });
  const [state, setState] = useState('loading');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Not signed in')))
      .then((data) => { setForm({ ...form, ...data }); setState('ready'); })
      .catch(() => setState('error'));
  }, []);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function save(e) {
    e.preventDefault();
    setState('saving');
    const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setState(r.ok ? 'saved' : 'error');
  }

  if (state === 'loading') return <main className="container"><p>Loading profile editor...</p></main>;
  if (state === 'error') return <main className="container"><p className="notification">Unable to load your profile. Make sure your site identity cookie is active.</p><Link href="/">[Return]</Link></main>;

  return (
    <main className="container profile-editor">
      <div className="topnav">[<Link href="/">Home</Link>] [<Link href={`/user/${form.anonId}`}>My profile</Link>]</div>
      <h1 className="sitetitle">EDIT PROFILE</h1>
      <p className="muted">Old-web profile customization. No HTML, JavaScript, or arbitrary file uploads are accepted.</p>
      {state === 'saved' && <p className="notification">Profile saved.</p>}
      <form onSubmit={save}>
        <table className="admin profile-form"><tbody>
          <tr><th>Display name</th><td><input name="displayName" value={form.displayName} onChange={change} maxLength={32} /></td></tr>
          <tr><th>Bio</th><td><textarea name="bio" value={form.bio} onChange={change} maxLength={500} rows={5} /></td></tr>
          <tr><th>Signature</th><td><textarea name="signature" value={form.signature} onChange={change} maxLength={160} rows={3} /></td></tr>
          <tr><th>Avatar URL</th><td><input name="avatarUrl" value={form.avatarUrl} onChange={change} maxLength={500} placeholder="https://..." /><div className="muted">HTTPS image URL only.</div></td></tr>
          <tr><th>Banner URL</th><td><input name="bannerUrl" value={form.bannerUrl} onChange={change} maxLength={500} placeholder="https://..." /><div className="muted">HTTPS image URL only.</div></td></tr>
          <tr><th>Profile GIF</th><td><input name="profileGifUrl" value={form.profileGifUrl} onChange={change} maxLength={500} placeholder="GIPHY URL" /><div className="muted">GIPHY only. The normal post GIF picker can be used when available.</div></td></tr>
          <tr><th>Theme</th><td><select name="profileTheme" value={form.profileTheme} onChange={change}><option value="classic">Classic</option><option value="blue">Blue board</option><option value="green">Old green</option><option value="gray">Gray terminal</option></select></td></tr>
          <tr><th>Layout</th><td><select name="profileLayout" value={form.profileLayout} onChange={change}><option value="compact">Compact</option><option value="profile">Profile first</option></select></td></tr>
        </tbody></table>
        <p><button type="submit">Save profile</button> {state === 'saving' && <span className="muted">Saving...</span>}</p>
      </form>
    </main>
  );
}
