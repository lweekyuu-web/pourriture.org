import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function FriendsPage() {
  const [items, setItems] = useState([]); const [anonId, setAnonId] = useState(''); const [message, setMessage] = useState('');
  async function load() { const r=await fetch('/api/friends'); const d=await r.json().catch(()=>({})); if(r.ok){setItems(d.friends||[]);setMessage('')}else setMessage(d.error||'Unable to load.'); }
  useEffect(()=>{load()},[]);
  async function action(name,id){ const r=await fetch('/api/friends',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:name,anonId:id})}); const d=await r.json().catch(()=>({})); setMessage(r.ok?'Updated.':(d.error||'Unable to update.')); if(r.ok)load(); }
  async function add(e){e.preventDefault(); if(!anonId.trim())return; await action('request',anonId.trim());setAnonId('');}
  const incoming=items.filter(x=>x.status==='pending'&&x.incoming), outgoing=items.filter(x=>x.status==='pending'&&!x.incoming), friends=items.filter(x=>x.status==='accepted');
  return <main className="container">
    <div className="topnav">[<Link href="/">Home</Link>] [<Link href="/messages">Messages</Link>] [<Link href="/profile/edit">My profile</Link>]</div>
    <h1 className="sitetitle">FRIENDS</h1>
    {message&&<p className="notification">{message}</p>}
    <div className="post"><b>ADD SOMEONE</b><form onSubmit={add}><p>Anonymous ID: <input value={anonId} onChange={e=>setAnonId(e.target.value)} placeholder="e.g. A4F92C" maxLength={20}/> <button type="submit">[ Send friend request ]</button></p></form><div className="muted">You can also use [ Add as friend ] directly from someone's profile.</div></div>
    <div className="post"><b>FRIEND REQUESTS {incoming.length>0&&`(${incoming.length})`}</b>{incoming.length===0?<p className="muted">No incoming requests.</p>:incoming.map(f=><p key={f.id}><Link href={`/user/${f.user.anonId}`}><b>{f.user.displayName||'Anonymous'}</b></Link> <span className="muted">#{f.user.anonId}</span> <button onClick={()=>action('accept',f.user.anonId)}>[ Accept ]</button> <button onClick={()=>action('reject',f.user.anonId)}>[ Reject ]</button></p>)}</div>
    <div className="post"><b>SENT REQUESTS</b>{outgoing.length===0?<p className="muted">No pending requests.</p>:outgoing.map(f=><p key={f.id}><Link href={`/user/${f.user.anonId}`}>{f.user.displayName||'Anonymous'}</Link> <span className="muted">#{f.user.anonId}</span> — waiting</p>)}</div>
    <div className="post"><b>MY FRIENDS</b>{friends.length===0?<p className="muted">No friends yet.</p>:friends.map(f=><p key={f.id}><Link href={`/user/${f.user.anonId}`}><b>{f.user.displayName||'Anonymous'}</b></Link> <span className="muted">#{f.user.anonId}</span> {f.topFriend&&<b>★ TOP FRIEND</b>} {' '}<button onClick={()=>action('top',f.user.anonId)}>[ {f.topFriend?'Remove star':'Top friend'} ]</button> <Link href={`/messages?to=${encodeURIComponent(f.user.anonId)}`}>[ Chat ]</Link> <button onClick={()=>action('remove',f.user.anonId)}>[ Remove ]</button></p>)}</div>
  </main>;
}
