import Head from 'next/head';
import Link from 'next/link';

const links = [
  ['Overview', '/mod/'], ['Reports', '/reports'], ['Posts', '/posts'], ['Threads', '/threads'],
  ['Avatars', '/mod/ai-review'], ['AI Review', '/mod/ai-review'], ['Users', '/users'],
  ['Warnings', '/warnings'], ['Logs', '/mod/logs'], ['Badges', '/admin/badges'], ['Settings', '/admin/settings'],
];

export default function ModeratorSpace({ authorized }) {
  if (!authorized) return <main className="page"><h1>Access Denied</h1><p>You do not have permission to access the Moderator Space.</p></main>;
  return <><Head><title>Moderator Space - POURRITURE.ORG</title><style>{`body{font:13px Arial,Verdana,sans-serif;color:#333}.page{max-width:900px;margin:25px auto;padding:0 12px}.head{border:1px solid #999;background:#eee;padding:8px 10px}.head h1{font-size:18px;margin:0}.nav{display:flex;flex-wrap:wrap;border:1px solid #999;border-top:0;background:#fafafa}.nav a{padding:7px 10px;color:#00e;text-decoration:underline;border-right:1px solid #ccc}.box{margin-top:15px;border:1px solid #999;background:#fff}.box h2{font-size:14px;margin:0;padding:7px 10px;background:#eee;border-bottom:1px solid #aaa}.box p{padding:10px;margin:0}.note{color:#666;font-size:11px}`}</style></Head><main className="page"><div className="head"><h1>POURRITURE.ORG — Moderator Space</h1></div><nav className="nav">{links.map(([label,href])=><Link key={label} href={href}><a>{label}</a></Link>)}</nav><section className="box"><h2>AI Review</h2><p>AI decisions are triage only. <Link href="/mod/ai-review"><a>Open the review queue</a></Link> to approve, reject, override or request another review.</p></section><section className="box"><h2>Moderation principle</h2><p className="note">Automated checks never replace human moderation. Important decisions are reviewable and logged.</p></section></main></>;
}

export async function getServerSideProps({ req }) {
  try { const { checkModPermission } = require('../../lib/permissions'); return { props:{ authorized:await checkModPermission(req) } }; } catch { return { props:{ authorized:false } }; }
}
