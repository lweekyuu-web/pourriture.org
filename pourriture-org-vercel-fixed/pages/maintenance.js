import Head from 'next/head';

export default function Maintenance({ enabled = true }) {
  return (
    <>
      <Head>
        <title>POURRITURE.ORG — Maintenance</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="container" style={{ maxWidth: 760, margin: '40px auto' }}>
        <div style={{ border: '1px solid #777', background: '#eee', boxShadow: 'inset 0 0 0 1px #fff' }}>
          <div style={{ background: '#1d4f91', color: '#fff', padding: '5px 8px', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 12, fontWeight: 'bold' }}>
            POURRITURE.ORG — SERVER MAINTENANCE
          </div>
          <div style={{ background: '#f7f7f7', padding: 22, borderTop: '1px solid #fff' }}>
            <h1 style={{ marginTop: 0, fontSize: 22 }}>Server maintenance</h1>
            <p>
              POURRITURE.ORG is temporarily offline while the administrators work on the site.
            </p>
            <p>
              We may be adding features, cleaning up old data, repairing things, or doing general maintenance.
            </p>
            <div style={{ marginTop: 18, padding: 10, border: '1px inset #aaa', background: '#fff', fontFamily: 'monospace', fontSize: 12 }}>
              STATUS: {enabled ? 'MAINTENANCE IN PROGRESS' : 'ONLINE'}<br />
              ESTABLISHED: 2009<br />
              PLEASE CHECK BACK LATER.
            </div>
            <p style={{ marginBottom: 0, marginTop: 18, fontSize: 12, color: '#555' }}>
              If you are an administrator, your maintenance access is still available.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
