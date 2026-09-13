import Link from 'next/link';
import { useState } from 'react';

export default function RecoverIdentity() {
  const [recoveryKey, setRecoveryKey] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function recover(e) {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    setError('');

    try {
      const r = await fetch('/api/identity/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryKey }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || 'Unable to recover identity.');
      } else {
        setNotice(`Identity recovered: User #${data.anonId}${data.displayName ? ` (${data.displayName})` : ''}.`);
        setRecoveryKey('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <div className="topnav">[<Link href="/">Home</Link>] [<Link href="/profile/edit">Edit profile</Link>]</div>
      <h1 className="sitetitle">RECOVER MY IDENTITY</h1>
      <p className="muted">Use the recovery key you received when this site first created your anonymous identity.</p>
      {notice && <p className="notification">{notice} Your browser is now linked to that identity.</p>}
      {error && <p className="notification">{error}</p>}
      <form onSubmit={recover} className="admin profile-form">
        <p><label htmlFor="recoveryKey"><strong>Recovery key</strong></label></p>
        <p><input id="recoveryKey" value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)} maxLength={32} autoComplete="off" spellCheck="false" placeholder="32-character recovery key" /></p>
        <p><button type="submit" disabled={busy}>{busy ? 'Recovering...' : '[ Recover my identity ]'}</button></p>
      </form>
      <p className="muted">Keep this key private. Anyone who has it can recover the associated anonymous identity.</p>
    </main>
  );
}
