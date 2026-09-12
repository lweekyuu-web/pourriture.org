import Link from 'next/link';

export default function Contact() {
  return (
    <div className="container">
      <div className="topnav">[<Link href="/">Return</Link>]</div>
      <h1 className="sitetitle">CONTACT</h1>
      <div className="rules-section">
        <p>This is a fictional experimental community.</p>
        <p>There is no real contact address.</p>
        <p>If this were a real site, you could reach the admin at: admin [at] pourriture [dot] org</p>
        <p className="muted">Last modified: 06/02/2014</p>
      </div>
    </div>
  );
}
