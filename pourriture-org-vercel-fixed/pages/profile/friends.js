import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function FriendsPage() {
  const [items, setItems] = useState([]);
  const [anonId, setAnonId] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');

  async function load() {
    const r = await fetch('/api/friends');
    const d = await r.json().catch(() => ({}));
    if (r.ok) setItems(d.friends || []); else setMessage(d.error || 'Unable to load.');
  }
  useEffect(() => { load(); }, []);

  async function action(name, id) {
    const r = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name, anonId: id }) });
    const d = await r.json().catch(() => ({}));
    setMessage(r.ok ? 'Updated.' : (d.error || 'Unable to update.'));
    if (r.ok) load();
  }
  async function add(e) { e.preventDefault(); if (!anonId.trim()) return; await action('request', anonId.trim()); setAnonId(''); }

  const incoming = items.filter(x => x.status === 'pending' && x.incoming);
  const outgoing = items.filter(x => x.status === 'pending' && !x.incoming);
  const friends = items.filter(x => x.status === 'accepted');
  const shownFriends = useMemo(() => friends.filter(f => {
    const q = filter.toLowerCase().trim();
    return !q || `${f.user?.displayName || 'Anonymous'} ${f.user?.anonId || ''}`.toLowerCase().includes(q);
  }), [friends, filter]);

  return <main className="container">
    <div className="topnav">[<Link href="/">Home</Link>] [<Link href="/messages">Inbox</Link>] [<Link href="/profile/edit">My profile</Link>]</div>

    <div style={{ border: '1px solid #7b9ebd', background: '#fff', marginTop: 12, boxShadow: 'inset 0 0 0 1px #e8f1f8' }}>
      <div style={{ background: 'linear-gradient(#5d94c5,#2f6fa7)', color: '#fff', padding: '5px 8px', fontWeight: 'bold', fontSize: 12 }}>FRIENDS / CONTACTS</div>
      <div style={{ padding: 9 }}>
        {message && <div className="notification">{message}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 10 }}>
          <section>
            <div style={{ borderBottom: '1px solid #9bb3c8', background: '#edf3f8', padding: '4px 6px', fontWeight: 'bold', color: '#234f78' }}>MY FRIENDS ({friends.length})</div>
            <div style={{ padding: 6 }}><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Find a friend..." style={{ width: '100%', boxSizing: 'border-box' }} /></div>
            {shownFriends.length === 0 ? <p className="muted">No friends found.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 6 }}>
              {shownFriends.map(f => <div key={f.id} style={{ border: '1px solid #c0cfdb', background: '#fafafa', padding: 6, minHeight: 72 }}>
                <b><Link href={`/user/${f.user.anonId}`}>{f.user.displayName || 'Anonymous'}</Link></b><br />
                <span className="muted">#{f.user.anonId}</span>{f.topFriend && <span style={{ color: '#b08000', marginLeft: 4 }}>★</span>}
                <div style={{ marginTop: 7, fontSize: 11 }}><Link href={`/messages?to=${encodeURIComponent(f.user.anonId)}`}>[ message ]</Link> {' '}<button onClick={() => action('top', f.user.anonId)}>[ {f.topFriend ? 'unstar' : 'top friend'} ]</button></div>
              </div>)}
            </div>}
          </section>

          <aside>
            <div style={{ border: '1px solid #c0cfdb', background: '#f4f7fa', padding: 7, marginBottom: 8 }}>
              <b>ADD A FRIEND</b>
              <form onSubmit={add} style={{ marginTop: 5 }}>
                <input value={anonId} onChange={e => setAnonId(e.target.value)} placeholder="Anonymous ID" maxLength={20} style={{ width: '100%', boxSizing: 'border-box' }} />
                <button type="submit" style={{ marginTop: 4 }}>[ Add friend ]</button>
              </form>
              <div className="muted" style={{ marginTop: 5, fontSize: 10 }}>You can also use the friend link on any profile.</div>
            </div>
            <div style={{ border: '1px solid #c0cfdb', background: '#fff', padding: 7 }}>
              <b>FRIEND REQUESTS {incoming.length ? `(${incoming.length})` : ''}</b>
              {incoming.length === 0 ? <p className="muted" style={{ fontSize: 11 }}>No new requests.</p> : incoming.map(f => <div key={f.id} style={{ borderTop: '1px solid #ddd', paddingTop: 5, marginTop: 5 }}><Link href={`/user/${f.user.anonId}`}><b>{f.user.displayName || 'Anonymous'}</b></Link><br /><span className="muted">#{f.user.anonId}</span><div><button onClick={() => action('accept', f.user.anonId)}>[ accept ]</button> <button onClick={() => action('reject', f.user.anonId)}>[ reject ]</button></div></div>)}
            </div>
          </aside>
        </div>

        <div style={{ borderTop: '1px solid #c5d2dd', marginTop: 12, paddingTop: 7, fontSize: 11 }}>
          <b>SENT REQUESTS:</b> {outgoing.length ? outgoing.map(f => <span key={f.id} style={{ marginRight: 10 }}><Link href={`/user/${f.user.anonId}`}>{f.user.displayName || 'Anonymous'}</Link> <span className="muted">(waiting)</span></span>) : <span className="muted">none</span>}
        </div>
      </div>
    </div>
  </main>;
}
