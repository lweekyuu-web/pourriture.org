import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="container">
      <div className="topnav">[<Link href="/">Return</Link>]</div>
      <h1 className="sitetitle">PRIVACY</h1>
      <div className="rules-section">
        <h3>Privacy Policy</h3>
        <p>This is a fictional prototype. No real personal data is collected.</p>
        <p>An anonymous identity is generated locally and stored via a cookie. No email, no password, no personal information is required or stored.</p>
        <p>A recovery key is generated to allow you to restore your identity on the same device. This key is stored as a hash and cannot be used to identify you.</p>
        <p className="muted">Last modified: 03/18/2015</p>
      </div>
    </div>
  );
}
