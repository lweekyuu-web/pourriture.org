import Link from 'next/link';
import { useState } from 'react';
import prisma from '../lib/prisma';
import { getWidgetsForSlot } from '../lib/widgets';
import { getAllSettings } from '../lib/settings';
import { isAdminRequest } from '../lib/admin';
import WidgetSlot from '../components/WidgetSlot';
import styles from '../styles/home.module.css';

export async function getServerSideProps({ req }) {
  const boards = await prisma.board.findMany({
    where:{status:'public'},
    include:{threads:{orderBy:{createdAt:'desc'},take:1,include:{posts:{orderBy:{createdAt:'desc'},take:1}}}},
    orderBy:{id:'asc'},
  });
  const boardData = await Promise.all(boards.map(async b => {
    const threadCount = await prisma.thread.count({where:{boardId:b.id}});
    const last=b.threads[0], lastPost=last?.posts?.[0];
    return {id:b.id,name:b.name,description:b.description,threadCount,lastActivity:lastPost?lastPost.createdAt.toISOString():b.createdAt.toISOString()};
  }));
  const [topWidgets,bottomWidgets,settings,totalThreads,totalUsers]=await Promise.all([
    getWidgetsForSlot('home_top'),getWidgetsForSlot('home_bottom'),getAllSettings(),prisma.thread.count(),prisma.user.count()
  ]);
  return {props:{boards:JSON.parse(JSON.stringify(boardData)),topWidgets,bottomWidgets,settings,isAdmin:isAdminRequest(req),totalThreads,totalUsers}};
}

function fmt(dateStr){const d=new Date(dateStr);return d.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'2-digit',timeZone:'utc'})+' '+d.toLocaleTimeString('en-GB',{timeZone:'utc'});}

export default function Home({boards,topWidgets,bottomWidgets,settings,isAdmin,totalThreads,totalUsers}){
  const [editingMotd,setEditingMotd]=useState(false),[motdValue,setMotdValue]=useState(settings.motd||''),[saved,setSaved]=useState(false),[jumpBoard,setJumpBoard]=useState('');
  function handleUpdateClick(e){if(!isAdmin)return;e.preventDefault();setEditingMotd(!editingMotd);}
  function jump(e){e.preventDefault();if(jumpBoard)window.location.href=`/${jumpBoard.replace(/\//g,'')}`;}
  async function saveMotd(){const res=await fetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({motd:motdValue})});if(res.ok){setSaved(true);setTimeout(()=>setSaved(false),1500);setEditingMotd(false);window.location.reload();}}
  return <>
    <div className="topnav">[<Link href="/"><a>Home</a></Link>] [<Link href="/catalog"><a>Catalog</a></Link>] [<Link href="/archive"><a>Archive</a></Link>] [<a href="#bottom">Bottom</a>] [<a href="/" onClick={handleUpdateClick}>Update</a>]</div>
    <div className="container">
      <div className="site-logo-text"><div className="wordmark">{settings.site_title}</div><div className="est-line">est. unknown — a place on the internet</div></div>
      <div className="subtitle">{settings.site_tagline}</div>
      {isAdmin&&editingMotd&&<div className="motd-editor"><div><b>Admin: edit the site notice.</b></div><textarea rows={3} value={motdValue} onChange={e=>setMotdValue(e.target.value)} placeholder="Announcement or notice..."/><div><button type="button" onClick={saveMotd}>Update</button>{' '}<button type="button" onClick={()=>setEditingMotd(false)}>Cancel</button>{saved&&<span style={{marginLeft:8,color:'green'}}>Saved.</span>}</div></div>}
      {!editingMotd&&settings.motd&&settings.motd.trim()&&<div className="motd">{settings.motd}{isAdmin&&<span className="motd-edit-hint"> [<a href="#" onClick={handleUpdateClick}>edit</a>]</span>}</div>}
      <div className={styles.tools}><div className={styles.stats}><b>{boards.length}</b> boards · <b>{totalThreads}</b> threads · <b>{totalUsers}</b> users</div><form className={styles.jump} onSubmit={jump}><label htmlFor="jumpBoard">Jump to:</label><select id="jumpBoard" value={jumpBoard} onChange={e=>setJumpBoard(e.target.value)}><option value="">select a board</option>{boards.map(b=><option key={b.id} value={b.id.replace(/\//g,'')}>{b.id} — {b.name}</option>)}</select><button type="submit" disabled={!jumpBoard}>Go</button></form></div>
      <WidgetSlot widgets={topWidgets}/>
      <div className={styles.heading}><b>PUBLIC BOARDS</b><span>last activity in UTC</span></div>
      {boards.map(b=><div className={styles.board} key={b.id}><div><span className={styles.bid}>[{b.id.replace(/\//g,'')}]</span> <Link href={`/${b.id.replace(/\//g,'')}`}><a>{b.id} {b.name}</a></Link></div><div className={styles.desc}>{b.description}</div><div className={styles.meta}><b>{b.threadCount}</b> threads — Last activity: {fmt(b.lastActivity)}</div></div>)}
      {boards.length===0&&<p className="muted">No public boards are currently available.</p>}
      <WidgetSlot widgets={bottomWidgets}/>
      <div id="bottom" className="footer">{settings.footer_text} — <Link href="/admin"><a>admin</a></Link></div>
    </div>
  </>;
}
