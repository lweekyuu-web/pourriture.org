import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container">
      <div className="topnav">
        [<Link href="/">Return</Link>]
      </div>
      <h1 className="sitetitle">404</h1>
      <div className="error-page">
        <h2>PAGE NOT FOUND</h2>
        <p>The requested page does not exist.</p>
        <p className="muted">Maybe it was never here.</p>
        <p>[<Link href="/">Return to pourriture.org</Link>]</p>
      </div>
    </div>
  );
}
