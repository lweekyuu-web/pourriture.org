import { useState } from 'react';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const boards = await prisma.board.findMany({ orderBy: { id: 'asc' } });
  return { props: { boards: JSON.parse(JSON.stringify(boards)) } };
}

export default function AdminBoards({ boards: initialBoards }) {
  const [boards, setBoards] = useState(initialBoards);
  const [form, setForm] = useState({ id: '', name: '', description: '', rules: '', status: 'public' });

  async function createBoard(e) {
    e.preventDefault();
    const res = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const b = await res.json();
      setBoards([...boards, b]);
      setForm({ id: '', name: '', description: '', rules: '', status: 'public' });
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function toggleStatus(board) {
    const newStatus = board.status === 'public' ? 'disabled' : 'public';
    const res = await fetch(`/api/boards/${board.id.replace(/\//g, '')}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...board, status: newStatus }),
    });
    if (res.ok) {
      setBoards(boards.map((b) => (b.id === board.id ? { ...b, status: newStatus } : b)));
    }
  }

  async function deleteBoard(board) {
    if (!confirm(`Delete ${board.id} and all its threads/posts?`)) return;
    const res = await fetch(`/api/boards/${board.id.replace(/\//g, '')}`, { method: 'DELETE' });
    if (res.ok) setBoards(boards.filter((b) => b.id !== board.id));
  }

  return (
    <div className="container">
      <h1 className="sitetitle">Board Management</h1>

      <table className="admin">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {boards.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.name}</td>
              <td>{b.status}</td>
              <td>
                <a href="#" onClick={() => toggleStatus(b)}>[Toggle status]</a>{' '}
                <a href="#" onClick={() => deleteBoard(b)}>[Delete]</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Create Board</h2>
      <form onSubmit={createBoard} className="post">
        <div>Board ID (e.g. /tech/): <input type="text" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} /></div>
        <div>Name: <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div>Description: <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>Rules: <input type="text" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></div>
        <div>Status:
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="public">public</option>
            <option value="private">private</option>
            <option value="disabled">disabled</option>
          </select>
        </div>
        <button type="submit">Create Board</button>
      </form>
    </div>
  );
}
