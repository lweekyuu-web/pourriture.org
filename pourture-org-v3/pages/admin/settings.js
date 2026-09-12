import { useState } from 'react';
import { isAdminRequest } from '../../lib/admin';
import { getAllSettings } from '../../lib/settings';

export async function getServerSideProps({ req }) {
  if (!isAdminRequest(req)) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  const settings = await getAllSettings();
  return { props: { settings } };
}

const FIELDS = [
  { key: 'site_title', label: 'Site title', type: 'text' },
  { key: 'site_tagline', label: 'Tagline (shown under the title)', type: 'text' },
  { key: 'motd', label: 'Message of the day (banner on homepage, leave empty to hide)', type: 'textarea' },
  { key: 'rules_text', label: 'Rules text (shown on a rules notice)', type: 'textarea' },
  { key: 'footer_text', label: 'Footer text', type: 'text' },
  { key: 'threads_per_page', label: 'Threads per page (pagination)', type: 'number' },
];

export default function AdminSettings({ settings: initial }) {
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(false);

  async function save(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="container">
      <h1 className="sitetitle">Site Settings</h1>
      <p>[<a href="/admin">Back to dashboard</a>]</p>
      <form onSubmit={save} className="post">
        {FIELDS.map((f) => (
          <div key={f.key} style={{ marginBottom: 10 }}>
            <div><b>{f.label}</b></div>
            {f.type === 'textarea' ? (
              <textarea
                rows={3}
                cols={60}
                value={values[f.key] || ''}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            ) : (
              <input
                type={f.type}
                value={values[f.key] || ''}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                style={{ width: '100%', maxWidth: 400 }}
              />
            )}
          </div>
        ))}
        <button type="submit">Save Settings</button>
        {saved && <span style={{ marginLeft: 8, color: 'green' }}>Saved.</span>}
      </form>
    </div>
  );
}
