import { useState } from 'react';
import prisma from '../../lib/prisma';
import { isAdminRequest } from '../../lib/admin';

const SLOTS = ['home_top', 'home_bottom', 'board_top', 'thread_top', 'thread_bottom'];

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const widgets = await prisma.widget.findMany({ orderBy: [{ slot: 'asc' }, { order: 'asc' }] });
  return { props: { widgets: JSON.parse(JSON.stringify(widgets)) } };
}

const empty = { slot: 'home_top', type: 'banner', imageUrl: '', linkUrl: '', altText: '', htmlContent: '', order: 0, active: true };

export default function AdminWidgets({ widgets: initial }) {
  const [widgets, setWidgets] = useState(initial);
  const [form, setForm] = useState(empty);

  async function create(e) {
    e.preventDefault();
    const res = await fetch('/api/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const w = await res.json();
      setWidgets([...widgets, w]);
      setForm(empty);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function toggleActive(w) {
    const res = await fetch(`/api/widgets/${w.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...w, active: !w.active }),
    });
    if (res.ok) setWidgets(widgets.map((x) => (x.id === w.id ? { ...x, active: !x.active } : x)));
  }

  async function remove(w) {
    if (!confirm(`Delete this widget (slot ${w.slot})?`)) return;
    const res = await fetch(`/api/widgets/${w.id}`, { method: 'DELETE' });
    if (res.ok) setWidgets(widgets.filter((x) => x.id !== w.id));
  }

  return (
    <div className="container">
      <h1 className="sitetitle">Widgets / Ads Management</h1>
      <p style={{ fontSize: 12, color: '#555' }}>
        Emplacements disponibles : {SLOTS.join(', ')}. Type "banner" = image cliquable (URL externe), tracké en vues/clics.
        Type "html" = bloc HTML libre, non tracké.
      </p>

      <table className="admin">
        <thead>
          <tr><th>Slot</th><th>Type</th><th>Preview</th><th>Views</th><th>Clicks</th><th>Active</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {widgets.map((w) => (
            <tr key={w.id}>
              <td>{w.slot}</td>
              <td>{w.type}</td>
              <td>{w.type === 'banner' ? (w.altText || w.imageUrl) : 'html snippet'}</td>
              <td>{w.impressions}</td>
              <td>{w.clicks}</td>
              <td>{w.active ? 'yes' : 'no'}</td>
              <td>
                <a href="#" onClick={() => toggleActive(w)}>[Toggle]</a>{' '}
                <a href="#" onClick={() => remove(w)}>[Delete]</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>New Widget</h2>
      <form onSubmit={create} className="post">
        <div>Slot:
          <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>Type:
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="banner">banner (image + lien)</option>
            <option value="html">html (bloc libre)</option>
          </select>
        </div>

        {form.type === 'banner' ? (
          <>
            <div>Image URL: <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={{ width: 300 }} /></div>
            <div>Link URL: <input type="text" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} style={{ width: 300 }} /></div>
            <div>Alt text: <input type="text" value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} /></div>
          </>
        ) : (
          <div>HTML content:<br />
            <textarea rows={5} cols={60} value={form.htmlContent} onChange={(e) => setForm({ ...form, htmlContent: e.target.value })} />
          </div>
        )}

        <div>Order: <input type="text" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} size={4} /></div>
        <button type="submit">Create Widget</button>
      </form>
    </div>
  );
}
