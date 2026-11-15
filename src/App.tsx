import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { NAV } from './lib/nav';
import { loadState, saveState, uid, now } from './lib/store';
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

  const upd = (fn: (s: AppState) => AppState) => setState(s => fn(structuredClone(s)));

  const navGroups = useMemo(() => {
    const g: Record<string, typeof NAV> = {};
    NAV.forEach(n => { (g[n.group] ||= []).push(n); });
    return g;
  }, []);

  const filteredNav = NAV.filter(n => n.label.toLowerCase().includes(q.toLowerCase()));

  const go = (id: DestinationId) => { setTab(id); setSidebarOpen(false); setCmdk(false); };

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
          {tab==='documents' && <SimpleModule title="Documents" icon="📄" desc="Document library & research workspace (Phase 6: import, viewer, annotations, AI analysis/RAG with citations). Current foundation: organize subjects/topics and attach notes/resources." actions={[['Upload document (coming)','Store PDFs/TXT/MD and view'],['AI analysis (coming)','Summaries, concepts, Q&A with sources']]} />}
          {tab==='ai-tutor' && <AiTutor state={state} />}
          {tab==='flashcards' && <Flashcards state={state} upd={upd} />}
          {tab==='mind-maps' && <MindMaps state={state} upd={upd} />}
          {tab==='quiz-centre' && <QuizCentre />}
          {tab==='focus' && <FocusPage state={state} upd={upd} />}
          {tab==='exams' && <Exams state={state} upd={upd} />}
          {tab==='analytics' && <Analytics state={state} />}
          {tab==='study-groups' && <SimpleModule title="Study Groups" icon="👥" desc="Collaboration hub (Phase 8: groups, shared resources, live co-editing, group goals/challenges). Foundation: plan and share via exports/notes now; collaboration requires backend/sync." actions={[['Create group (coming)','Shared workspace & members'],['Share resources (coming)','Notes, decks, maps, plans']]} />}
          {tab==='resource-library' && <ResourceLibrary state={state} />}
          {tab==='settings' && <SettingsPage state={state} upd={upd} />}
        </main>
      </div>

      {cmdk && <div className="cmdk" onClick={()=>setCmdk(false)}>
        <div className="cmdk-box" onClick={e=>e.stopPropagation()}>
          <input autoFocus placeholder="Jump to feature..." value={q} onChange={e=>setQ(e.target.value)} />
          <div className="cmdk-list">
            {filteredNav.map(n => <button key={n.id} className="cmdk-item" onClick={()=>go(n.id)}>{n.icon} {n.label} <span className="muted">— {n.group}</span></button>)}
            {filteredNav.length===0 && <div className="empty">No results</div>}
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
  return <div>
    <PageHeader title={`Hi, ${state.settings.name}`} subtitle={`${new Date().toDateString()} • Your connected learning dashboard`} right={<button className="btn primary" onClick={()=>go('planner')}>Plan today</button>} />
    <div className="grid g4 section">
      <div className="card"><div className="muted">Subjects</div><div className="kpi">{state.subjects.length}</div></div>
      <div className="card"><div className="muted">Notes</div><div className="kpi">{state.notes.length}</div></div>
      <div className="card"><div className="muted">Focus minutes</div><div className="kpi">{totalMins}</div></div>
      <div className="card"><div className="muted">Pending tasks</div><div className="kpi">{todayTasks.length}</div></div>
    </div>
    <div className="grid g2 section">
      <div className="card"><h3>Today's schedule & tasks</h3>
        {state.timetable.length===0 && todayTasks.length===0 ? <div className="empty">No events yet. Add them in Planner.</div> : <>
          <ul className="list">{state.timetable.slice(0,6).map(e=> <li key={e.id}><span className="tag">{e.day} {e.slot}</span> {e.title} <span className="muted">({e.subject||'General'})</span></li>)}</ul>
          <h4 style={{margin:'10px 0 4px'}}>Tasks</h4>
          <ul className="list">{todayTasks.slice(0,6).map(t=> <li key={t.id}><label className="row"><input type="checkbox" checked={t.done} onChange={()=>upd((s:AppState)=>{const x=s.tasks.find(i=>i.id===t.id)!; x.done=!x.done; return s;})}/> {t.title} <span className="tag">{t.priority}</span></label></li>)}</ul>
        </>}
        <div className="row" style={{marginTop:10}}><input id="newtask" placeholder="Quick add task" /><button className="btn" onClick={()=>{const el=document.getElementById('newtask') as HTMLInputElement; if(el?.value){upd((s:AppState)=>{s.tasks.unshift({id:uid(),title:el.value,done:false,priority:'medium'}); return s;}); el.value='';}}}>Add</button></div>
      </div>
      <div className="card"><h3>AI recommendations (rule-based)</h3>
        <ul className="list">
          {todayTasks[0] ? <li>Complete task “{todayTasks[0].title}” — it’s pending and helps keep momentum.</li> : <li>Plan tasks in Planner to get personalized suggestions.</li>}
          {state.flashcards.length>0 ? <li>Review flashcards in Flashcards to strengthen memory (spaced repetition foundation).</li> : <li>Create flashcards from your notes to enable active recall.</li>}
          {state.focusSessions.length===0 ? <li>Start a Focus session to build a study streak and feed Analytics.</li> : <li>Keep your streak: log another Focus session today.</li>}
        </ul>
        <div className="muted" style={{marginTop:8,fontSize:'.85rem'}}>Recommendations are transparent and based on your local data (no external AI calls in this build).</div>
      </div>
    </div>
    <div className="card section"><h3>All modules</h3><div className="grid g4">{NAV.map(n=> <button key={n.id} className="btn" onClick={()=>go(n.id)} style={{justifyContent:'flex-start',display:'flex',gap:8}}><span>{n.icon}</span>{n.label}</button>)}</div></div>
  </div>;
}

function Planner({state, upd}:{state:AppState; upd:any}) {
  const [title,setTitle]=useState(''); const [day,setDay]=useState('Mon'); const [slot,setSlot]=useState('08:00'); const [subject,setSubject]=useState('');
  const add = () => { if(!title) return; upd((s:AppState)=>{s.timetable.push({id:uid(),day,slot,title,subject,type:'study'}); return s;}); setTitle(''); };
  const gen = () => { const samples=['Study','Revision','Practice','Reading']; upd((s:AppState)=>{ days.slice(0,5).forEach((d,i)=>slots.slice(0,4).forEach((sl,j)=>s.timetable.push({id:uid(),day:d,slot:sl,title:samples[(i+j)%4],subject: state.subjects[0]?.name||'General',type:'study'}))); return s;}); };
  return <div>
    <PageHeader title="Planner" subtitle="Timetable, tasks & scheduling — unlimited, no ads (premium options unlocked)" right={<><button className="btn" onClick={gen}>AI-generate plan (local)</button><button className="btn" onClick={()=>window.print()}>Export/Print</button></>} />
    <div className="grid g2 section">
      <div className="card"><h3>Add event</h3><div className="row"><input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} /><select value={day} onChange={e=>setDay(e.target.value)}>{days.map(d=><option key={d}>{d}</option>)}</select><select value={slot} onChange={e=>setSlot(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select><input placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} /><button className="btn primary" onClick={add}>Add</button></div></div>
      <div className="card"><h3>Tasks</h3><ul className="list">{state.tasks.map(t=> <li key={t.id} className="row spread"><label className="row"><input type="checkbox" checked={t.done} onChange={()=>upd((s:AppState)=>{s.tasks.find(x=>x.id===t.id)!.done=!t.done; return s;})}/>{t.title}</label><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.tasks=s.tasks.filter(x=>x.id!==t.id); return s;})}>x</button></li>)}{state.tasks.length===0 && <li className="muted">No tasks</li>}</ul></div>
    </div>
    <div className="card" style={{overflow:'auto'}}><h3>Weekly timetable</h3><table><thead><tr><th>Time</th>{days.map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{slots.map(sl=> <tr key={sl}><th>{sl}</th>{days.map(d=>{const ev=state.timetable.filter(e=>e.day===d&&e.slot===sl); return <td key={d+sl}>{ev.map(e=> <div key={e.id} className="node"><div className="row spread"><span><b>{e.title}</b><div className="muted">{e.subject}</div></span><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.timetable=s.timetable.filter(x=>x.id!==e.id); return s;})}>x</button></div></div>)}{ev.length===0&&<span className="muted">—</span>}</td>;})}</tr>)}</tbody></table></div>
  </div>;
}

function MyLearning({state, upd}:{state:AppState; upd:any}) {
  const [sname,setSname]=useState(''); const [cname,setCname]=useState(''); const [sel,setSel]=useState(state.subjects[0]?.id||'');
  const addS = ()=>{ if(!sname) return; const s:Subject={id:uid(),name:sname,description:'',color:'#3b82f6',icon:'📘',createdAt:now(),chapters:[]}; upd((st:AppState)=>{st.subjects.push(s); return st;}); setSname(''); setSel(s.id); };
  const addC = ()=>{ const sub = state.subjects.find(s=>s.id===sel); if(!sub||!cname) return; const c:Chapter={id:uid(),name:cname,description:'',topics:[],completed:false}; upd((st:AppState)=>{st.subjects.find(s=>s.id===sel)!.chapters.push(c); return st;}); setCname(''); };
  return <div>
    <PageHeader title="My Learning" subtitle="Subjects → Chapters → Topics (connected academic structure)" />
    <div className="grid g2 section">
      <div className="card"><h3>Subjects</h3><div className="row"><input placeholder="New subject (e.g. Physics)" value={sname} onChange={e=>setSname(e.target.value)} /><button className="btn primary" onClick={addS}>Add</button></div>
        <ul className="list">{state.subjects.map(s=> <li key={s.id}><button className={`btn ${sel===s.id?'primary':'ghost'}`} onClick={()=>setSel(s.id)}>{s.icon} {s.name}</button> <span className="muted">({s.chapters.length} chapters)</span></li>)}</ul>
      </div>
      <div className="card"><h3>Chapters & topics</h3>
        {!state.subjects.find(s=>s.id===sel) ? <div className="empty">Select or create a subject.</div> : <>
          <div className="row" style={{marginBottom:8}}><input placeholder="New chapter" value={cname} onChange={e=>setCname(e.target.value)} /><button className="btn" onClick={addC}>Add chapter</button></div>
          {state.subjects.find(s=>s.id===sel)!.chapters.map(ch=> <div key={ch.id} className="node"><div className="row spread"><b>{ch.name}</b><label className="row muted"><input type="checkbox" checked={ch.completed} onChange={()=>upd((st:AppState)=>{const c=st.subjects.find(s=>s.id===sel)!.chapters.find(x=>x.id===ch.id)!; c.completed=!c.completed; return st;})}/> completed</label></div>
            <div className="muted">{ch.topics.length} topics • linked resources via notes/maps/cards (foundation)</div>
          </div>)}
          {state.subjects.find(s=>s.id===sel)!.chapters.length===0 && <div className="empty">No chapters yet.</div>}
        </>}
      </div>
    </div>
    <div className="card"><h3>Knowledge graph (foundation)</h3><div className="muted">Phase 1/4 foundation: subjects & chapters are structured and linkable; full visual graph, topic relations, and cross-links to docs/notes/cards/maps are planned in later phases.</div></div>
  </div>;
}

function NotesPage({state, upd}:{state:AppState; upd:any}) {
  const [sel,setSel]=useState(state.notes[0]?.id||'');
  const note = state.notes.find(n=>n.id===sel) || state.notes[0];
  const add = ()=>{ const n:Note={id:uid(),title:'Untitled',body:'',tags:[],updatedAt:now(),tasks:[]}; upd((s:AppState)=>{s.notes.unshift(n); return s;}); setSel(n.id); };
  const patch = (p:Partial<Note>)=> upd((s:AppState)=>{Object.assign(s.notes.find(n=>n.id===note.id)!, p, {updatedAt:now()}); return s;});
  return <div>
    <PageHeader title="Notes" subtitle="Knowledge workspace — unlimited notes & tasks, local-first" right={<button className="btn primary" onClick={add}>New note</button>} />
    <div className="grid g2">
      <div className="card"><h3>All notes</h3><ul className="list">{state.notes.map(n=> <li key={n.id}><button className={`btn ${n.id===note?.id?'primary':'ghost'}`} style={{width:'100%',justifyContent:'flex-start'}} onClick={()=>setSel(n.id)}>{n.title||'Untitled'}</button></li>)}</ul></div>
      {note ? <div className="card"><input style={{width:'100%',fontWeight:700,fontSize:'1.1rem',marginBottom:8}} value={note.title} onChange={e=>patch({title:e.target.value})} />
        <textarea style={{minHeight:180}} value={note.body} onChange={e=>patch({body:e.target.value})} placeholder="Write notes (rich block editor, links, versioning planned in Phase 2)..." />
        <h4>Checklist</h4><button className="btn" onClick={()=>patch({tasks:[...note.tasks,{id:uid(),text:'New task',done:false}]})}>Add task</button>
        <ul className="list">{note.tasks.map(t=> <li key={t.id} className="row"><input type="checkbox" checked={t.done} onChange={e=>patch({tasks: note.tasks.map(x=>x.id===t.id?{...x,done:e.target.checked}:x)})} /><input style={{flex:1}} value={t.text} onChange={e=>patch({tasks: note.tasks.map(x=>x.id===t.id?{...x,text:e.target.value}:x)})} /></li>)}</ul>
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
  const add = ()=>{ if(!front||!back) return; upd((s:AppState)=>{s.flashcards.push({id:uid(),front,back,deckId:deck}); return s;}); setFront(''); setBack(''); };
  return <div>
    <PageHeader title="Flashcards" subtitle="Active recall foundation — unlimited cards/decks (FSRS scheduling & advanced card types planned in Phase 4)" />
    <div className="grid g2 section">
      <div className="card"><h3>Create card</h3><div className="row"><select value={deck} onChange={e=>setDeck(e.target.value)}>{state.decks.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><input placeholder="Deck name to add" id="nd" /><button className="btn" onClick={()=>{const el=document.getElementById('nd') as HTMLInputElement; if(el?.value){const d={id:uid(),name:el.value}; upd((s:AppState)=>{s.decks.push(d); return s;}); setDeck(d.id); el.value='';}}}>+ deck</button></div>
        <input style={{width:'100%',marginTop:8}} placeholder="Front (question)" value={front} onChange={e=>setFront(e.target.value)} />
        <textarea placeholder="Back (answer)" value={back} onChange={e=>setBack(e.target.value)} />
        <button className="btn primary" onClick={add}>Add card</button>
      </div>
      <div className="card"><h3>Cards ({state.flashcards.length})</h3><ul className="list">{state.flashcards.map(c=> <li key={c.id} className="node"><b>{c.front}</b><div className="muted">{c.back}</div><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.flashcards=s.flashcards.filter(x=>x.id!==c.id); return s;})}>remove</button></li>)}{state.flashcards.length===0 && <div className="empty">No cards yet. Create from notes/topics in later phases.</div>}</ul></div>
    </div>
  </div>;
}

function Exams({state, upd}:{state:AppState; upd:any}) {
  const [name,setName]=useState(''); const [date,setDate]=useState('');
  return <div>
    <PageHeader title="Exams" subtitle="Examination & syllabus tracking foundation (countdowns, simulations, revision strategy in Phases 3/5)" right={<div className="row"><input placeholder="Exam name" value={name} onChange={e=>setName(e.target.value)} /><input type="date" value={date} onChange={e=>setDate(e.target.value)} /><button className="btn primary" onClick={()=>{if(!name) return; upd((s:AppState)=>{s.exams.push({id:uid(),name,date,syllabus:'',status:'planned'}); return s;}); setName('');}}>Add</button></div>} />
    <div className="card">{state.exams.length===0 ? <div className="empty">No exams yet. Add one to track preparation.</div> : <table><thead><tr><th>Exam</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>{state.exams.map(e=> <tr key={e.id}><td>{e.name}</td><td>{e.date||'—'}</td><td><span className="tag">{e.status}</span></td><td><button className="btn danger" onClick={()=>upd((s:AppState)=>{s.exams=s.exams.filter(x=>x.id!==e.id); return s;})}>remove</button></td></tr>)}</tbody></table>}</div>
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

function AiTutor({state}:{state:AppState}) {
  const [input,setInput]=useState(''); const [msgs,setMsgs]=useState<{role:'user'|'ai',text:string}[]>([{role:'ai',text:'Hi! I\'m the Focus Deck AI Tutor (foundation). I can help you plan study steps using your local subjects/notes. Full AI provider integration, RAG over your documents/notes with citations, and advanced modes are planned (Phase 6).'}]);
  const send = ()=>{
    if(!input.trim()) return; const q=input.trim(); setInput('');
    const ctx = state.subjects.map(s=>s.name).join(', ') || 'no subjects yet';
    const reply = `Local guidance (no external model): I see your subjects: ${ctx}. For "${q}", try: 1) identify key concepts, 2) make a short note in Notes, 3) create 3 flashcards, 4) add a 25-min Focus session. This is a transparent placeholder until AI providers & retrieval are configured.`;
    setMsgs(m=>[...m,{role:'user',text:q},{role:'ai',text:reply}]);
  };
  return <div>
    <PageHeader title="AI Tutor" subtitle="Conversational learning assistant — foundation (provider/RAG/citations/modes in Phase 6)" />
    <div className="card"><div style={{maxHeight:360, overflow:'auto', display:'flex', flexDirection:'column', gap:8}}>
      {msgs.map((m,i)=> <div key={i} className="node" style={{alignSelf: m.role==='user'?'flex-end':'flex-start', maxWidth:'85%'}}><b>{m.role==='user'?'You':'Tutor'}</b><div>{m.text}</div></div>)}
    </div>
    <div className="row" style={{marginTop:10}}><input style={{flex:1}} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask a question..." onKeyDown={e=>e.key==='Enter'&&send()} /><button className="btn primary" onClick={send}>Send</button></div></div>
  </div>;
}

function ResourceLibrary({state}:{state:AppState}) {
  return <div>
    <PageHeader title="Resource Library" subtitle="Central library for learning materials (file storage, previews, metadata in later phases)" />
    <div className="grid g2">
      <div className="card"><h3>Linked resources (from your data)</h3><ul className="list"><li>Notes: {state.notes.length}</li><li>Mind maps: {state.mindMaps.length}</li><li>Flashcard decks: {state.decks.length}</li><li>Subjects: {state.subjects.length}</li></ul></div>
      <div className="card"><h3>Library</h3><div className="empty">No external files uploaded yet. Document import & file storage planned in Phase 2/6. Use Notes and Mind Maps now — all unlocked.</div></div>
    </div>
  </div>;
}

function SettingsPage({state, upd}:{state:AppState; upd:any}) {
  return <div>
    <PageHeader title="Settings" subtitle="Personalization & data (full settings in later phases)" />
    <div className="grid g2">
      <div className="card"><h3>Profile</h3><label className="muted">Display name</label><input value={state.settings.name} onChange={e=>upd((s:AppState)=>{s.settings.name=e.target.value; return s;})} />
        <p style={{marginTop:10}}><span className="pill ok">Plan: All features free (open source)</span></p></div>
      <div className="card"><h3>Appearance</h3><p className="muted">Theme: Dark (default). Light/System modes and accent customization planned.</p></div>
      <div className="card"><h3>Data</h3><p className="muted">Local-first storage in browser. Export/backup/restore & sync planned.</p><div className="row"><button className="btn" onClick={()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='focus-deck-backup.json'; a.click();}}>Export backup (JSON)</button>
      <button className="btn danger" onClick={()=>{if(confirm('Reset local data?')){localStorage.clear(); location.reload();}}}>Reset local data</button></div></div>
      <div className="card"><h3>About</h3><p>Focus Deck — original open-source learning workspace. No proprietary app code/assets copied. Premium-style capabilities provided free in this implementation.</p></div>
    </div>
  </div>;
}

function QuizCentre() {
  return <SimpleModule title="Quiz Centre" icon="✅" desc="Assessment & practice (Phase 5: question bank, quiz builder, multiple types, timed/simulation, results & weak-topic analysis). Foundation: create flashcards now and practice via active recall." actions={[['Create quiz (coming)','From notes/docs/topics'],['Practice modes (coming)','Timed, weak-topic, exam simulation']]} />;
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
