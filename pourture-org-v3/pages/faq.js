import Link from 'next/link';
import prisma from '../lib/prisma';
import { getAllSettings } from '../lib/settings';

export async function getServerSideProps() {
  const settings = await getAllSettings();
  return { props: { settings } };
}

export default function FAQ({ settings }) {
  return (
    <div className="container">
      <div className="topnav">
        [<Link href="/">Return</Link>]
      </div>
      <h1 className="sitetitle">FAQ</h1>
      <div className="subtitle">Frequently Asked Questions</div>

      <div className="faq-section">
        <h3>What is pourriture.org?</h3>
        <p>A small community forum. It has been here for a long time.</p>

        <h3>Do I need to register?</h3>
        <p>No. An anonymous identity is created for you automatically. You can optionally set a display name from your profile.</p>

        <h3>How do I post?</h3>
        <p>Go to a board, click [New Thread] to start a discussion, or [Reply] inside a thread to respond.</p>

        <h3>Can I upload images or files?</h3>
        <p>No. This is a text-only community.</p>

        <h3>What are the rules?</h3>
        <p>{settings.rules_text}</p>

        <h3>What do badges mean?</h3>
        <p>Badges like [NEWBIE], [VETERAN], [MOD] indicate user status. They are assigned automatically based on activity.</p>

        <h3>Is this site real?</h3>
        <p>No. This is a fictional experimental community. All users and content are fictitious.</p>

        <h3>How old is this site?</h3>
        <p>Established {settings.established_year || '2009'}. Current version: {settings.site_version || '3.7'}. Last major update: {settings.last_updated || '2017'}.</p>
      </div>

      <div className="last-modified">Last modified: 09/15/2015</div>
      <div className="footer">pourriture.org — FAQ</div>
    </div>
  );
}
