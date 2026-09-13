import { useState } from 'react';
import Link from 'next/link';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) return { redirect: { destination: '/admin/login', permanent: false } };
  const boards = await prisma.board.findMany({ orderBy: { id: 'asc' } });
  return { props: { boards: JSON.parse(JSON.stringify(boards)) } };
}

export default function AdminBoards({ boards: initialBoards }) {
  const [boards, setBoards] = useState(initialBoards);
  const [form, setForm] = useState({ id: '', name: '', description: '', rules: '', status: 'public' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', rules: '', status: 'public', featured: false });

  async function createBoard(e) {
    e.preventDefault();
    const res = await fetch('/api/boards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const b = await res.json(); setBoards([...boards, b]); setForm({ id: '', name: '', description: '', rules: '', status: 'public' }); }
    else { const err = await res.json(); alert(err.error); }
  }

  async function updateBoard(e) {
    e.preventDefault();
    const slug = editing.id.replace(/\//g, '');
    const res = await fetch(`/api/boards/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    if (res.ok) {
      const updated = await res.json();
      setBoards(boards.map((b) => b.id === editing.id ? updated : (editForm.featured ? { ...b, featured: false } : b)));
      setEditing(null);
    }
  }

  function startEdit(board) { setEditing(board); setEditForm({ name: board.name, description: board.description, rules: board.rules || '', status: board.status, featured: board.featured }); }

  async function toggleStatus(board) {
    const newStatus = board.status === 'public' ? 'disabled' : 'public';
    const slug = board.id.replace(/\//g, '');
    const res = await fetch(`/api/boards/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: board.name, description: board.description, rules: board.rules, status: newStatus, featured: board.featured }) });
    if (res.ok) setBoards(boards.map((b) => b.id === board.id ? { ...b, status: newStatus } : b));
  }

  async function deleteBoard(board) {
    if (!confirm(`Delete ${board.id} and all its threads/posts?`)) return;
    const slug = board.id.replace(/\//g, '');
    const res = await fetch(`/api/boards/${slug}`, { method: 'DELETE' });
    if (res.ok) setBoards(boards.filter((b) => b.id !== board.id));
  }

  return <div className="container">
    <h1 className="sitetitle">Board Management</h1>
    <p>[<Link href="/admin">Back to dashboard</Link>] [<Link href="/admin/board-requests">Board Requests</Link>]</p>
    <table className="admin"><thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead><tbody>
      {boards.map((b) => <tr key={b.id}><td>{b.id}</td><td>{b.name}</td><td>{b.description}</td><td>{b.status}</td><td>{b.featured ? 'YES' : '—'}</td><td>
        <a href="#" onClick={(e) => { e.preventDefault(); startEdit(b); }}>[Edit]</a>{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); toggleStatus(b); }}>[Toggle status]</a>{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); deleteBoard(b); }}>[Delete]</a>
      </td></tr>)}
    </tbody></table>

    {editing && <div className="post"><h3>Edit {editing.id}</h3><form onSubmit={updateBoard}>
      <div>Name: <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
      <div>Description: <input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
      <div>Rules:<br /><textarea rows={4} cols={50} value={editForm.rules} onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })} /></div>
      <div>Status: <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="public">public</option><option value="private">private</option><option value="disabled">disabled</option></select></div>
      <div><label><input type="checkbox" checked={editForm.featured} onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })} /> Featured board on homepage</label></div>
      <button type="submit">Save</button> <button type="button" onClick={() => setEditing(null)}>Cancel</button>
    </form></div>}

    <h2>Create Board</h2><form onSubmit={createBoard} className="post">
      <div>Board ID (e.g. /tech/): <input type="text" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} /></div>
      <div>Name: <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div>Description: <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div>Rules: <input type="text" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></div>
      <div>Status: <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="public">public</option><option value="private">private</option><option value="disabled">disabled</option></select></div>
      <button type="submit">Create Board</button>
    </form>
  </div>;
}
