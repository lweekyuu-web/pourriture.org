import Link from 'next/link';
import { useState } from 'react';

export default function RequestBoard() {
  const [form, setForm] = useState({ boardId: '/', name: '', description: '', rules: '', reason: '' });
  const [sent, setSent] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const res = await fetch('/api/board-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Request failed.');
    setSent(true);
  }
  return <div className="container">
    <h1 className="sitetitle">REQUEST A BOARD</h1>
    <p>[<Link href="/">Home</Link>]</p>
    {sent ? <div className="notification">Request received. An administrator will review it.</div> : <form className="post" onSubmit={submit}>
      <div>Board ID (e.g. /music/): <input type="text" value={form.boardId} onChange={(e) => setForm({ ...form, boardId: e.target.value })} required /></div>
      <div>Name: <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} required /></div>
      <div>Description:<br /><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} required /></div>
      <div>Rules (optional):<br /><textarea rows={3} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} maxLength={1000} /></div>
      <div>Why should this board exist?<br /><textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={1000} /></div>
      <button type="submit">Submit request</button>
    </form>}
  </div>;
}
