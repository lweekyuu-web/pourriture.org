import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [target, setTarget] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  async function load() {
    const r = await fetch('/api/messages'); const d = await r.json().catch(() => ({}));
    if (r.ok) setMessages(d.messages || []); else setError(d.error || 'Unable to load messages.');
  }
  useEffect(() => { load(); }, []);
  async function send(e) {
    e.preventDefault(); setError(''); if (!target.trim() || !content.trim()) return;
    const r = await fetch('/api/messages', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ anonId: target, content }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setError(d.error || 'Unable to send.'); else { setContent(''); await load(); }
  }
  return <main className="container">
    <div className="topnav">[<Link href="/">Home</Link>] [<Link href="/profile/friends">Friends</Link>] [<Link href="/profile/edit">My profile</Link>]</div>
    <h1 className="sitetitle">MESSAGES</h1>
    {error && <p className="notification">{error}</p>}
    <div className="post"><b>New message</b><form onSubmit={send}><p><input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Anonymous ID" maxLength={20} /></p><textarea rows={5} value={content} onChange={e=>setContent(e.target.value)} maxLength={2000} style={{width:'100%'}} /><p><button>[ Send ]</button></p></form></div>
    {messages.length === 0 && <p className="muted">No messages yet.</p>}
    {messages.map(m => <div className="post" key={m.id}><b>{m.sender.anonId === m.meId ? 'To' : 'From'}: </b><Link href={`/user/${m.sender.anonId}`}>{m.sender.displayName || 'Anonymous'}</Link> <span className="muted">#{m.sender.anonId}</span><p style={{whiteSpace:'pre-wrap'}}>{m.content}</p><small>{new Date(m.createdAt).toLocaleString()}</small></div>)}
  </main>;
}
