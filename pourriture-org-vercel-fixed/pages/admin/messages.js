import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  return { props: {} };
}

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [reply, setReply] = useState(null);
  const [content, setContent] = useState('');

  async function load() {
    const res = await fetch('/api/admin/messages');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setMessages(data.messages || []); else setError(data.error || 'Could not load messages.');
  }
  useEffect(() => { load(); }, []);

  async function markRead(id) {
    await fetch('/api/admin/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setMessages(list => list.map(m => m.id === id ? { ...m, readAt: new Date().toISOString() } : m));
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply || !content.trim()) return;
    const res = await fetch('/api/admin/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId: reply.sender.id, subject: `Re: ${reply.subject}`, content }) });
    if (res.ok) { setReply(null); setContent(''); await load(); }
  }

  return <div className="container">
    <h1 className="sitetitle">ADMIN MAILBOX</h1>
    <p>[<Link href="/admin"><a>Back to dashboard</a></Link>] [<a href="#" onClick={e => { e.preventDefault(); load(); }}>Refresh</a>]</p>
    {error && <p className="notification">{error}</p>}
    {messages.length === 0 && <p className="muted">No messages.</p>}
    {messages.map(m => <div className="post" key={m.id} style={{ marginBottom: 8, background: m.readAt ? undefined : '#fffde0' }}>
      <div><b>{m.subject}</b> {m.readAt ? '' : <b>[NEW]</b>}</div>
      <div className="muted">From: <Link href={`/user/${m.sender.anonId}`}><a>{m.sender.displayName || `User #${m.sender.anonId}`}</a></Link> #{m.sender.anonId} — {new Date(m.createdAt).toLocaleString()}</div>
      <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
      <p>[<a href="#" onClick={e => { e.preventDefault(); setReply(m); markRead(m.id); }}>Reply</a>] {!m.readAt && <a href="#" onClick={e => { e.preventDefault(); markRead(m.id); }}>[Mark read]</a>}</p>
    </div>)}
    {reply && <div className="post" style={{ position: 'fixed', left: '10%', right: '10%', top: '15%', zIndex: 20, boxShadow: '0 2px 10px #777' }}>
      <b>Reply to {reply.sender.displayName || `User #${reply.sender.anonId}`}</b>
      <form onSubmit={sendReply}><textarea rows={7} value={content} onChange={e => setContent(e.target.value)} maxLength={2000} style={{ width: '100%', marginTop: 8 }} />
      <p><button type="submit" disabled={!content.trim()}>[ Send ]</button>{' '}<button type="button" onClick={() => { setReply(null); setContent(''); }}>[ Cancel ]</button></p></form>
    </div>}
  </div>;
}
