import Link from 'next/link';
import { useState } from 'react';
import prisma from '../../../lib/prisma';
import { getWidgetsForSlot } from '../../../lib/widgets';
import { isModeratorReq } from '../../../lib/permissions';
import WidgetSlot from '../../../components/WidgetSlot';
import GifPicker from '../../../components/GifPicker';

export async function getServerSideProps({ params, req }) {
  const threadId = parseInt(params.id, 10);
  const thread = await prisma.thread.findUnique({ where: { id: threadId }, include: { posts: { orderBy: { createdAt: 'asc' }, include: { author: { select: { anonId: true, displayName: true, badge: true, avatarUrl: true, avatarStatus: true, profileNameColor: true, profileNameStyle: true } } } }, board: true } });
  if (!thread) return { notFound: true };
  await prisma.thread.update({ where: { id: threadId }, data: { views: { increment: 1 } } });
  const [topWidgets, bottomWidgets] = await Promise.all([getWidgetsForSlot('thread_top'), getWidgetsForSlot('thread_bottom')]);
  const isMod = await isModeratorReq(req);
  return { props: { thread: JSON.parse(JSON.stringify({ ...thread, views: thread.views + 1 })), boardSlug: params.board, topWidgets, bottomWidgets, isMod } };
}

function fmt(dateStr) { const d = new Date(dateStr); return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: 'utc' }) + ' ' + d.toLocaleTimeString('en-GB', { timeZone: 'utc' }); }
function displayPostNumber(value) { return String(value || '').replace(/^n\./i, ''); }
function nameStyle(author) { if (!author) return {}; const style = author.profileNameStyle || 'normal'; return { color: author.profileNameColor || '#117743', fontWeight: style === 'bold' || style === 'bold-italic' ? 'bold' : 'normal', fontStyle: style === 'italic' || style === 'bold-italic' ? 'italic' : 'normal' }; }
const avatarStyle = { width: 28, height: 28, objectFit: 'cover', border: '1px solid #888', verticalAlign: 'middle', marginRight: 4 };
const badgeStyle = { display: 'inline-block', fontSize: 10, border: '1px solid #999', padding: '0 3px', marginLeft: 4, background: '#e0e0e0', fontWeight: 'bold' };
const mediaStyle = { maxWidth: 'min(520px, 100%)', maxHeight: 420, display: 'block', border: '1px solid #b7c5d9' };

export default function ThreadPage({ thread, boardSlug, topWidgets, bottomWidgets, isMod }) {
  const [replyTo, setReplyTo] = useState(null), [message, setMessage] = useState(''), [gifUrl, setGifUrl] = useState(''), [imageUrl, setImageUrl] = useState(''), [posts, setPosts] = useState(thread.posts), [collapsed, setCollapsed] = useState({});
  async function submitReply(e) { e.preventDefault(); const res = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId: thread.id, message, gifUrl, imageUrl, replyToId: replyTo }) }); const data = await res.json().catch(() => ({})); if (res.ok) { if (!data.review) setPosts([...posts, data.post]); setMessage(''); setGifUrl(''); setImageUrl(''); setReplyTo(null); if (data.review) alert(data.reviewReason || 'Your submission is waiting for moderator review.'); } else alert(data.error || 'Something went wrong.'); }
  async function report(postId) { const reason = prompt('Why are you reporting this post?\n\nSpam / flood\nHarassment\nIllegal / prohibited content\nPersonal information\nSelf-harm concern\nOther'); if (!reason) return; const details = prompt('Additional details (optional):') || ''; const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, reason, details }) }); alert(res.ok ? 'Report submitted.' : 'Unable to submit report.'); }
  async function modAction(action, postId) { await fetch('/api/mod/moderate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, postId }) }); window.location.reload(); }
  function jumpTo(postId) { const target = document.getElementById(`post-${postId}`); if (!target) return; target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('post-highlight'); window.setTimeout(() => target.classList.remove('post-highlight'), 1800); }
  return <main className="container">
    <div className="page-nav">[<Link href={`/${boardSlug}`}>{thread.board.id}</Link>] [<Link href="/catalog">Catalog</Link>] [<a href="#bottom">Bottom</a>] [<a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>Update</a>]</div>
    <h1 className="sitetitle">{thread.subject || 'Thread'}{' '}{thread.sticky && <span className="indicator sticky">[STICKY]</span>}{thread.locked && <span className="indicator locked">[LOCKED]</span>}{thread.archived && <span className="indicator archived">[ARCHIVED]</span>}</h1>
    <div className="subtitle">Thread #{thread.id} — {thread.views} views — {posts.length} posts</div>
    <WidgetSlot widgets={topWidgets}/>
    {posts.map((p, idx) => { const author = p.author, avatarVisible = author?.avatarUrl && author.avatarStatus === 'approved', badge = author?.badge || '', replyTarget = p.replyToId ? posts.find((target) => target.id === p.replyToId) : null, isReview = p.status === 'review'; return <div className={`post ${collapsed[p.id] ? 'post-collapsed' : ''}`} id={`post-${p.id}`} key={p.id}>
      <div className="post-head">{avatarVisible && <img className="post-avatar" style={avatarStyle} src={author.avatarUrl} alt="" loading="lazy" />}<a className="name post-author-name" style={nameStyle(author)} href={author ? `/user/${author.anonId}` : '#'} onClick={!author ? (e) => e.preventDefault() : undefined}>{p.displayName || 'Anonymous'}</a>{author?.anonId && <span className="anon-post-id"> ({author.anonId})</span>}{badge && <span className="post-badge" style={badgeStyle}>[{badge}]</span>}{idx === 0 && <span className="badge op-badge">[OP]</span>}<span className="date">{fmt(p.createdAt)}</span> <Link className="postnum" href={`/post/${encodeURIComponent(p.postNumber)}`}>No.{displayPostNumber(p.postNumber)}</Link>{p.editedAt && <span className="muted"> (edited {fmt(p.editedAt)})</span>}<a href="#" className="collapse-link" onClick={(e) => { e.preventDefault(); setCollapsed({ ...collapsed, [p.id]: !collapsed[p.id] }); }}>[{collapsed[p.id] ? '+' : '−'}]</a></div>
      {!collapsed[p.id] && <>{replyTarget && <div className="quote"><a href="#" onClick={(e) => { e.preventDefault(); jumpTo(replyTarget.id); }}>&gt;&gt;{displayPostNumber(replyTarget.postNumber)}</a></div>}{isReview ? <div className="review-note">⚠ This comment is being reviewed by a moderator.</div> : <>{p.content && <div className="content">{p.hidden ? '[post removed by moderator]' : p.content}</div>}{p.imageUrl && !p.hidden && <div className="post-gif"><img src={p.imageUrl} alt="Attached image" loading="lazy" style={mediaStyle}/></div>}{p.gifUrl && !p.hidden && <div className="post-gif"><img src={p.gifUrl} alt="GIF" loading="lazy" style={mediaStyle}/></div>}</>}</div>}
      <div className="actions">{!thread.locked && !thread.archived && !isReview && <a href="#" onClick={(e) => { e.preventDefault(); setReplyTo(p.id); }}>[Reply]</a>}<a href="#" onClick={(e) => { e.preventDefault(); report(p.id); }}>[Report]</a>{isMod && <>{' '}<a href="#" onClick={(e) => { e.preventDefault(); modAction(p.hidden ? 'restore_post' : 'hide_post', p.id); }}>[{p.hidden ? 'Restore' : 'Hide'}]</a>{' '}<a href="#" onClick={(e) => { e.preventDefault(); if (confirm('Delete this post?')) modAction('delete_post', p.id); }}>[Delete]</a>}</div></div>; })}
    {!thread.locked && !thread.archived ? <div className="post"><form onSubmit={submitReply}>{replyTo && <div>Replying to <a href="#" onClick={(e) => { e.preventDefault(); jumpTo(replyTo); }}>&gt;&gt;{displayPostNumber(posts.find((p) => p.id === replyTo)?.postNumber) || replyTo}</a> <a href="#" onClick={(e) => { e.preventDefault(); setReplyTo(null); }}>[cancel]</a></div>}<div>Message:<br/><textarea rows={4} cols={50} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000}/></div><div className="gif-controls"><GifPicker value={gifUrl} onChange={setGifUrl}/></div><div className="image-controls"><label>Image URL: <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." maxLength={2000}/></label><div className="gif-note">Images are checked automatically; uncertain submissions wait for moderator review.</div>{imageUrl && <img src={imageUrl} alt="Preview" className="image-preview"/>}</div><button type="submit">Post Reply</button></form></div> : <p className="locked-notice">[Thread locked — no new replies can be posted]</p>}
    <WidgetSlot widgets={bottomWidgets}/><div id="bottom" className="footer">pourriture.org — {thread.board.id}</div>
  </main>;
}
