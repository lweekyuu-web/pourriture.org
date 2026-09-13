import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function FriendsPage() {
  const [items, setItems] = useState([]);
  const [anonId, setAnonId] = useState('');
  const [message, setMessage] = useState('Loading...');

  async function load() {
    const r = await fetch('/api/friends');
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setMessage(data.error || 'Unable to load friends.'); return; }
    setItems(data.friends || []); setMessage('');
  }
  useEffect(() => { load(); }, []);

  async function action(name, id) {
    const r = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name, anonId: id }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) setMessage(data.error || 'Unable to update.'); else { setMessage('Updated.'); load(); }
  }

  async function add(e) {
    e.preventDefault();
    if (!anonId.trim()) return;
    await action('request', anonId.trim());
    setAnonId('');
  }

  return <main className="container">
    <div className="topnav">[<Link href="/">Home</Link>] [<Link href="/profile/edit">My profile</Link>]</div>
    <h1 className="sitetitle">FRIENDS</h1>
    <div className="post">
      <form onSubmit={add}><b>Add a friend</b> <input value={anonId} onChange={(e) => setAnonId(e.target.value)} placeholder="Anonymous ID" maxLength={20} /> <button type="submit">[ Add ]</button></form>
      <div className="muted">Friend requests use the site's anonymous ID. You can remove someone later.</div>
    </div>
    {message && <p className="notification">{message}</p>}
    <div className="post"><b>Friend list</b></div>
    {items.length === 0 && <p className="muted">No friends or requests.</p>}
    {items.map((f) => <div className="post friend-row" key={f.id}>
      <div><Link href={`/user/${f.user.anonId}`}><b>{f.user.displayName || 'Anonymous'}</b></Link> <span className="muted">#{f.user.anonId}</span> {f.topFriend && <b title="Top friend">★ TOP FRIEND</b>}</div>
      <div className="friend-actions">
        {f.status === 'pending' && f.incoming && <><button type="button" onClick={() => action('accept', f.user.anonId)}>[ Accept ]</button> <button type="button" onClick={() => action('reject', f.user.anonId)}>[ Reject ]</button></>}
        {f.status === 'pending' && !f.incoming && <span className="muted">Request pending</span>}
        {f.status === 'accepted' && <><button type="button" onClick={() => action('top', f.user.anonId)}>[ {f.topFriend ? 'Remove top friend' : 'Make top friend'} ]</button> <button type="button" onClick={() => action('remove', f.user.anonId)}>[ Remove ]</button></>}
      </div>
    </div>)}
  </main>;
}
