import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { NAV } from './lib/nav';
import { loadState, saveState, uid, now, reviewCard } from './lib/store';
import type { AppState, DestinationId, MindNode, Subject, Chapter, Note, TTEvent } from './types';

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const slots = ['08:00','09:00','10:00','11:00','12:00','14:00','16:00','18:00'];

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<DestinationId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cmdk, setCmdk] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => saveState(state), [state]);
  useEffect(() => { const onK = (e: KeyboardEvent) => { if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); setCmdk(v=>!v);} }; window.addEventListener('keydown', onK); return ()=>window.removeEventListener('keydown', onK); }, []);
  useEffect(() => { document.documentElement.dataset.theme = state.settings.theme; document.body.style.background = state.settings.theme==='light' ? '#f1f5f9' : ''; document.body.style.color = state.settings.theme==='light' ? '#0f172a' : ''; }, [state.settings.theme]);

  const upd = (fn: (s: AppState) => AppState) => setState(s => fn(structuredClone(s)));

  const navGroups = useMemo(() => {
    const g: Record<string, typeof NAV> = {};
    NAV.forEach(n => { (g[n.group] ||= []).push(n); });
    return g;
  }, []);

  const ql = q.toLowerCase().trim();
  const filteredNav = NAV.filter(n => n.label.toLowerCase().includes(ql) || n.group.toLowerCase().includes(ql));
  const searchHits = useMemo(() => {
    if (!ql) return [] as {kind:string; label:string; detail:string; tab:DestinationId}[];
    const hits: {kind:string; label:string; detail:string; tab:DestinationId}[] = [];
    state.notes.forEach(n => { if ((n.title+n.body).toLowerCase().includes(ql)) hits.push({kind:'Note', label:n.title||'Untitled', detail:(n.body||'').slice(0,60), tab:'notes'}); });
    state.subjects.forEach(sub => {
      if (sub.name.toLowerCase().includes(ql)) hits.push({kind:'Subject', label:sub.name, detail:`${sub.chapters.length} chapters`, tab:'my-learning'});
      sub.chapters.forEach(ch => { if (ch.name.toLowerCase().includes(ql)) hits.push({kind:'Chapter', label:ch.name, detail:sub.name, tab:'my-learning'}); ch.topics.forEach(t=>{ if(t.title.toLowerCase().includes(ql)) hits.push({kind:'Topic', label:t.title, detail:`${sub.name} / ${ch.name}`, tab:'my-learning'}); }); });
    });
    state.tasks.forEach(t => { if (t.title.toLowerCase().includes(ql)) hits.push({kind:'Task', label:t.title, detail:t.done?'done':'pending', tab:'planner'}); });
    state.resources.forEach(r => { if ((r.title+(r.note||'')).toLowerCase().includes(ql)) hits.push({kind:'Resource', label:r.title, detail:r.type, tab:'resource-library'}); });
    state.mindMaps.forEach(m => { if (m.name.toLowerCase().includes(ql)) hits.push({kind:'Mind Map', label:m.name, detail:'', tab:'mind-maps'}); });
    state.quizzes.forEach(z => { if (z.name.toLowerCase().includes(ql)) hits.push({kind:'Quiz', label:z.name, detail:`${z.questions.length} questions`, tab:'quiz-centre'}); });
    state.exams.forEach(e => { if (e.name.toLowerCase().includes(ql)) hits.push({kind:'Exam', label:e.name, detail:e.date||'', tab:'exams'}); });
    return hits.slice(0,20);
  }, [ql, state]);

  const go = (id: DestinationId) => { setTab(id); setSidebarOpen(false); setCmdk(false); setQ(''); };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen?'open':''} ${collapsed?'collapsed':''}`}>
        <div className="sb-head">
          <div className="brand">{!collapsed && <>Focus <b>Deck</b></>}</div>
          <button className="icon-btn" title="Collapse" onClick={()=>setCollapsed(c=>!c)}>{collapsed?'»':'«'}</button>
        </div>
        <nav className="sb-nav">
          {Object.entries(navGroups).map(([group, items]) => (
            <div key={group}>
              {!collapsed && <div className="sb-group">{group}</div>}
              {items.map(item => (
                <button key={item.id} className={`sb-item ${tab===item.id?'active':''}`} onClick={()=>go(item.id)} title={item.label}>
                  <span className="sb-icon">{item.icon}</span>
                  {!collapsed && <span className="sb-label">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {!collapsed && <div style={{padding:10}}><div className="pill ok">All premium features: FREE</div></div>}
      </aside>
      {sidebarOpen && <div className="overlay" onClick={()=>setSidebarOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <div className="row">
            <button className="icon-btn mobile-toggle" onClick={()=>setSidebarOpen(true)}>☰</button>
            <div className="search" onClick={()=>setCmdk(true)} role="button" tabIndex={0}>
              <span>🔎</span><input placeholder="Search or jump to a feature (Ctrl/Cmd+K)" value={q} onChange={e=>setQ(e.target.value)} onFocus={()=>setCmdk(true)} />
            </div>
          </div>
          <div className="row">
            <span className="pill">Local-first • No ads</span>
            <span className="pill">Dark mode</span>
          </div>
        </header>

        <main className="content">
          {tab==='home' && <Home state={state} upd={upd} go={go} />}
          {tab==='planner' && <Planner state={state} upd={upd} />}
          {tab==='my-learning' && <MyLearning state={state} upd={upd} />}
          {tab==='notes' && <NotesPage state={state} upd={upd} />}
          {tab==='documents' && <DocumentsPage state={state} upd={upd} />}
          {tab==='ai-tutor' && <AiTutor state={state} upd={upd} />}
          {tab==='flashcards' && <Flashcards state={state} upd={upd} />}
          {tab==='mind-maps' && <MindMaps state={state} upd={upd} />}
          {tab==='quiz-centre' && <QuizCentre state={state} upd={upd} />}
          {tab==='focus' && <FocusPage state={state} upd={upd} />}
          {tab==='exams' && <Exams state={state} upd={upd} />}
          {tab==='analytics' && <Analytics state={state} />}
          {tab==='study-groups' && <StudyGroups state={state} upd={upd} />}
          {tab==='resource-library' && <ResourceLibrary state={state} upd={upd} />}
          {tab==='settings' && <SettingsPage state={state} upd={upd} />}
        </main>
      </div>

      {cmdk && <div className="cmdk" onClick={()=>setCmdk(false)}>
        <div className="cmdk-box" onClick={e=>e.stopPropagation()}>
          <input autoFocus placeholder="Search notes, subjects, tasks, resources or jump to a module..." value={q} onChange={e=>setQ(e.target.value)} />
          <div className="cmdk-list">
            {filteredNav.length>0 && <div className="sb-group">Modules</div>}
            {filteredNav.map(n => <button key={n.id} className="cmdk-item" onClick={()=>go(n.id)}>{n.icon} {n.label} <span className="muted">— {n.group}</span></button>)}
            {searchHits.length>0 && <div className="sb-group">Results</div>}
            {searchHits.map((h,i) => <button key={i} className="cmdk-item" onClick={()=>go(h.tab)}><span className="tag">{h.kind}</span> {h.label} {h.detail && <span className="muted">— {h.detail}</span>}</button>)}
            {filteredNav.length===0 && searchHits.length===0 && <div className="empty">No results</div>}
          </div>
        </div>
      </div>}
    </div>
  );
}

function PageHeader({title, subtitle, right}:{title:string; subtitle?:string; right?:any}) {
  return <div className="page-title"><div><h1>{title}</h1>{subtitle && <div className="muted">{subtitle}</div>}</div>{right && <div className="row">{right}</div>}</div>;
}

function Home({state, upd, go}:{state:AppState; upd:any; go:(d:DestinationId)=>void}) {
  const todayTasks = state.tasks.filter(t=>!t.done);
  const totalMins = state.focusSessions.reduce((a,s)=>a+s.minutes,0);
  const todayStr = new Date().toISOString().slice(0,10);
  const dueCards = state.flashcards.filter(c=>c.due<=todayStr).length;
  const upcoming = state.exams.filter(e=>e.date).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(0,3);
  const recentNotes = [...state.notes].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,4);
  return <div>
    <PageHeader title={`Hi, ${state.settings.name}`} subtitle={`${new Date().toDateString()} • Your connected learning dashboard`} right={<><button className="btn" onClick={()=>go('notes')}>New note</button><button className="btn primary" onClick={()=>go('planner')}>Plan today</button></>} />
    <div className="grid g4 section">
      <div className="card"><div className="muted">Subjects</div><div className="kpi">{state.subjects.length}</div><button className="btn ghost" onClick={()=>go('my-learning')}>Open</button></div>
      <div className="card"><div className="muted">Notes</div><div className="kpi">{state.notes.length}</div><button className="btn ghost" onClick={()=>go('notes')}>Open</button></div>
      <div className="card"><div className="muted">Focus minutes</div><div className="kpi">{totalMins}</div><button className="btn ghost" onClick={()=>go('focus')}>Start</button></div>
      <div className="card"><div className="muted">Cards due</div><div className="kpi">{dueCards}</div><button className="btn ghost" onClick={()=>go('flashcards')}>Review</button></div>
    </div>
    <div className="grid g2 section">
      <div className="card"><h3>Today's schedule & tasks <span className="muted">({todayTasks.length} pending)</span></h3>
        {state.timetable.length===0 && todayTasks.length===0 ? <div className="empty">No events yet. Add them in Planner.</div> : <>
          <ul className="list">{state.timetable.slice(0,5).map(e=> <li key={e.id}><span className="tag">{e.day} {e.slot}</span> {e.title} <span className="muted">({e.subject||'General'})</span></li>)}</ul>
          <ul className="list">{todayTasks.slice(0,5).map(t=> <li key={t.id}><label className="row"><input type="checkbox" checked={t.done} onChange={()=>upd((s:AppState)=>{const x=s.tasks.find(i=>i.id===t.id)!; x.done=!x.done; return s;})}/> {t.title} <span className="tag">{t.priority}</span></label></li>)}</ul>
        </>}
        <div className="row" style={{marginTop:10}}><input id="newtask" placeholder="Quick add task" /><button className="btn" onClick={()=>{const el=document.getElementById('newtask') as HTMLInputElement; if(el?.value){upd((s:AppState)=>{s.tasks.unshift({id:uid(),title:el.value,done:false,priority:'medium'}); return s;}); el.value='';}}}>Add</button></div>
      </div>
      <div className="card"><h3>Recommendations & next steps</h3>
        <ul className="list">
          {dueCards>0 ? <li><b>{dueCards} cards due</b> — <button className="btn ghost" onClick={()=>go('flashcards')}>review now</button></li> : <li>No cards due. Create or review flashcards from notes.</li>}
          {todayTasks[0] ? <li>Next task: “{todayTasks[0].title}”</li> : <li>Add tasks in Planner to structure your day.</li>}
          {upcoming[0] ? <li>Upcoming exam: <b>{upcoming[0].name}</b> ({upcoming[0].date})</li> : <li>No exams scheduled — add them in Exams.</li>}
          {state.focusSessions.length===0 ? <li>Start a Focus session to build consistency.</li> : <li>Keep momentum: log another focus session.</li>}
        </ul>
        <div className="muted" style={{marginTop:8,fontSize:'.85rem'}}>Suggestions are transparent and based on your local data.</div>
      </div>
    </div>
    <div className="grid g2 section">
      <div className="card"><h3>Recent notes</h3>{recentNotes.length===0 ? <div className="empty">No notes yet.</div> : <ul className="list">{recentNotes.map(n=> <li key={n.id} className="row spread"><span>{n.title||'Untitled'}</span><button className="btn ghost" onClick={()=>go('notes')}>Open</button></li>)}</ul>}</div>
      <div className="card"><h3>Upcoming exams</h3>{upcoming.length===0 ? <div className="empty">No exams scheduled.</div> : <ul className="list">{upcoming.map(e=> <li key={e.id} className="row spread"><span><b>{e.name}</b> <span className="muted">{e.date}</span></span><button className="btn ghost" onClick={()=>go('exams')}>View</button></li>)}</ul>}</div>
    </div>
    <div className="card section"><h3>All modules</h3><div className="grid g4">{NAV.map(n=> <button key={n.id} className="btn" onClick={()=>go(n.id)} style={{justifyContent:'flex-start',display:'flex',gap:8}}><span>{n.icon}</span>{n.label}</button>)}</div></div>
  </div>;
}

function Planner({state, upd}:{state:AppState; upd:any}) {
  const [title,setTitle]=useState(''); const [day,setDay]=useState('Mon'); const [slot,setSlot]=useState('08:00'); const [subjectId,setSubjectId]=useState(state.subjects[0]?.id||'');
  const [ttitle,setTtitle]=useState(''); const [tprio,setTprio]=useState<'low'|'medium'|'high'>('medium'); const [tdue,setTdue]=useState(''); const [tsub,setTsub]=useState('');
  const add = () => { if(!title) return; const subj = state.subjects.find(s=>s.id===subjectId)?.name || 'General'; upd((s:AppState)=>{s.timetable.push({id:uid(),day,slot,title,subject:subj,type:'study'}); return s;}); setTitle(''); };
  const gen = () => { const samples=['Study','Revision','Practice','Reading','Review']; upd((s:AppState)=>{ days.slice(0,5).forEach((d,i)=>slots.slice(0,4).forEach((sl,j)=>s.timetable.push({id:uid(),day:d,slot:sl,title:samples[(i+j)%samples.length],subject: state.subjects[(i+j)%Math.max(1,state.subjects.length)]?.name||'General',type:'study'}))); return s;}); };
  const addTask = ()=>{ if(!ttitle) return; upd((s:AppState)=>{s.tasks.unshift({id:uid(),title:ttitle,done:false,priority:tprio,due:tdue||undefined,subjectId:tsub||undefined}); return s;}); setTtitle(''); setTdue(''); };
  const pending = state.tasks.filter(t=>!t.done); const done = state.tasks.filter(t=>t.done);
  return <div>
    <PageHeader title="Planner" subtitle="Timetable, tasks & scheduling — linked to subjects, unlimited/free" right={<><button className="btn" onClick={gen}>Generate study plan</button><button className="btn" onClick={()=>window.print()}>Export/Print</button></>} />
    <div className="grid g2 section">
      <div className="card"><h3>Add timetable event</h3><div className="row"><input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} /><select value={day} onChange={e=>setDay(e.target.value)}>{days.map(d=><option key={d}>{d}</option>)}</select><select value={slot} onChange={e=>setSlot(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select><select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">General</option>{state.subjects.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="btn primary" onClick={add}>Add</button></div>
        <div className="muted" style={{marginTop:8}}>Events are stored locally and editable by removing/re-adding (drag/reschedule planned).</div></div>
      <div className="card"><h3>Add task</h3><div className="row"><input placeholder="Task title" value={ttitle} onChange={e=>setTtitle(e.target.value)} /><select value={tprio} onChange={e=>setTprio(e.target.value as any)}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select><input type="date" value={tdue} onChange={e=>setTdue(e.target.value)} /><select value={tsub} onChange={e=>setTsub(e.target.value)}><option value="">No subject</option>{state.subjects.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="btn primary" onClick={addTask}>Add task</button></div>
        <div style={{marginTop:10}}><b>Pending ({pending.length})</b><ul className="list">{pending.map(t=> <li key={t.id} className="row spread"><label className="row"><input type="checkbox" checked={t.done} onChange={()=>upd((s:AppState)=>{s.tasks.find(x=>x.id===t.id)!.done=!t.done; return s;})}/><span>{t.title} <span className="tag">{t.priority}</span>{t.due && <span className="muted"> due {t.due}</span>}</span></label><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.tasks=s.tasks.filter(x=>x.id!==t.id); return s;})}>x</button></li>)}{pending.length===0 && <li className="muted">No pending tasks</li>}</ul></div>
        <div style={{marginTop:8}}><b>Completed ({done.length})</b><ul className="list">{done.slice(0,8).map(t=> <li key={t.id} className="row spread"><label className="row"><input type="checkbox" checked={t.done} onChange={()=>upd((s:AppState)=>{s.tasks.find(x=>x.id===t.id)!.done=!t.done; return s;})}/><span className="muted" style={{textDecoration:'line-through'}}>{t.title}</span></label><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.tasks=s.tasks.filter(x=>x.id!==t.id); return s;})}>x</button></li>)}</ul></div>
      </div>
    </div>
    <div className="card" style={{overflow:'auto'}}><h3>Weekly timetable</h3><table><thead><tr><th>Time</th>{days.map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{slots.map(sl=> <tr key={sl}><th>{sl}</th>{days.map(d=>{const ev=state.timetable.filter(e=>e.day===d&&e.slot===sl); return <td key={d+sl}>{ev.map(e=> <div key={e.id} className="node"><div className="row spread"><span><b>{e.title}</b><div className="muted">{e.subject}</div></span><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.timetable=s.timetable.filter(x=>x.id!==e.id); return s;})}>x</button></div></div>)}{ev.length===0&&<span className="muted">—</span>}</td>;})}</tr>)}</tbody></table></div>
  </div>;
}

function MyLearning({state, upd}:{state:AppState; upd:any}) {
  const [sname,setSname]=useState(''); const [cname,setCname]=useState(''); const [sel,setSel]=useState(state.subjects[0]?.id||'');
  const [tname,setTname]=useState(''); const [selCh,setSelCh]=useState('');
  const sub = state.subjects.find(s=>s.id===sel);
  const addS = ()=>{ if(!sname) return; const ns:Subject={id:uid(),name:sname,description:'',color:'#3b82f6',icon:'📘',createdAt:now(),chapters:[]}; upd((st:AppState)=>{st.subjects.push(ns); return st;}); setSname(''); setSel(ns.id); };
  const addC = ()=>{ if(!sub||!cname) return; const c:Chapter={id:uid(),name:cname,description:'',topics:[],completed:false}; upd((st:AppState)=>{st.subjects.find(s=>s.id===sel)!.chapters.push(c); return st;}); setCname(''); };
  const addT = ()=>{ if(!sub||!selCh||!tname) return; upd((st:AppState)=>{st.subjects.find(s=>s.id===sel)!.chapters.find(c=>c.id===selCh)!.topics.push({id:uid(),title:tname,description:'',difficulty:'beginner',status:'not-started'}); return st;}); setTname(''); };
  const totalTopics = state.subjects.reduce((a,s)=>a+s.chapters.reduce((b,c)=>b+c.topics.length,0),0);
  const mastered = state.subjects.reduce((a,s)=>a+s.chapters.reduce((b,c)=>b+c.topics.filter(t=>t.status==='mastered'||t.status==='completed').length,0),0);
  return <div>
    <PageHeader title="My Learning" subtitle="Subjects → Chapters → Topics (connected academic structure)" right={<span className="pill">{totalTopics} topics • {mastered} done/mastered</span>} />
    <div className="grid g2 section">
      <div className="card"><h3>Subjects</h3><div className="row"><input placeholder="New subject (e.g. Physics)" value={sname} onChange={e=>setSname(e.target.value)} /><button className="btn primary" onClick={addS}>Add</button></div>
        <ul className="list">{state.subjects.map(s=> <li key={s.id} className="row spread"><button className={`btn ${sel===s.id?'primary':'ghost'}`} onClick={()=>{setSel(s.id); setSelCh('');}}>{s.icon} {s.name}</button><span className="muted">{s.chapters.length} ch</span></li>)}</ul>
        {sub && <div style={{marginTop:10}}><label className="muted">Description</label><textarea value={sub.description} onChange={e=>upd((st:AppState)=>{st.subjects.find(s=>s.id===sel)!.description=e.target.value; return st;})} /></div>}
      </div>
      <div className="card"><h3>Chapters</h3>
        {!sub ? <div className="empty">Select or create a subject.</div> : <>
          <div className="row" style={{marginBottom:8}}><input placeholder="New chapter" value={cname} onChange={e=>setCname(e.target.value)} /><button className="btn" onClick={addC}>Add chapter</button></div>
          {sub.chapters.map(ch=> <div key={ch.id} className={`node ${selCh===ch.id?'active':''}`}><div className="row spread"><button className={`btn ${selCh===ch.id?'primary':'ghost'}`} onClick={()=>setSelCh(ch.id)}>{ch.name}</button><label className="row muted"><input type="checkbox" checked={ch.completed} onChange={()=>upd((st:AppState)=>{const c=st.subjects.find(s=>s.id===sel)!.chapters.find(x=>x.id===ch.id)!; c.completed=!c.completed; return st;})}/> done</label></div><div className="muted">{ch.topics.length} topics</div></div>)}
          {sub.chapters.length===0 && <div className="empty">No chapters yet.</div>}
        </>}
      </div>
    </div>
    <div className="card section"><h3>Topics {selCh && sub ? <span className="muted">— {sub.chapters.find(c=>c.id===selCh)?.name}</span> : ''}</h3>
      {!sub || !selCh ? <div className="empty">Select a chapter to manage topics.</div> : <>
        <div className="row" style={{marginBottom:8}}><input placeholder="New topic/concept" value={tname} onChange={e=>setTname(e.target.value)} /><button className="btn primary" onClick={addT}>Add topic</button></div>
        {sub.chapters.find(c=>c.id===selCh)!.topics.length===0 ? <div className="empty">No topics yet.</div> : <table><thead><tr><th>Topic</th><th>Difficulty</th><th>Status</th><th></th></tr></thead><tbody>{sub.chapters.find(c=>c.id===selCh)!.topics.map(t=> <tr key={t.id}><td><input value={t.title} onChange={e=>upd((st:AppState)=>{st.subjects.find(s=>s.id===sel)!.chapters.find(c=>c.id===selCh)!.topics.find(x=>x.id===t.id)!.title=e.target.value; return st;})} /></td><td><select value={t.difficulty} onChange={e=>upd((st:AppState)=>{st.subjects.find(s=>s.id===sel)!.chapters.find(c=>c.id===selCh)!.topics.find(x=>x.id===t.id)!.difficulty=e.target.value as any; return st;})}><option value="beginner">beginner</option><option value="intermediate">intermediate</option><option value="advanced">advanced</option></select></td><td><select value={t.status} onChange={e=>upd((st:AppState)=>{st.subjects.find(s=>s.id===sel)!.chapters.find(c=>c.id===selCh)!.topics.find(x=>x.id===t.id)!.status=e.target.value as any; return st;})}><option value="not-started">not started</option><option value="learning">learning</option><option value="completed">completed</option><option value="needs-revision">needs revision</option><option value="mastered">mastered</option></select></td><td><button className="btn danger" onClick={()=>upd((st:AppState)=>{const ch=st.subjects.find(s=>s.id===sel)!.chapters.find(c=>c.id===selCh)!; ch.topics=ch.topics.filter(x=>x.id!==t.id); return st;})}>x</button></td></tr>)}</tbody></table>}
      </>}
    </div>
    <div className="card"><h3>Knowledge graph (foundation)</h3><div className="muted">Subjects, chapters, and topics are structured and stored as connected entities. Notes, flashcards, mind maps, exams, and resources can be linked to subjects (foundation). Full visual graph and cross-resource navigation planned in later phases.</div></div>
  </div>;
}

function NotesPage({state, upd}:{state:AppState; upd:any}) {
  const [sel,setSel]=useState(state.notes[0]?.id||'');
  const [search,setSearch]=useState('');
  const [tagIn,setTagIn]=useState('');
  const filtered = state.notes.filter(n=> (n.title+n.body+(n.tags||[]).join(' ')).toLowerCase().includes(search.toLowerCase()));
  const note = state.notes.find(n=>n.id===sel) || filtered[0] || state.notes[0];
  const add = ()=>{ const n:Note={id:uid(),title:'Untitled',body:'',tags:[],updatedAt:now(),tasks:[]}; upd((s:AppState)=>{s.notes.unshift(n); return s;}); setSel(n.id); };
  const patch = (p:Partial<Note>)=> { if(!note) return; upd((s:AppState)=>{Object.assign(s.notes.find(n=>n.id===note.id)!, p, {updatedAt:now()}); return s;}); };
  const subject = state.subjects.find(s=>s.id===note?.subjectId);
  const chapters = subject?.chapters || [];
  const addTag = ()=>{ if(!note||!tagIn.trim()) return; const t=tagIn.trim(); if((note.tags||[]).includes(t)){setTagIn(''); return;} patch({tags:[...(note.tags||[]), t]}); setTagIn(''); };
  const toFlash = ()=>{ if(!note) return; const deckId = state.decks[0]?.id; if(!deckId) return; upd((s:AppState)=>{s.flashcards.push({id:uid(),front:note.title||'Note',back:(note.body||'').slice(0,240)||'Empty note',deckId,due:new Date().toISOString().slice(0,10),interval:0,ease:2.5,reps:0}); return s;}); alert('Created a flashcard from this note in the first deck.'); };
  const words = (note?.body||'').trim()? (note!.body.trim().split(/\s+/).length):0;
  return <div>
    <PageHeader title="Notes" subtitle="Knowledge workspace — search, tags, subject/chapter links, checklist (rich editor/versioning planned)" right={<button className="btn primary" onClick={add}>New note</button>} />
    <div className="grid g2">
      <div className="card"><h3>All notes <span className="muted">({state.notes.length})</span></h3><input placeholder="Search notes..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',marginBottom:8}} />
        <ul className="list">{filtered.map(n=> <li key={n.id}><button className={`btn ${n.id===note?.id?'primary':'ghost'}`} style={{width:'100%',justifyContent:'flex-start'}} onClick={()=>setSel(n.id)}>{n.title||'Untitled'}</button><div className="muted" style={{fontSize:'.8rem'}}>{new Date(n.updatedAt).toLocaleDateString()} {(n.tags||[]).slice(0,2).map(t=> <span key={t} className="tag">#{t}</span>)}</div></li>)}{filtered.length===0 && <li className="muted">No matches</li>}</ul></div>
      {note ? <div className="card"><input style={{width:'100%',fontWeight:700,fontSize:'1.1rem',marginBottom:8}} value={note.title} onChange={e=>patch({title:e.target.value})} placeholder="Title" />
        <div className="row" style={{marginBottom:8}}>
          <select value={note.subjectId||''} onChange={e=>patch({subjectId:e.target.value||undefined, chapterId:undefined})}><option value="">No subject</option>{state.subjects.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select value={note.chapterId||''} onChange={e=>patch({chapterId:e.target.value||undefined})} disabled={!note.subjectId}><option value="">No chapter</option>{chapters.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <span className="muted">{words} words</span>
        </div>
        <div className="row" style={{marginBottom:8}}>{(note.tags||[]).map(t=> <span key={t} className="tag">#{t} <button className="btn ghost" style={{padding:'0 4px'}} onClick={()=>patch({tags: note.tags.filter(x=>x!==t)})}>x</button></span>)}<input placeholder="Add tag" value={tagIn} onChange={e=>setTagIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()} /><button className="btn" onClick={addTag}>Tag</button></div>
        <textarea style={{minHeight:220}} value={note.body} onChange={e=>patch({body:e.target.value})} placeholder="Write notes (rich block editor, internal links, backlinks, versioning planned)..." />
        <div className="row" style={{margin:'8px 0'}}><button className="btn" onClick={toFlash}>Create flashcard from note</button></div>
        <h4>Checklist</h4><button className="btn" onClick={()=>patch({tasks:[...(note.tasks||[]),{id:uid(),text:'New task',done:false}]})}>Add task</button>
        <ul className="list">{(note.tasks||[]).map(t=> <li key={t.id} className="row"><input type="checkbox" checked={t.done} onChange={e=>patch({tasks: note.tasks.map(x=>x.id===t.id?{...x,done:e.target.checked}:x)})} /><input style={{flex:1}} value={t.text} onChange={e=>patch({tasks: note.tasks.map(x=>x.id===t.id?{...x,text:e.target.value}:x)})} /><button className="btn danger" onClick={()=>patch({tasks: note.tasks.filter(x=>x.id!==t.id)})}>x</button></li>)}</ul>
        <div className="row" style={{marginTop:10}}><span className="muted">Updated {new Date(note.updatedAt).toLocaleString()}</span><button className="btn danger" onClick={()=>{if(state.notes.length>1) upd((s:AppState)=>{s.notes=s.notes.filter(x=>x.id!==note.id); return s;});}}>Delete</button></div>
      </div> : <div className="card empty">No note selected</div>}
    </div>
  </div>;
}

function MindMaps({state, upd}:{state:AppState; upd:any}) {
  const [sel,setSel]=useState(state.mindMaps[0]?.id||'');
  const map = state.mindMaps.find(m=>m.id===sel) || state.mindMaps[0];
  const setRoot = (r:MindNode)=> upd((s:AppState)=>{Object.assign(s.mindMaps.find(m=>m.id===map.id)!,{root:r,updatedAt:now()}); return s;});
  const updateNode = (root:MindNode,id:string,fn:(n:MindNode)=>MindNode):MindNode => root.id===id?fn(root):{...root,children:root.children.map(c=>updateNode(c,id,fn))};
  const removeNode = (root:MindNode,id:string):MindNode => ({...root,children:root.children.filter(c=>c.id!==id).map(c=>removeNode(c,id))});
  const render = (n:MindNode): any => <div className="node" key={n.id}><div className="row spread"><b>{n.text}</b><span className="row"><button className="btn" onClick={()=>setRoot(updateNode(map.root,n.id,x=>({...x,children:[...x.children,{id:uid(),text:'New node',children:[]}]})))}>+child</button><button className="btn" onClick={()=>{const t=prompt('Text',n.text); if(t!=null) setRoot(updateNode(map.root,n.id,x=>({...x,text:t})));}}>edit</button>{n.id!==map.root.id && <button className="btn danger" onClick={()=>setRoot(removeNode(map.root,n.id))}>del</button>}</span></div>{n.children.length>0 && <div className="children">{n.children.map(render)}</div>}</div>;
  return <div>
    <PageHeader title="Mind Maps" subtitle="Visual thinking — unlimited maps/nodes, no locked templates (advanced canvas in Phase 4)" right={<><button className="btn" onClick={()=>{const m={id:uid(),name:`Map ${state.mindMaps.length+1}`,root:{id:uid(),text:'Central Topic',children:[]},updatedAt:now()}; upd((s:AppState)=>{s.mindMaps.unshift(m); return s;}); setSel(m.id);}}>New map</button><button className="btn primary" onClick={()=>{if(!map) return; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(map,null,2)],{type:'application/json'})); a.download=`${map.name}.json`; a.click();}}>Export JSON</button></>} />
    <div className="card section"><div className="row"><span className="muted">Map:</span><select value={sel} onChange={e=>setSel(e.target.value)}>{state.mindMaps.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}</select>{map && <button className="btn" onClick={()=>{const n=prompt('Map name',map.name); if(n) upd((s:AppState)=>{s.mindMaps.find(x=>x.id===map.id)!.name=n; return s;});}}>Rename</button>}</div></div>
    {map ? <div className="card">{render(map.root)}</div> : <div className="empty">No map</div>}
  </div>;
}

function FocusPage({state, upd}:{state:AppState; upd:any}) {
  const [min,setMin]=useState(25); const [sec,setSec]=useState(25*60); const [run,setRun]=useState(false);
  useEffect(()=>{ if(!run) return; if(sec<=0){ setRun(false); upd((s:AppState)=>{s.focusSessions.unshift({id:uid(),label:'Focus',minutes:min,at:new Date().toLocaleString()}); return s;}); return;} const t=setTimeout(()=>setSec(s=>s-1),1000); return ()=>clearTimeout(t); },[run,sec]);
  const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  return <div>
    <PageHeader title="Focus" subtitle="Timers, sessions & wellbeing — unlimited, no pro pass/subscription" />
    <div className="grid g2">
      <div className="card"><h3>Focus timer</h3><div className="kpi" style={{fontSize:'2.4rem'}}>{fmt(sec)}</div>
        <div className="row" style={{margin:'8px 0'}}><input type="number" min={1} value={min} onChange={e=>{const v=Math.max(1,Number(e.target.value)||25); setMin(v); if(!run) setSec(v*60);}} /> <span className="muted">minutes</span></div>
        <div className="row"><button className="btn primary" onClick={()=>setRun(r=>!r)}>{run?'Pause':'Start'}</button><button className="btn" onClick={()=>{setRun(false); setSec(min*60);}}>Reset</button></div>
        <h4 style={{marginTop:12}}>Blocklist / distraction reminders</h4>
        <div className="row"><input id="bl2" placeholder="Add item" /><button className="btn" onClick={()=>{const el=document.getElementById('bl2') as HTMLInputElement; if(el?.value){upd((s:AppState)=>{s.blocklist.unshift(el.value); return s;}); el.value='';}}}>Add</button></div>
        <ul className="list">{state.blocklist.map((b,i)=><li key={i} className="row spread"><span>{b}</span><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.blocklist=s.blocklist.filter((_,j)=>j!==i); return s;})}>x</button></li>)}</ul>
      </div>
      <div className="card"><h3>Session history & stats</h3><p><span className="pill">Sessions</span> {state.focusSessions.length} &nbsp; <span className="pill">Total</span> {state.focusSessions.reduce((a,s)=>a+s.minutes,0)} min</p>
        <ul className="list">{state.focusSessions.slice(0,15).map(s=> <li key={s.id}>{s.at} — {s.minutes} min</li>)}{state.focusSessions.length===0 && <li className="muted">No sessions yet.</li>}</ul>
      </div>
    </div>
  </div>;
}

function Flashcards({state, upd}:{state:AppState; upd:any}) {
  const [front,setFront]=useState(''); const [back,setBack]=useState(''); const [deck,setDeck]=useState(state.decks[0]?.id||'');
  const [filterDeck,setFilterDeck]=useState<string>('all');
  const [review,setReview]=useState(false); const [show,setShow]=useState(false);
  const [editId,setEditId]=useState<string|null>(null); const [ef,setEf]=useState(''); const [eb,setEb]=useState('');
  const todayStr = new Date().toISOString().slice(0,10);
  const scoped = state.flashcards.filter(c=>filterDeck==='all' ? true : c.deckId===filterDeck);
  const due = scoped.filter(c=>c.due<=todayStr);
  const current = review ? due[0] : null;
  const add = ()=>{ if(!front||!back) return; const d = deck || state.decks[0]?.id; if(!d) return; upd((s:AppState)=>{s.flashcards.push({id:uid(),front,back,deckId:d,due:new Date().toISOString().slice(0,10),interval:0,ease:2.5,reps:0}); return s;}); setFront(''); setBack(''); };
  const grade = (g:number)=>{ if(!current) return; upd((s:AppState)=>{const i=s.flashcards.findIndex(x=>x.id===current.id); if(i>=0) s.flashcards[i]=reviewCard(s.flashcards[i],g); return s;}); setShow(false); };
  const addDeck = ()=>{ const name=prompt('Deck name'); if(!name) return; const d={id:uid(),name}; upd((s:AppState)=>{s.decks.push(d); return s;}); setDeck(d.id); };
  const renameDeck = ()=>{ const d=state.decks.find(x=>x.id===deck); if(!d) return; const name=prompt('Rename deck', d.name); if(!name) return; upd((s:AppState)=>{s.decks.find(x=>x.id===deck)!.name=name; return s;}); };
  const deleteDeck = ()=>{ if(state.decks.length<=1) return alert('Keep at least one deck.'); const d=state.decks.find(x=>x.id===deck); if(!d) return; if(!confirm(`Delete deck "${d.name}" and its cards?`)) return; upd((s:AppState)=>{s.flashcards=s.flashcards.filter(c=>c.deckId!==deck); s.decks=s.decks.filter(x=>x.id!==deck); return s;}); setDeck(state.decks.find(x=>x.id!==deck)?.id||''); setFilterDeck('all'); };
  const genFromTopics = ()=>{
    const d = deck || state.decks[0]?.id; if(!d) return;
    let added=0; upd((s:AppState)=>{
      s.subjects.forEach(sub=>sub.chapters.forEach(ch=>ch.topics.forEach(t=>{
        const frontT=`${sub.name}: ${t.title}`; if(s.flashcards.some(c=>c.front===frontT)) return;
        s.flashcards.push({id:uid(),front:frontT,back:t.description||`Review ${t.title} in ${ch.name}. Status: ${t.status}, difficulty: ${t.difficulty}.`,deckId:d,due:new Date().toISOString().slice(0,10),interval:0,ease:2.5,reps:0}); added++;
      })));
      return s;
    });
    alert(`Generated ${added} card(s) from topics (skipped duplicates).`);
  };
  if(review){
    if(!current){ return <div><PageHeader title="Review complete" subtitle="No more due cards in this view" right={<button className="btn primary" onClick={()=>setReview(false)}>Back</button>} /><div className="card"><div className="empty">All caught up for now. Keep studying consistently.</div></div></div>; }
    return <div><PageHeader title="Review session" subtitle={`${due.length} due in view`} right={<button className="btn" onClick={()=>setReview(false)}>Exit</button>} />
      <div className="card"><div className="muted">Deck: {state.decks.find(d=>d.id===current.deckId)?.name||'—'} • reps {current.reps} • interval {current.interval}d</div><h3 style={{marginTop:8}}>{current.front}</h3>
        {!show ? <button className="btn primary" onClick={()=>setShow(true)}>Show answer</button> : <><div className="node" style={{marginTop:8, whiteSpace:'pre-wrap'}}>{current.back}</div><div className="row" style={{marginTop:10}}><button className="btn danger" onClick={()=>grade(1)}>Again</button><button className="btn" onClick={()=>grade(3)}>Hard</button><button className="btn" onClick={()=>grade(4)}>Good</button><button className="btn primary" onClick={()=>grade(5)}>Easy</button></div></>}
      </div></div>;
  }
  const totalDue = state.flashcards.filter(c=>c.due<=todayStr).length;
  return <div>
    <PageHeader title="Flashcards" subtitle="Spaced repetition (SM-2 style) — decks, generation, review (unlimited/free)" right={<span className="row"><span className="pill">Due total: {totalDue}</span><button className="btn primary" onClick={()=>setReview(true)} disabled={due.length===0}>Review due ({due.length})</button></span>} />
    <div className="grid g2 section">
      <div className="card"><h3>Decks & create</h3>
        <div className="row" style={{marginBottom:8}}><select value={deck} onChange={e=>setDeck(e.target.value)}>{state.decks.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}</select><button className="btn" onClick={addDeck}>+ deck</button><button className="btn" onClick={renameDeck}>Rename</button><button className="btn danger" onClick={deleteDeck}>Delete</button></div>
        <input style={{width:'100%',marginBottom:8}} placeholder="Front (question/prompt)" value={front} onChange={e=>setFront(e.target.value)} />
        <textarea placeholder="Back (answer/explanation)" value={back} onChange={e=>setBack(e.target.value)} />
        <div className="row"><button className="btn primary" onClick={add}>Add card</button><button className="btn" onClick={genFromTopics}>Generate from topics</button></div>
      </div>
      <div className="card"><h3>Stats</h3>
        <ul className="list"><li>Total cards: <b>{state.flashcards.length}</b></li><li>Due now (all): <b>{totalDue}</b></li><li>Decks: <b>{state.decks.length}</b></li></ul>
        <div style={{marginTop:10}}>{state.decks.map(d=>{const cards=state.flashcards.filter(c=>c.deckId===d.id); const dDue=cards.filter(c=>c.due<=todayStr).length; return <div key={d.id} className="row spread" style={{margin:'6px 0'}}><span>{d.name}</span><span className="muted">{cards.length} cards • {dDue} due</span></div>;})}</div>
      </div>
    </div>
    <div className="card"><div className="row spread"><h3>Cards ({scoped.length})</h3><div className="row"><span className="muted">Filter:</span><select value={filterDeck} onChange={e=>setFilterDeck(e.target.value)}><option value="all">All decks</option>{state.decks.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}</select></div></div>
      <ul className="list">{scoped.map(c=> <li key={c.id} className="node">{editId===c.id ? <div>
        <input style={{width:'100%',marginBottom:6}} value={ef} onChange={e=>setEf(e.target.value)} />
        <textarea value={eb} onChange={e=>setEb(e.target.value)} />
        <div className="row"><button className="btn primary" onClick={()=>{upd((s:AppState)=>{const x=s.flashcards.find(f=>f.id===c.id)!; x.front=ef; x.back=eb; return s;}); setEditId(null);}}>Save</button><button className="btn" onClick={()=>setEditId(null)}>Cancel</button></div>
      </div> : <>
        <div className="row spread"><b>{c.front}</b><span className="row"><span className="tag">{state.decks.find(d=>d.id===c.deckId)?.name||'deck'}</span><span className="tag">due {c.due}</span></span></div>
        <div className="muted" style={{whiteSpace:'pre-wrap'}}>{c.back}</div>
        <div className="row" style={{marginTop:6}}><button className="btn" onClick={()=>{setEditId(c.id); setEf(c.front); setEb(c.back);}}>Edit</button><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.flashcards=s.flashcards.filter(x=>x.id!==c.id); return s;})}>Remove</button></div>
      </>}</li>)}{scoped.length===0 && <div className="empty">No cards in this view.</div>}</ul></div>
  </div>;
}

function Exams({state, upd}:{state:AppState; upd:any}) {
  const [name,setName]=useState(''); const [date,setDate]=useState(''); const [item,setItem]=useState('');
  return <div>
    <PageHeader title="Exams" subtitle="Examinations & syllabus tracker foundation (countdown, simulation in later phases)" right={<div className="row"><input placeholder="Exam name" value={name} onChange={e=>setName(e.target.value)} /><input type="date" value={date} onChange={e=>setDate(e.target.value)} /><button className="btn primary" onClick={()=>{if(!name) return; upd((s:AppState)=>{s.exams.push({id:uid(),name,date,syllabus:[],status:'planned'}); return s;}); setName('');}}>Add</button></div>} />
    {state.exams.length===0 ? <div className="card"><div className="empty">No exams yet. Add one to track preparation.</div></div> : state.exams.map(e=> {
      const done = e.syllabus.filter(s=>s.status==='completed'||s.status==='mastered').length; const pct = e.syllabus.length?Math.round(done/e.syllabus.length*100):0;
      const days = e.date ? Math.ceil((new Date(e.date).getTime()-Date.now())/86400000) : null;
      return <div key={e.id} className="card section"><div className="row spread"><h3>{e.name}</h3><span className="row"><span className="tag">{e.date||'no date'}</span>{days!=null && <span className="tag">{days>=0?`${days} days left`:'past'}</span>}<button className="btn danger" onClick={()=>upd((s:AppState)=>{s.exams=s.exams.filter(x=>x.id!==e.id); return s;})}>remove</button></span></div>
        <div className="muted">Syllabus progress {pct}%</div><div className="progress"><span style={{width:`${pct}%`}}/></div>
        <div className="row" style={{marginTop:8}}><input placeholder="Add syllabus item/topic" value={item} onChange={ev=>setItem(ev.target.value)} /><button className="btn" onClick={()=>{if(!item) return; upd((s:AppState)=>{s.exams.find(x=>x.id===e.id)!.syllabus.push({id:uid(),text:item,status:'not-started'}); return s;}); setItem('');}}>Add item</button></div>
        <ul className="list">{e.syllabus.map(it=> <li key={it.id} className="row spread"><span>{it.text} <span className="tag">{it.status}</span></span><span className="row"><select value={it.status} onChange={ev=>upd((s:AppState)=>{s.exams.find(x=>x.id===e.id)!.syllabus.find(y=>y.id===it.id)!.status=ev.target.value as any; return s;})}><option value="not-started">not started</option><option value="learning">learning</option><option value="completed">completed</option><option value="needs-revision">needs revision</option><option value="mastered">mastered</option></select><button className="btn danger" onClick={()=>upd((s:AppState)=>{const ex=s.exams.find(x=>x.id===e.id)!; ex.syllabus=ex.syllabus.filter(y=>y.id!==it.id); return s;})}>x</button></span></li>)}</ul>
      </div>; })}
  </div>;
}

function Analytics({state}:{state:AppState}) {
  const mins = state.focusSessions.reduce((a,s)=>a+s.minutes,0);
  const doneTasks = state.tasks.filter(t=>t.done).length;
  return <div>
    <PageHeader title="Analytics" subtitle="Learning insights from your connected data (advanced charts/reports in Phase 7)" />
    <div className="grid g4 section">
      <div className="card"><div className="muted">Study time</div><div className="kpi">{mins}m</div></div>
      <div className="card"><div className="muted">Sessions</div><div className="kpi">{state.focusSessions.length}</div></div>
      <div className="card"><div className="muted">Tasks done</div><div className="kpi">{doneTasks}/{state.tasks.length}</div></div>
      <div className="card"><div className="muted">Flashcards</div><div className="kpi">{state.flashcards.length}</div></div>
    </div>
    <div className="grid g2">
      <div className="card"><h3>Subject progress (foundation)</h3>{state.subjects.map(s=>{const tot=s.chapters.length; const done=s.chapters.filter(c=>c.completed).length; const pct=tot?Math.round(done/tot*100):0; return <div key={s.id} style={{margin:'8px 0'}}><div className="row spread"><span>{s.icon} {s.name}</span><span className="muted">{pct}%</span></div><div className="progress"><span style={{width:`${pct}%`}}/></div></div>;})}{state.subjects.length===0 && <div className="empty">Add subjects in My Learning.</div>}</div>
      <div className="card"><h3>Insights (transparent)</h3><ul className="list"><li>Study consistency: {state.focusSessions.length} logged session(s).</li><li>Knowledge base: {state.notes.length} notes, {state.mindMaps.length} mind maps.</li><li>Upcoming exams: {state.exams.length}.</li><li className="muted">Estimates are based on recorded local activity only (not claims of understanding from time alone).</li></ul></div>
    </div>
  </div>;
}

function DocumentsPage({state, upd}:{state:AppState; upd:any}) {
  const [title,setTitle]=useState(''); const [type,setType]=useState('PDF');
  return <div>
    <PageHeader title="Documents" subtitle="Document library foundation (upload/viewer/annotations/RAG in later phases). Track and link documents to subjects now." right={<span className="pill">{state.resources.filter(r=>['PDF','Document','TXT','Markdown'].includes(r.type)).length} docs</span>} />
    <div className="grid g2">
      <div className="card"><h3>Add document entry</h3><p className="muted">Full file import/viewer pipeline requires storage backend; add metadata/links now.</p>
        <div className="row"><input placeholder="Document title" value={title} onChange={e=>setTitle(e.target.value)} /><select value={type} onChange={e=>setType(e.target.value)}><option>PDF</option><option>Document</option><option>TXT</option><option>Markdown</option></select><button className="btn primary" onClick={()=>{if(!title) return; upd((s:AppState)=>{s.resources.unshift({id:uid(),title,type,addedAt:new Date().toLocaleString(),note:''}); return s;}); setTitle('');}}>Add</button></div>
      </div>
      <div className="card"><h3>AI & research (planned)</h3><ul className="list"><li>Import & text extraction (Phase 6)</li><li>Q&A with source citations / RAG (Phase 6)</li><li>Generate notes, cards, mind maps, quizzes from docs (Phase 6)</li></ul></div>
    </div>
    <div className="card"><h3>Document entries</h3>{state.resources.filter(r=>['PDF','Document','TXT','Markdown','Link'].includes(r.type)).length===0 ? <div className="empty">No documents yet.</div> : <ul className="list">{state.resources.filter(r=>['PDF','Document','TXT','Markdown','Link'].includes(r.type)).map(r=> <li key={r.id} className="row spread"><span><b>{r.title}</b> <span className="tag">{r.type}</span></span><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.resources=s.resources.filter(x=>x.id!==r.id); return s;})}>x</button></li>)}</ul>}</div>
  </div>;
}

function StudyGroups({state, upd}:{state:AppState; upd:any}) {
  const [name,setName]=useState(''); const [desc,setDesc]=useState('');
  return <div>
    <PageHeader title="Study Groups" subtitle="Collaboration foundation (real-time sharing/editing needs backend/sync, Phase 8)" right={<span className="pill">{state.groups.length} groups</span>} />
    <div className="grid g2">
      <div className="card"><h3>Create group (local)</h3><input placeholder="Group name" value={name} onChange={e=>setName(e.target.value)} /><textarea placeholder="Description / subject" value={desc} onChange={e=>setDesc(e.target.value)} /><button className="btn primary" onClick={()=>{if(!name) return; upd((s:AppState)=>{s.groups.unshift({id:uid(),name,description:desc,members:1}); return s;}); setName(''); setDesc('');}}>Create</button></div>
      <div className="card"><h3>Groups</h3>{state.groups.length===0 ? <div className="empty">No groups yet. Create a group to organize shared goals (sync/collab in later phases).</div> : <ul className="list">{state.groups.map(g=> <li key={g.id} className="node"><b>{g.name}</b><div className="muted">{g.description}</div><div className="row spread"><span className="tag">{g.members} member(s)</span><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.groups=s.groups.filter(x=>x.id!==g.id); return s;})}>remove</button></div></li>)}</ul>}</div>
    </div>
  </div>;
}

function AiTutor({state, upd}:{state:AppState; upd:any}) {
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [msgs,setMsgs]=useState<{role:'user'|'ai',text:string}[]>([{role:'ai',text:'AI Tutor ready. Configure a provider (OpenAI-compatible, local Ollama, Anthropic, Gemini/custom endpoint) in Settings → AI & MCP, or use local guidance mode. Conversations are stored locally in this session UI.'}]);
  const provider = state.aiProviders.find(p=>p.id===state.settings.defaultProviderId && p.enabled) || state.aiProviders.find(p=>p.enabled);
  const send = async ()=>{
    if(!input.trim()||busy) return; const q=input.trim(); setInput('');
    setMsgs(m=>[...m,{role:'user',text:q}]); setBusy(true);
    const ctx = `Subjects: ${state.subjects.map(s=>s.name).join(', ')||'none'}. Notes: ${state.notes.length}. Tasks pending: ${state.tasks.filter(t=>!t.done).length}.`;
    try {
      if(!provider || !provider.baseUrl){
        throw new Error('no-provider');
      }
      if(provider.type==='ollama'){
        const res = await fetch(`${provider.baseUrl.replace(/\/$/,'')}/api/chat`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({model: provider.model||'llama3.1', messages:[{role:'system',content:'You are a helpful study tutor. Use the provided student context.'},{role:'user',content:`Context: ${ctx}\n\nQuestion: ${q}`}], stream:false})});
        const data = await res.json();
        const text = data?.message?.content || data?.response || JSON.stringify(data).slice(0,800);
        setMsgs(m=>[...m,{role:'ai',text:`[${provider.name}/${provider.model}] ${text}`}]);
      } else if(provider.type==='openai-compatible' || provider.type==='custom'){
        const headers: any = {'Content-Type':'application/json'}; if(provider.apiKey) headers['Authorization'] = `Bearer ${provider.apiKey}`;
        const res = await fetch(`${provider.baseUrl.replace(/\/$/,'')}/chat/completions`, {method:'POST', headers, body: JSON.stringify({model: provider.model||'gpt-4o-mini', messages:[{role:'system',content:'You are a helpful study tutor. Use the provided student context.'},{role:'user',content:`Context: ${ctx}\n\nQuestion: ${q}`}], temperature:0.4})});
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || data?.error?.message || JSON.stringify(data).slice(0,800);
        setMsgs(m=>[...m,{role:'ai',text:`[${provider.name}/${provider.model}] ${text}`}]);
      } else if(provider.type==='anthropic'){
        const res = await fetch(`${provider.baseUrl.replace(/\/$/,'')}/v1/messages`, {method:'POST', headers:{'Content-Type':'application/json','x-api-key':provider.apiKey||'', 'anthropic-version':'2023-06-01'}, body: JSON.stringify({model: provider.model||'claude-3-5-sonnet-latest', max_tokens:800, messages:[{role:'user',content:`Context: ${ctx}\n\nQuestion: ${q}`}]})});
        const data = await res.json();
        const text = data?.content?.[0]?.text || data?.error?.message || JSON.stringify(data).slice(0,800);
        setMsgs(m=>[...m,{role:'ai',text:`[${provider.name}/${provider.model}] ${text}`}]);
      } else if(provider.type==='gemini'){
        const url = `${provider.baseUrl.replace(/\/$/,'')}/v1beta/models/${encodeURIComponent(provider.model||'gemini-1.5-flash')}:generateContent?key=${encodeURIComponent(provider.apiKey||'')}`;
        const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({contents:[{parts:[{text:`Context: ${ctx}\n\nQuestion: ${q}`}]}]})});
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text).join('\n') || data?.error?.message || JSON.stringify(data).slice(0,800);
        setMsgs(m=>[...m,{role:'ai',text:`[${provider.name}/${provider.model}] ${text}`}]);
      } else {
        throw new Error('unsupported');
      }
    } catch(e:any){
      const fallback = `Local guidance (provider unavailable/misconfigured: ${e?.message||'error'}). Subjects: ${ctx}. Steps: 1) break the question into concepts, 2) create/update a note, 3) make flashcards, 4) schedule a focus session. Configure AI providers/MCP in Settings.`;
      setMsgs(m=>[...m,{role:'ai',text:fallback}]);
    } finally { setBusy(false); }
  };
  return <div>
    <PageHeader title="AI Tutor" subtitle={provider?`Active provider: ${provider.name} (${provider.model||'model'})`:'No provider configured — using local guidance mode'} />
    <div className="card"><div style={{maxHeight:380, overflow:'auto', display:'flex', flexDirection:'column', gap:8}}>
      {msgs.map((m,i)=> <div key={i} className="node" style={{alignSelf: m.role==='user'?'flex-end':'flex-start', maxWidth:'85%'}}><b>{m.role==='user'?'You':'Tutor'}</b><div style={{whiteSpace:'pre-wrap'}}>{m.text}</div></div>)}
      {busy && <div className="muted">Thinking…</div>}
    </div>
    <div className="row" style={{marginTop:10}}><input style={{flex:1}} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask anything about your studies..." onKeyDown={e=>e.key==='Enter'&&send()} /><button className="btn primary" onClick={send} disabled={busy}>Send</button></div>
    <div className="muted" style={{marginTop:8,fontSize:'.85rem'}}>Calls are made directly from your browser to the configured endpoint (CORS/network must allow). API keys are stored locally on this device. For full RAG/citations and server-side tools, connect a backend in later phases.</div></div>
  </div>;
}

function ResourceLibrary({state, upd}:{state:AppState; upd:any}) {
  const [title,setTitle]=useState(''); const [type,setType]=useState('PDF'); const [note,setNote]=useState('');
  return <div>
    <PageHeader title="Resource Library" subtitle="Central library for learning materials (local metadata now; file storage/sync later)" right={<span className="pill">{state.resources.length} items</span>} />
    <div className="grid g2">
      <div className="card"><h3>Add resource entry</h3><div className="row"><input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} /><select value={type} onChange={e=>setType(e.target.value)}>{['PDF','Document','Image','Audio','Video','Link','Note','Other'].map(t=> <option key={t}>{t}</option>)}</select></div>
        <textarea placeholder="Notes / URL / description" value={note} onChange={e=>setNote(e.target.value)} />
        <button className="btn primary" onClick={()=>{if(!title) return; upd((s:AppState)=>{s.resources.unshift({id:uid(),title,type,note,addedAt:new Date().toLocaleString()}); return s;}); setTitle(''); setNote('');}}>Add</button>
      </div>
      <div className="card"><h3>Resources</h3>{state.resources.length===0 ? <div className="empty">No resources yet. Add entries or create notes/mind maps/flashcards (all connected, free).</div> : <ul className="list">{state.resources.map(r=> <li key={r.id} className="node"><div className="row spread"><b>{r.title}</b><span className="tag">{r.type}</span></div><div className="muted">{r.note}</div><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.resources=s.resources.filter(x=>x.id!==r.id); return s;})}>remove</button></li>)}</ul>}</div>
    </div>
  </div>;
}

function SettingsPage({state, upd}:{state:AppState; upd:any}) {
  const setProv = (id:string, patch:any)=> upd((s:AppState)=>{Object.assign(s.aiProviders.find(p=>p.id===id)!, patch); return s;});
  const addProv = ()=> upd((s:AppState)=>{s.aiProviders.push({id:uid(),name:'New Provider',type:'openai-compatible',baseUrl:'',apiKey:'',model:'',enabled:true}); return s;});
  const addMcp = ()=> upd((s:AppState)=>{s.mcpServers.push({id:uid(),name:'New MCP Server',url:'',transport:'http',enabled:false,notes:''}); return s;});
  const setMcp = (id:string, patch:any)=> upd((s:AppState)=>{Object.assign(s.mcpServers.find(m=>m.id===id)!, patch); return s;});
  return <div>
    <PageHeader title="Settings" subtitle="Profile, appearance, AI providers, local models, MCP, data & backups" />
    <div className="grid g2">
      <div className="card"><h3>Profile & appearance</h3>
        <label className="muted">Display name</label><input value={state.settings.name} onChange={e=>upd((s:AppState)=>{s.settings.name=e.target.value; return s;})} />
        <div className="row" style={{marginTop:10}}><span className="muted">Theme</span>
          {(['dark','light','system'] as const).map(t=> <button key={t} className={`btn ${state.settings.theme===t?'primary':''}`} onClick={()=>upd((s:AppState)=>{s.settings.theme=t; return s;})}>{t}</button>)}
        </div>
        <p style={{marginTop:10}}><span className="pill ok">All premium features: FREE</span></p>
      </div>

      <div className="card"><h3>Data, backup & privacy</h3>
        <p className="muted">Local-first: data stored in browser localStorage on this device. API keys are saved locally (do not share backups publicly).</p>
        <div className="row"><button className="btn" onClick={()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='focus-deck-backup.json'; a.click();}}>Export backup (JSON)</button>
        <label className="btn">Import backup<input type="file" accept="application/json" style={{display:'none'}} onChange={async e=>{const f=e.target.files?.[0]; if(!f) return; try{const j=JSON.parse(await f.text()); localStorage.setItem('fd_state_v4', JSON.stringify(j)); location.reload();}catch{alert('Invalid backup file');}}} /></label>
        <button className="btn danger" onClick={()=>{if(confirm('Reset all local data?')){localStorage.clear(); location.reload();}}}>Reset local data</button></div>
      </div>

      <div className="card" style={{gridColumn:'1 / -1'}}><div className="row spread"><h3>AI Providers & Local Models</h3><button className="btn primary" onClick={addProv}>+ Add provider</button></div>
        <p className="muted">Configure API keys and endpoints (OpenAI-compatible, Anthropic, Gemini, custom) or local models (e.g. Ollama). Choose a default for AI Tutor. Keys stay on-device.</p>
        <div className="row" style={{marginBottom:8}}><span className="muted">Default provider:</span><select value={state.settings.defaultProviderId||''} onChange={e=>upd((s:AppState)=>{s.settings.defaultProviderId=e.target.value||undefined; return s;})}><option value="">Auto (first enabled)</option>{state.aiProviders.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        {state.aiProviders.map(p=> <div key={p.id} className="node">
          <div className="row spread"><b>{p.name}</b><label className="row muted"><input type="checkbox" checked={p.enabled} onChange={e=>setProv(p.id,{enabled:e.target.checked})}/> enabled</label></div>
          <div className="grid g2" style={{marginTop:8}}>
            <label>Name<input value={p.name} onChange={e=>setProv(p.id,{name:e.target.value})} /></label>
            <label>Type<select value={p.type} onChange={e=>setProv(p.id,{type:e.target.value})}><option value="openai-compatible">OpenAI-compatible</option><option value="ollama">Local Ollama</option><option value="anthropic">Anthropic</option><option value="gemini">Gemini</option><option value="custom">Custom</option></select></label>
            <label>Base URL<input value={p.baseUrl} onChange={e=>setProv(p.id,{baseUrl:e.target.value})} placeholder="https://api.openai.com/v1 or http://localhost:11434" /></label>
            <label>Model<input value={p.model} onChange={e=>setProv(p.id,{model:e.target.value})} placeholder="gpt-4o-mini / llama3.1 / claude-..." /></label>
            <label style={{gridColumn:'1 / -1'}}>API Key<input type="password" value={p.apiKey} onChange={e=>setProv(p.id,{apiKey:e.target.value})} placeholder="(stored locally; leave empty for keyless/local)" /></label>
          </div>
          <div className="row" style={{marginTop:8}}><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.aiProviders=s.aiProviders.filter(x=>x.id!==p.id); return s;})}>Remove provider</button></div>
        </div>)}
      </div>

      <div className="card" style={{gridColumn:'1 / -1'}}><div className="row spread"><h3>MCP Servers & Integrations</h3><button className="btn primary" onClick={addMcp}>+ Add MCP server</button></div>
        <p className="muted">Configure Model Context Protocol (MCP) servers for tool/context integrations. Browser-only app stores configs here; executing stdio/local MCP requires a desktop/backend bridge (planned). HTTP/SSE endpoints can be referenced for future integration.</p>
        {state.mcpServers.length===0 && <div className="empty">No MCP servers configured.</div>}
        {state.mcpServers.map(m=> <div key={m.id} className="node">
          <div className="row spread"><b>{m.name||'MCP Server'}</b><label className="row muted"><input type="checkbox" checked={m.enabled} onChange={e=>setMcp(m.id,{enabled:e.target.checked})}/> enabled</label></div>
          <div className="grid g2" style={{marginTop:8}}>
            <label>Name<input value={m.name} onChange={e=>setMcp(m.id,{name:e.target.value})} /></label>
            <label>Transport<select value={m.transport} onChange={e=>setMcp(m.id,{transport:e.target.value})}><option value="http">HTTP</option><option value="sse">SSE</option><option value="stdio">stdio (needs bridge)</option></select></label>
            <label style={{gridColumn:'1 / -1'}}>URL / Endpoint<input value={m.url} onChange={e=>setMcp(m.id,{url:e.target.value})} placeholder="https://..." /></label>
            <label>Command (stdio)<input value={m.command||''} onChange={e=>setMcp(m.id,{command:e.target.value})} /></label>
            <label>Args (stdio)<input value={m.args||''} onChange={e=>setMcp(m.id,{args:e.target.value})} /></label>
            <label style={{gridColumn:'1 / -1'}}>Notes<textarea value={m.notes||''} onChange={e=>setMcp(m.id,{notes:e.target.value})} /></label>
          </div>
          <div className="row" style={{marginTop:8}}><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.mcpServers=s.mcpServers.filter(x=>x.id!==m.id); return s;})}>Remove</button></div>
        </div>)}
      </div>

      <div className="card"><h3>About</h3><p>Focus Deck — original open-source learning workspace. No proprietary app code/assets copied. Premium-style capabilities provided free in this implementation.</p></div>
    </div>
  </div>;
}

function QuizCentre({state, upd}:{state:AppState; upd:any}) {
  const [name,setName]=useState(''); const [prompt,setPrompt]=useState(''); const [opt,setOpt]=useState(['','','','']); const [ans,setAns]=useState(0);
  const [qid,setQid]=useState(state.quizzes[0]?.id||''); const [take,setTake]=useState<string|null>(null); const [idx,setIdx]=useState(0); const [score,setScore]=useState(0);
  const [answers,setAnswers]=useState<number[]>([]);
  const quiz = state.quizzes.find(q=>q.id===qid);
  const addQuiz = ()=>{ if(!name.trim()) return; const q={id:uid(),name:name.trim(),questions:[],attempts:[]}; upd((s:AppState)=>{s.quizzes.unshift(q); return s;}); setQid(q.id); setName(''); };
  const addQ = ()=>{ if(!quiz||!prompt.trim()) return; upd((s:AppState)=>{s.quizzes.find(x=>x.id===quiz.id)!.questions.push({id:uid(),prompt:prompt.trim(),options:[...opt],answer:ans}); return s;}); setPrompt(''); setOpt(['','','','']); setAns(0); };
  const start = (id:string)=>{ setTake(id); setIdx(0); setScore(0); setAnswers([]); };
  const delQuiz = (id:string)=>{ if(!confirm('Delete this quiz?')) return; upd((s:AppState)=>{s.quizzes=s.quizzes.filter(q=>q.id!==id); return s;}); if(qid===id) setQid(''); };
  const delQ = (qqid:string)=>{ if(!quiz) return; upd((s:AppState)=>{const z=s.quizzes.find(x=>x.id===quiz.id)!; z.questions=z.questions.filter(q=>q.id!==qqid); return s;}); };

  if(take){
    const tq = state.quizzes.find(q=>q.id===take);
    if(!tq){ setTake(null); }
    else if(idx>=tq.questions.length){
      const pct = tq.questions.length?Math.round(score/tq.questions.length*100):0;
      return <div><PageHeader title="Quiz Results" subtitle={tq.name} right={<button className="btn" onClick={()=>setTake(null)}>Back</button>} />
        <div className="grid g2 section">
          <div className="card"><div className="kpi">{score}/{tq.questions.length}</div><p className="muted">{pct}% — attempt can be saved.</p>
            <div className="row"><button className="btn primary" onClick={()=>{upd((s:AppState)=>{s.quizzes.find(x=>x.id===tq.id)!.attempts.unshift({id:uid(),score,total:tq.questions.length,at:new Date().toLocaleString()}); return s;});}}>Save attempt</button><button className="btn" onClick={()=>{setTake(null);}}>Close</button></div></div>
          <div className="card"><h3>Review</h3><ul className="list">{tq.questions.map((qu,i)=>{const a=answers[i]; const ok=a===qu.answer; return <li key={qu.id} className="node"><b>{i+1}. {qu.prompt}</b><div className={ok?'muted':'muted'} style={{color: ok? '#86efac':'#fca5a5'}}>Your answer: {a!=null? (qu.options[a]||`Option ${a+1}`):'—'} {ok?'✓':'✗'}</div><div className="muted">Correct: {qu.options[qu.answer]||`Option ${qu.answer+1}`}</div></li>;})}</ul></div>
        </div></div>;
    } else {
      const qu=tq.questions[idx];
      return <div><PageHeader title={tq.name} subtitle={`Question ${idx+1} of ${tq.questions.length}`} right={<button className="btn" onClick={()=>setTake(null)}>Exit</button>} />
        <div className="card"><h3>{qu.prompt}</h3>{qu.options.map((o,i)=><button key={i} className="btn" style={{display:'block',width:'100%',margin:'6px 0',textAlign:'left'}} onClick={()=>{ const correct = i===qu.answer; if(correct) setScore(s=>s+1); setAnswers(a=>[...a,i]); setIdx(i2=>i2+1); }}>{o||`Option ${i+1}`}</button>)}</div></div>;
    }
  }

  return <div>
    <PageHeader title="Quiz Centre" subtitle="Create, edit and take quizzes — unlimited/free (more question types & timed simulation planned)" right={<div className="row"><input placeholder="New quiz name" value={name} onChange={e=>setName(e.target.value)} /><button className="btn primary" onClick={addQuiz}>Create quiz</button></div>} />
    <div className="grid g2">
      <div className="card"><h3>Quizzes</h3>{state.quizzes.length===0?<div className="empty">No quizzes yet. Create one to start practicing.</div>:<ul className="list">{state.quizzes.map(q=> <li key={q.id} className={`node ${qid===q.id?'active':''}`}><div className="row spread"><b>{q.name}</b><span className="muted">{q.questions.length} Q • {q.attempts.length} attempts</span></div>
        {q.attempts[0] && <div className="muted" style={{fontSize:'.85rem'}}>Last: {q.attempts[0].score}/{q.attempts[0].total} ({new Date(q.attempts[0].at).toLocaleDateString()})</div>}
        <div className="row" style={{marginTop:6}}><button className="btn" onClick={()=>setQid(q.id)}>Edit</button><button className="btn primary" onClick={()=>start(q.id)} disabled={q.questions.length===0}>Take</button><button className="btn danger" onClick={()=>delQuiz(q.id)}>Delete</button></div></li>)}</ul>}</div>
      <div className="card"><h3>Quiz editor</h3>{!quiz?<div className="empty">Select or create a quiz.</div>:<>
        <div className="row spread"><b>{quiz.name}</b><span className="muted">{quiz.questions.length} questions</span></div>
        <input style={{width:'100%',marginTop:8}} placeholder="Question prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} />
        {opt.map((o,i)=><div key={i} className="row" style={{marginTop:6}}><input type="radio" checked={ans===i} onChange={()=>setAns(i)} title="Correct answer" /><input style={{flex:1}} placeholder={`Option ${i+1}`} value={o} onChange={e=>{const n=[...opt]; n[i]=e.target.value; setOpt(n);}} /></div>)}
        <div className="row" style={{marginTop:8}}><button className="btn primary" onClick={addQ}>Add question</button><span className="muted">Select the correct option</span></div>
        <h4 style={{marginTop:12}}>Questions</h4>
        <ul className="list">{quiz.questions.map((qu,i)=> <li key={qu.id} className="row spread"><span>{i+1}. {qu.prompt}</span><span className="row"><span className="tag">ans: {(qu.options[qu.answer]||'').slice(0,20)}</span><button className="btn danger" onClick={()=>delQ(qu.id)}>x</button></span></li>)}{quiz.questions.length===0 && <li className="muted">No questions yet.</li>}</ul>
      </>}</div>
    </div>
  </div>;
}

function SimpleModule({title, icon, desc, actions}:{title:string; icon:string; desc:string; actions:[string,string][]}) {
  return <div>
    <PageHeader title={`${icon} ${title}`} subtitle={desc} />
    <div className="grid g2">
      <div className="card"><h3>Status</h3><p className="muted">This module is part of the full Focus Deck roadmap and is scaffolded in navigation now. Core foundations are active in connected modules (Subjects/Notes/Planner/Focus/Flashcards/Mind Maps/Analytics).</p><div className="pill ok">Free & unlocked</div></div>
      <div className="card"><h3>Planned actions</h3><ul className="list">{actions.map(([a,b],i)=><li key={i}><b>{a}</b><div className="muted">{b}</div></li>)}</ul></div>
    </div>
  </div>;
}
