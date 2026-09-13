import { useState } from 'react';
import Link from 'next/link';

export default function ContactAdmin() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setNotice('');
    const res = await fetch('/api/contact-admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setNotice(data.error || 'Message could not be sent.');
    setSubject(''); setContent(''); setNotice('Message sent to the site administrator.');
  }

  return <div className="container">
    <h1 className="sitetitle">CONTACT ADMIN</h1>
    <p>[<Link href="/"><a>Home</a></Link>] [<Link href="/recover"><a>Recover identity</a></Link>]</p>
    <div className="post">
      <p><b>Private message to the site administrator</b></p>
      <p className="muted">Only you and the site administrator can access this message.</p>
      <form onSubmit={submit}>
        <div><label>Subject<br/><input value={subject} onChange={e => setSubject(e.target.value)} maxLength={100} /></label></div>
        <div style={{ marginTop: 8 }}><label>Message<br/><textarea value={content} onChange={e => setContent(e.target.value)} maxLength={2000} rows={9} style={{ width: 'min(650px, 100%)' }} /></label></div>
        <p><button type="submit" disabled={busy || !content.trim()}>{busy ? 'Sending...' : '[ Send message ]'}</button></p>
      </form>
      {notice && <p className="notification">{notice}</p>}
    </div>
  </div>;
}
