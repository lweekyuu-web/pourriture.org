import { useEffect, useMemo, useState } from 'react';

const subjects = [
  { id: 'maths', name: 'Maths', icon: '∑', tone: 'violet', progress: 54 },
  { id: 'physique', name: 'Physique', icon: '⚛', tone: 'blue', progress: 38 },
  { id: 'ingenierie', name: 'Ingénierie', icon: '⚙', tone: 'orange', progress: 71 },
  { id: 'anglais', name: 'Anglais', icon: 'A', tone: 'green', progress: 64 },
];

const seedTasks = [
  { id: 1, title: 'Exercices 14–18', subject: 'Maths', due: 'Demain', priority: 'high', done: false },
  { id: 2, title: 'Compte rendu mécanique', subject: 'Ingénierie', due: 'Jeudi', priority: 'medium', done: false },
  { id: 3, title: 'Vocabulaire — unit 5', subject: 'Anglais', due: 'Vendredi', priority: 'low', done: true },
];

const seedCards = [
  { id: 1, q: 'Qu’est-ce que le modus ponens ?', a: 'Si P est vraie et P → Q est vraie, alors Q est vraie.', subject: 'Maths', level: 2 },
  { id: 2, q: 'Quelle est l’unité de la force ?', a: 'Le newton (N).', subject: 'Physique', level: 1 },
  { id: 3, q: 'Que signifie sustainable ?', a: 'Durable / soutenable.', subject: 'Anglais', level: 1 },
];

function useLocal(key, initial) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
  }, [key]);
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

function Header({ active, setActive }) {
  const items = [
    ['dashboard', '⌂', 'Accueil'],
    ['courses', '▤', 'Cours'],
    ['cards', '▧', 'Cartes'],
    ['quiz', '◇', 'Quiz'],
    ['tasks', '✓', 'Devoirs'],
    ['focus', '◷', 'Focus'],
    ['ai', '✦', 'POURRITURE AI'],
  ];
  return <header className="app-header">
    <div className="brand">
      <div className="brand-mark">P</div>
      <div><strong>POURRITURE</strong><small>STUDY SYSTEM</small></div>
    </div>
    <nav>{items.map(([id, icon, label]) =>
      <button key={id} className={active === id ? 'nav-active' : ''} onClick={() => setActive(id)}>
        <span>{icon}</span>{label}
      </button>
    )}</nav>
    <div className="header-status"><i /> LOCAL MODE</div>
  </header>;
}

function ProgressBar({ value }) {
  return <div className="progress"><span style={{ width: value + '%' }} /></div>;
}

function Dashboard({ setActive, tasks, setTasks, cards }) {
  const done = tasks.filter(t => t.done).length;
  const next = tasks.find(t => !t.done);
  return <div className="page">
    <section className="hero">
      <div><span className="eyebrow">STUDY // CONTROL CENTER</span><h1>Ton espace de travail.</h1><p>Un seul endroit pour tes cours, tes devoirs, tes cartes et tes révisions.</p></div>
      <div className="hero-clock">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}<b>Prêt à travailler.</b></div>
    </section>

    <div className="quick-grid">
      <button onClick={() => setActive('ai')}><span>✦</span><b>Transformer un cours</b><small>Résumé → cartes → quiz</small></button>
      <button onClick={() => setActive('cards')}><span>▧</span><b>Réviser mes cartes</b><small>{cards.length} cartes disponibles</small></button>
      <button onClick={() => setActive('focus')}><span>◷</span><b>Lancer une session</b><small>25 min sans distraction</small></button>
    </div>

    <div className="dashboard-grid">
      <section className="panel large">
        <div className="panel-title"><div><span className="eyebrow">À FAIRE</span><h2>Prochaines tâches</h2></div><button className="text-button" onClick={() => setActive('tasks')}>Tout voir →</button></div>
        <div className="task-list">{tasks.slice(0, 4).map(t => <label className={'task ' + (t.done ? 'done' : '')} key={t.id}>
          <input type="checkbox" checked={t.done} onChange={() => setTasks(tasks.map(x => x.id === t.id ? {...x, done: !x.done} : x))}/>
          <span className="check" />
          <span><b>{t.title}</b><small>{t.subject} · {t.due}</small></span>
          <em className={'priority ' + t.priority}>{t.priority}</em>
        </label>)}</div>
        <div className="panel-footer">{done}/{tasks.length} tâches terminées</div>
      </section>

      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">PROGRESSION</span><h2>Matières</h2></div></div>
        {subjects.map(s => <div className="subject-row" key={s.id}><div className={'subject-icon ' + s.tone}>{s.icon}</div><div className="subject-info"><b>{s.name}</b><ProgressBar value={s.progress}/></div><strong>{s.progress}%</strong></div>)}
      </section>

      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">RÉVISION</span><h2>À revoir</h2></div></div>
        <div className="review-big">{Math.max(3, cards.length)}<small>cartes aujourd’hui</small></div>
        <button className="primary full" onClick={() => setActive('cards')}>Commencer la révision</button>
      </section>

      <section className="panel large">
        <div className="panel-title"><div><span className="eyebrow">CONTINUITÉ</span><h2>Dernière activité</h2></div></div>
        <div className="activity"><span className="activity-dot" /><div><b>Logique propositionnelle</b><small>Maths · cours relu il y a 18 min</small></div><span>→</span></div>
        <div className="activity"><span className="activity-dot" /><div><b>Modus ponens / tollens</b><small>3 cartes révisées</small></div><span>→</span></div>
        <div className="activity"><span className="activity-dot" /><div><b>Mécanique — translation</b><small>Ingénierie · exercice terminé</small></div><span>→</span></div>
      </section>
    </div>
  </div>;
}

function Courses({ setActive }) {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useLocal('pourriture_note', '');
  return <div className="page"><div className="page-heading"><span className="eyebrow">KNOWLEDGE BASE</span><h1>Mes cours</h1><p>Chaque notion peut devenir une note, une carte, un quiz ou un exercice.</p></div>
    <div className="course-layout"><div className="course-list">{subjects.map(s => <button key={s.id} className={'course-card ' + (selected?.id === s.id ? 'selected' : '')} onClick={() => setSelected(s)}>
      <div className={'subject-icon ' + s.tone}>{s.icon}</div><div><b>{s.name}</b><small>{s.progress}% maîtrisé · 4 chapitres</small></div><span>→</span>
    </button>)}</div>
    <section className="panel editor"><span className="eyebrow">{selected ? selected.name.toUpperCase() : 'ÉDITEUR'}</span><h2>{selected ? 'Notes de cours' : 'Choisis une matière'}</h2>
      {selected ? <><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Colle ou écris ton cours ici…\n\nExemple :\nUne implication P → Q signifie que si P est vraie, alors Q doit être vraie."/><div className="editor-actions"><button className="secondary" onClick={() => setActive('ai')}>✦ Analyser avec l’IA</button><button className="primary" onClick={() => alert('Note enregistrée localement.')}>Enregistrer</button></div></> : <div className="empty">Sélectionne une matière pour ouvrir son espace.</div>}
    </section></div>
  </div>;
}

function Cards({ cards, setCards }) {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const card = cards[index % Math.max(cards.length, 1)];
  return <div className="page"><div className="page-heading"><span className="eyebrow">SPACED REPETITION</span><h1>Cartes mémoire</h1><p>Révise activement. Le niveau augmente quand tu réussis.</p></div>
    <div className="flash-layout">{card ? <section className="flashcard" onClick={() => setShow(!show)}><span className="card-tag">{card.subject}</span><div className="flash-content"><small>{show ? 'RÉPONSE' : 'QUESTION'}</small><h2>{show ? card.a : card.q}</h2></div><span className="flip">Cliquer pour retourner</span></section> : null}
    <div className="flash-controls"><button onClick={() => {setIndex((index + 1) % cards.length);setShow(false)}}>À revoir</button><button className="primary" onClick={() => {setIndex((index + 1) % cards.length);setShow(false)}}>Je connais</button></div>
    <div className="panel card-stats"><b>{cards.length}</b><span>cartes dans le paquet</span><div className="mini-levels"><i/><i/><i/><i/><i/></div><button className="text-button" onClick={() => setCards([...cards,{id:Date.now(),q:'Nouvelle question',a:'Nouvelle réponse',subject:'Personnel',level:1}])}>+ Ajouter une carte</button></div></div>
  </div>;
}

function Tasks({ tasks, setTasks }) {
  const [title, setTitle] = useState('');
  function add() { if (!title.trim()) return; setTasks([...tasks,{id:Date.now(),title:title.trim(),subject:'Personnel',due:'À planifier',priority:'medium',done:false}]); setTitle(''); }
  return <div className="page"><div className="page-heading"><span className="eyebrow">PLANNER</span><h1>Devoirs & tâches</h1><p>Transforme les gros devoirs en petites actions terminables.</p></div>
    <div className="panel add-task"><input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Ex. Finir les exercices de logique…" /><button className="primary" onClick={add}>Ajouter</button></div>
    <section className="panel task-panel">{tasks.map(t => <label className={'task big-task ' + (t.done ? 'done' : '')} key={t.id}><input type="checkbox" checked={t.done} onChange={() => setTasks(tasks.map(x => x.id === t.id ? {...x,done:!x.done}:x))}/><span className="check"/><span><b>{t.title}</b><small>{t.subject} · échéance {t.due}</small></span><em className={'priority '+t.priority}>{t.priority}</em></label>)}</section>
  </div>;
}

function Quiz() {
  const questions = [
    ['Si P est vraie et P → Q est vraie, alors…', 'Q est vraie.'],
    ['Quelle grandeur se mesure en newtons ?', 'La force.'],
    ['Une fonction associe à un élément…', 'Une image, selon la définition de la fonction.'],
  ];
  const [i,setI] = useState(0), [answer,setAnswer] = useState('');
  return <div className="page narrow"><div className="page-heading"><span className="eyebrow">ACTIVE RECALL</span><h1>Quiz rapide</h1><p>Réponds sans regarder tes notes.</p></div><section className="quiz-card"><span>QUESTION {i+1}/{questions.length}</span><h2>{questions[i][0]}</h2><input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Ta réponse…" onKeyDown={e=>{if(e.key==='Enter')setAnswer('')}}/><div className="quiz-answer">{answer && <><b>Correction</b><p>{questions[i][1]}</p></>}</div><button className="primary" onClick={()=>{setI((i+1)%questions.length);setAnswer('')}}>Question suivante →</button></section></div>;
}

function Focus() {
  const [seconds,setSeconds] = useState(25*60), [running,setRunning] = useState(false);
  useEffect(()=>{if(!running)return; const id=setInterval(()=>setSeconds(s=>s>0?s-1:0),1000);return()=>clearInterval(id)},[running]);
  const m=String(Math.floor(seconds/60)).padStart(2,'0'), s=String(seconds%60).padStart(2,'0');
  return <div className="page narrow"><div className="page-heading"><span className="eyebrow">DEEP WORK</span><h1>Focus</h1><p>Une session. Une tâche. Pas de distraction.</p></div><section className="focus-card"><div className="timer">{m}:{s}</div><div className="focus-task">Maths — logique propositionnelle</div><button className="primary" onClick={()=>setRunning(!running)}>{running?'Pause':'Démarrer'}</button><button className="secondary" onClick={()=>{setSeconds(25*60);setRunning(false)}}>Réinitialiser</button></section></div>;
}

function AI({ setCards, setActive }) {
  const [text,setText] = useState('');
  const [result,setResult] = useState(null);
  function analyze() {
    const clean=text.trim();
    if(!clean)return;
    const sentences=clean.split(/[.!?]+/).map(x=>x.trim()).filter(Boolean);
    const generated=sentences.slice(0,8).map((s,i)=>({id:Date.now()+i,q:'Explique / définis : '+s.slice(0,90),a:s,subject:'IA · cours',level:1}));
    setResult({sentences:sentences.length,cards:generated,summary:sentences.slice(0,3).join('. ')+'.'});
  }
  function importCards(){ if(!result)return;setCards(c=>[...c,...result.cards]);setActive('cards'); }
  return <div className="page"><div className="page-heading"><span className="eyebrow">ASSISTANT PÉDAGOGIQUE</span><h1>POURRITURE AI</h1><p>Colle un cours et prépare automatiquement une base de révision. La connexion à un vrai modèle IA pourra être branchée ensuite.</p></div>
    <div className="ai-layout"><section className="panel editor"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Colle ton cours ici…"/><div className="ai-tools"><button onClick={()=>setText('Le modus ponens est une règle d’inférence. Si P est vraie et P implique Q, alors Q est vraie. Le modus tollens part de non Q pour conclure non P.')}>Charger un exemple</button><button className="primary" onClick={analyze}>✦ Générer</button></div></section>
    <section className="panel ai-result"><span className="eyebrow">SORTIE</span>{!result?<div className="empty"><b>En attente d’un cours.</b><small>Le moteur préparera un résumé et des cartes.</small></div>:<><h2>Analyse terminée</h2><div className="result-box"><b>Résumé</b><p>{result.summary}</p></div><div className="result-box"><b>{result.cards.length} cartes générées</b><p>Questions courtes basées sur les phrases de ton cours.</p></div><button className="primary full" onClick={importCards}>Ajouter aux cartes</button></>}</section></div>
  </div>;
}

export default function Home() {
  const [active,setActive]=useState('dashboard');
  const [tasks,setTasks]=useLocal('pourriture_tasks',seedTasks);
  const [cards,setCards]=useLocal('pourriture_cards',seedCards);
  const content = active==='dashboard' ? <Dashboard setActive={setActive} tasks={tasks} setTasks={setTasks} cards={cards}/> :
    active==='courses' ? <Courses setActive={setActive}/> :
    active==='cards' ? <Cards cards={cards} setCards={setCards}/> :
    active==='quiz' ? <Quiz/> :
    active==='tasks' ? <Tasks tasks={tasks} setTasks={setTasks}/> :
    active==='focus' ? <Focus/> : <AI setCards={setCards} setActive={setActive}/>;
  return <div className="study-app"><Header active={active} setActive={setActive}/>{content}<footer><b>POURRITURE.ORG</b><span>study system / v2 prototype</span><span>Les données de démonstration sont stockées localement dans ce navigateur.</span></footer></div>;
}
