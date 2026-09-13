import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

function displayName(user) { return user?.displayName?.trim() || 'Anonymous'; }
function shortTime(value) { return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

export default function Messages() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [target, setTarget] = useState('');
  const [content, setContent] = useState('');
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/messages');
    const d = await r.json().catch(() => ({}));
    if (r.ok) setMessages(d.messages || []);
    else setError(d.error || 'Unable to load messages.');
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (router.query.to) {
      const id = String(router.query.to);
      setTarget(id);
      setSelected(id);
    }
  }, [router.query.to]);

  const conversations = useMemo(() => {
    const map = {};
    for (const m of messages) {
      const other = m.other;
      if (!other?.anonId) continue;
      if (!map[other.anonId]) map[other.anonId] = { id: other.anonId, user: other, messages: [] };
      map[other.anonId].messages.push(m);
    }
    return Object.values(map).sort((a, b) => {
      const aa = a.messages[a.messages.length - 1]?.createdAt || '';
      const bb = b.messages[b.messages.length - 1]?.createdAt || '';
      return new Date(bb) - new Date(aa);
    });
  }, [messages]);

  const active = conversations.find(c => c.id === selected) || null;

  async function send(e) {
    e.preventDefault();
    const id = target.trim();
    if (!id || !content.trim()) return;
    setError('');
    const r = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonId: id, content }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setError(d.error || 'Unable to send.');
    else {
      setContent('');
      setSelected(id);
      await load();
    }
  }

  return <main className="container">
    <div className="topnav">[<Link href="/">Home</Link>] [<Link href="/profile/friends">Friends</Link>] [<Link href="/profile/edit">My profile</Link>]</div>

    <div style={{ border: '1px solid #7b9ebd', background: '#fff', boxShadow: 'inset 0 0 0 1px #e8f1f8', marginTop: 12 }}>
      <div style={{ background: 'linear-gradient(#5d94c5,#2f6fa7)', color: '#fff', padding: '5px 8px', fontWeight: 'bold', fontSize: 12 }}>
        POURRITURE.ORG — INBOX / CHAT
        <span style={{ float: 'right', fontWeight: 'normal' }}>[ <Link style={{ color: '#fff' }} href="/profile/friends">friends</Link> ]</span>
      </div>

      {error && <div className="notification">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '210px minmax(0,1fr)', minHeight: 480 }}>
        <aside style={{ background: '#edf3f8', borderRight: '1px solid #a9bfd2', padding: 7 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 5 }}>CONTACTS</div>
          <div style={{ border: '1px solid #b5c7d6', background: '#fff', padding: 5, marginBottom: 8 }}>
            <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Anonymous ID" maxLength={20} style={{ width: '100%', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => { setSelected(target.trim()); }} style={{ marginTop: 4 }}>[ Open chat ]</button>
          </div>
          {conversations.length === 0 ? <div className="muted" style={{ fontSize: 11 }}>No conversations yet.<br />Add a friend and start a chat.</div> : conversations.map(c => {
            const last = c.messages[c.messages.length - 1];
            return <button key={c.id} type="button" onClick={() => { setSelected(c.id); setTarget(c.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: '0', borderBottom: '1px solid #ccd8e2', background: selected === c.id ? '#dcecf9' : 'transparent', padding: '6px 4px', cursor: 'pointer' }}>
              <b style={{ color: '#003399' }}>{displayName(c.user)}</b><br />
              <span className="muted" style={{ fontSize: 10 }}>#{c.id} · {last ? shortTime(last.createdAt) : ''}</span>
            </button>;
          })}
        </aside>

        <section style={{ background: '#fff' }}>
          <div style={{ borderBottom: '1px solid #ccd6df', background: '#f5f7f9', padding: '6px 9px', fontSize: 12 }}>
            {active ? <><b>{displayName(active.user)}</b> <span className="muted">#{active.id}</span> <span style={{ float: 'right' }}><Link href={`/user/${active.id}`}>View profile</Link></span></> : <span className="muted">Select a conversation</span>}
          </div>

          <div style={{ minHeight: 330, maxHeight: 520, overflowY: 'auto', padding: 10, background: '#fff' }}>
            {loading ? <p className="muted">Loading...</p> : !active ? <p className="muted">Choose someone from the left, or enter an Anonymous ID above.</p> : active.messages.map(m => {
              const mine = m.senderId === m.meId;
              return <div key={m.id} style={{ marginBottom: 10, maxWidth: '85%' }}>
                <div style={{ fontSize: 10, color: '#777' }}><b>{mine ? 'You' : displayName(m.sender)}</b> — {new Date(m.createdAt).toLocaleString()}</div>
                <div style={{ marginTop: 2, padding: '6px 8px', border: '1px solid #c5d2dd', background: mine ? '#eef6ff' : '#f7f7f7', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</div>
              </div>;
            })}
          </div>

          <form onSubmit={send} style={{ borderTop: '1px solid #b9c8d4', background: '#edf3f8', padding: 8 }}>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 3 }}>WRITE A MESSAGE</div>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} maxLength={2000} placeholder="Type something..." style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
            <div style={{ marginTop: 5 }}><button type="submit">[ Send message ]</button> <button type="button" onClick={() => setContent('')}>[ Clear ]</button></div>
          </form>
        </section>
      </div>
    </div>
  </main>;
}
