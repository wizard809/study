import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Tab = 'dashboard' | 'timetable' | 'mindmap' | 'focus' | 'notes'
type Task = { id: string; text: string; done: boolean }
type Note = { id: string; title: string; body: string; tasks: Task[] }
type TTCell = { day: string; slot: string; text: string }
type MindNode = { id: string; text: string; children: MindNode[] }
type MindMap = { id: string; name: string; root: MindNode }
type Session = { id: string; label: string; minutes: number; at: string }

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']

const uid = () => Math.random().toString(36).slice(2, 10)
const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : d } catch { return d } }
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')

  // Timetable
  const [cells, setCells] = useState<TTCell[]>(() => load('fd_cells', [] as TTCell[]))
  const [ttTitle, setTtTitle] = useState(() => load('fd_tt_title', 'My Weekly Timetable'))
  const [ttOrient, setTtOrient] = useState<'portrait' | 'landscape'>(() => load('fd_tt_orient', 'landscape'))

  // Mind maps
  const [maps, setMaps] = useState<MindMap[]>(() => load('fd_maps', [{ id: uid(), name: 'Main Idea', root: { id: uid(), text: 'Central Topic', children: [] } }]))
  const [activeMap, setActiveMap] = useState(() => load('fd_active_map', ''))

  // Focus
  const [focusMin, setFocusMin] = useState(() => load('fd_focus_min', 25))
  const [seconds, setSeconds] = useState(() => load('fd_focus_sec', 25 * 60))
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState<Session[]>(() => load('fd_sessions', []))
  const [blocklist, setBlocklist] = useState<string[]>(() => load('fd_blocklist', ['social media', 'random videos']))

  // Notes
  const [notes, setNotes] = useState<Note[]>(() => load('fd_notes', [{ id: uid(), title: 'Welcome', body: 'All features unlocked. Free & open source.', tasks: [{ id: uid(), text: 'Try each module', done: false }] }]))
  const [activeNote, setActiveNote] = useState(() => load('fd_active_note', ''))

  useEffect(() => { save('fd_cells', cells); save('fd_tt_title', ttTitle); save('fd_tt_orient', ttOrient) }, [cells, ttTitle, ttOrient])
  useEffect(() => { save('fd_maps', maps); save('fd_active_map', activeMap) }, [maps, activeMap])
  useEffect(() => { save('fd_focus_min', focusMin); save('fd_focus_sec', seconds); save('fd_sessions', sessions); save('fd_blocklist', blocklist) }, [focusMin, seconds, sessions, blocklist])
  useEffect(() => { save('fd_notes', notes); save('fd_active_note', activeNote) }, [notes, activeNote])
  useEffect(() => { if (!activeMap && maps[0]) setActiveMap(maps[0].id) }, [maps, activeMap])
  useEffect(() => { if (!activeNote && notes[0]) setActiveNote(notes[0].id) }, [notes, activeNote])

  useEffect(() => {
    if (!running) return
    if (seconds <= 0) {
      setRunning(false)
      setSessions(s => [{ id: uid(), label: 'Focus session', minutes: focusMin, at: new Date().toLocaleString() }, ...s])
      return
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, seconds, focusMin])

  const map = maps.find(m => m.id === activeMap) || maps[0]
  const note = notes.find(n => n.id === activeNote) || notes[0]
  const streak = useMemo(() => sessions.length, [sessions])

  const setCell = (day: string, slot: string, text: string) => {
    setCells(prev => {
      const rest = prev.filter(c => !(c.day === day && c.slot === slot))
      return text ? [...rest, { day, slot, text }] : rest
    })
  }
  const getCell = (day: string, slot: string) => cells.find(c => c.day === day && c.slot === slot)?.text || ''

  const generateTimetable = () => {
    const sample = ['Study', 'Math', 'Break', 'Project', 'Reading', 'Exercise', 'Review']
    const next: TTCell[] = []
    days.slice(0, 5).forEach((d, i) => slots.forEach((s, j) => next.push({ day: d, slot: s, text: sample[(i + j) % sample.length] })))
    setCells(next)
  }
  const exportTimetable = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const rows = slots.map(s => `<tr><th>${s}</th>${days.map(d => `<td>${(getCell(d, s) || '').replace(/</g,'&lt;')}</td>`).join('')}</tr>`).join('')
    w.document.write(`<html><head><title>${ttTitle}</title><style>@page{size:A4 ${ttOrient};margin:12mm}body{font-family:Arial}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:6px}h1{margin:0 0 8px}</style></head><body><h1>${ttTitle}</h1><p>Orientation: ${ttOrient} (premium option unlocked)</p><table><tr><th>Time</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr>${rows}</table><script>window.print()</script></body></html>`)
    w.document.close()
  }

  const updateNode = (root: MindNode, id: string, fn: (n: MindNode) => MindNode): MindNode => {
    if (root.id === id) return fn(root)
    return { ...root, children: root.children.map(c => updateNode(c, id, fn)) }
  }
  const removeNode = (root: MindNode, id: string): MindNode => ({ ...root, children: root.children.filter(c => c.id !== id).map(c => removeNode(c, id)) })
  const setMapRoot = (nextRoot: MindNode) => setMaps(ms => ms.map(m => m.id === map.id ? { ...m, root: nextRoot } : m))
  const addChild = (id: string) => setMapRoot(updateNode(map.root, id, n => ({ ...n, children: [...n.children, { id: uid(), text: 'New node', children: [] }] })))
  const renameNode = (id: string) => { const t = prompt('Node text'); if (t != null) setMapRoot(updateNode(map.root, id, n => ({ ...n, text: t || n.text }))) }
  const deleteNode = (id: string) => { if (id === map.root.id) return; setMapRoot(removeNode(map.root, id)) }
  const exportMap = () => {
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${map.name || 'mindmap'}.json`; a.click()
  }

  const addNote = () => { const n: Note = { id: uid(), title: 'Untitled', body: '', tasks: [] }; setNotes([n, ...notes]); setActiveNote(n.id) }
  const updateNote = (patch: Partial<Note>) => setNotes(ns => ns.map(n => n.id === note.id ? { ...n, ...patch } : n))
  const addTask = () => updateNote({ tasks: [...(note.tasks || []), { id: uid(), text: 'New task', done: false }] })

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const renderNode = (n: MindNode) => (
    <div className="node" key={n.id}>
      <div className="node-head"><strong>{n.text}</strong><span className="row"><button className="secondary" onClick={()=>addChild(n.id)}>+ child</button><button className="secondary" onClick={()=>renameNode(n.id)}>rename</button>{n.id!==map.root.id && <button className="danger" onClick={()=>deleteNode(n.id)}>del</button>}</span></div>
      {n.children.length>0 && <div className="children">{n.children.map(renderNode)}</div>}
    </div>
  )

  return (
    <div className="app">
      <div className="topbar"><div className="brand">Focus <span>Deck</span></div><div className="row"><span className="badge">All features unlocked • Free & open source</span></div></div>
      <div className="layout">
        <aside className="sidebar">
          {([['dashboard','Dashboard'],['timetable','Timetable'],['mindmap','Mind Map'],['focus','Focus'],['notes','Notes']] as [Tab,string][]).map(([k,l]) => (
            <button key={k} className={`navbtn ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </aside>
        <main className="content">
          {tab==='dashboard' && <div className="grid three">
            <div className="card"><h3>Timetable</h3><div className="kpi">{cells.length}</div><p className="muted">filled slots • unlimited export, PDF options unlocked</p><button className="primary" onClick={()=>setTab('timetable')}>Open</button></div>
            <div className="card"><h3>Mind Maps</h3><div className="kpi">{maps.length}</div><p className="muted">maps • all templates/features unlocked</p><button className="primary" onClick={()=>setTab('mindmap')}>Open</button></div>
            <div className="card"><h3>Focus</h3><div className="kpi">{streak}</div><p className="muted">sessions logged • no pro pass needed</p><button className="primary" onClick={()=>setTab('focus')}>Open</button></div>
            <div className="card"><h3>Notes & Tasks</h3><div className="kpi">{notes.length}</div><p className="muted">pages • unlimited, no paywall</p><button className="primary" onClick={()=>setTab('notes')}>Open</button></div>
            <div className="card"><h3>Included categories (from 4-app analysis)</h3><ul className="list"><li>Planner/timetable + unlimited export/share & PDF options (EasyTable premium → free)</li><li>Mind maps with prime-gated-style content unlocked & exports (Nice Mind Map → free)</li><li>Focus timer/sessions/blocklist reminders, no subscription (Regain-style → free)</li><li>Notes/tasks basics, unlimited (Notion-style basics → free)</li><li>No ads, no AI credit caps (local generator/unlimited use)</li></ul></div>
          </div>}

          {tab==='timetable' && <div>
            <div className="card"><h2>Timetable / Planner</h2><p className="muted">All premium options unlocked: unlimited exports/shares, PDF title & orientation, unlimited AI-style generation, no ads.</p>
              <div className="row"><input value={ttTitle} onChange={e=>setTtTitle(e.target.value)} placeholder="Timetable title (PDF)" /><select value={ttOrient} onChange={e=>setTtOrient(e.target.value as any)}><option value="landscape">Landscape (unlocked)</option><option value="portrait">Portrait (unlocked)</option></select><button className="primary" onClick={generateTimetable}>AI Generate (local, unlimited)</button><button className="secondary" onClick={exportTimetable}>Export / Print PDF</button><button className="secondary" onClick={()=>setCells([])}>Clear</button></div>
            </div>
            <div className="card" style={{overflow:'auto'}}><table><thead><tr><th>Time</th>{days.map(d=> <th key={d}>{d}</th>)}</tr></thead><tbody>
              {slots.map(s => <tr key={s}><th>{s}</th>{days.map(d => <td key={d+s}><input style={{width:'100%'}} value={getCell(d,s)} onChange={e=>setCell(d,s,e.target.value)} placeholder="—" /></td>)}</tr>)}
            </tbody></table></div>
          </div>}

          {tab==='mindmap' && <div>
            <div className="card"><h2>Mind Map</h2><p className="muted">Unlimited maps/nodes, all templates/themes unlocked, export free.</p>
              <div className="row"><select value={activeMap} onChange={e=>setActiveMap(e.target.value)}>{maps.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                <button className="secondary" onClick={()=>{const m={id:uid(),name:`Map ${maps.length+1}`,root:{id:uid(),text:'Central Topic',children:[]}}; setMaps([m,...maps]); setActiveMap(m.id)}}>New map</button>
                <button className="secondary" onClick={()=>{const n=prompt('Map name', map?.name||''); if(n&&map) setMaps(ms=>ms.map(x=>x.id===map.id?{...x,name:n}:x))}}>Rename</button>
                <button className="primary" onClick={exportMap}>Export JSON (unlocked)</button>
              </div>
            </div>
            {map && <div className="card">{renderNode(map.root)}</div>}
          </div>}

          {tab==='focus' && <div className="grid two">
            <div className="card"><h2>Focus Timer</h2><p className="muted">No Pro Pass/subscription required. Unlimited sessions.</p>
              <div className="timer">{fmt(seconds)}</div>
              <div className="row" style={{margin:'8px 0'}}><input type="number" min={1} value={focusMin} onChange={e=>{const v=Math.max(1,Number(e.target.value)||1); setFocusMin(v); if(!running) setSeconds(v*60)}} /> <span className="muted">minutes</span></div>
              <div className="row"><button className="primary" onClick={()=>setRunning(r=>!r)}>{running?'Pause':'Start'}</button><button className="secondary" onClick={()=>{setRunning(false); setSeconds(focusMin*60)}}>Reset</button></div>
              <h3 style={{marginTop:12}}>Personal blocklist / focus reminders</h3>
              <div className="row"><input id="bl" placeholder="Add distraction (site/app/activity)" /><button className="secondary" onClick={()=>{const el=document.getElementById('bl') as HTMLInputElement; if(el?.value){setBlocklist(b=>[el.value,...b]); el.value=''}}}>Add</button></div>
              <ul className="list">{blocklist.map((b,i)=><li key={i} className="row" style={{justifyContent:'space-between'}}><span>{b}</span><button className="danger" onClick={()=>setBlocklist(x=>x.filter((_,j)=>j!==i))}>remove</button></li>)}</ul>
            </div>
            <div className="card"><h2>Stats</h2><p><span className="pill">Sessions</span> <strong>{sessions.length}</strong></p><p><span className="pill">Total minutes</span> <strong>{sessions.reduce((a,s)=>a+s.minutes,0)}</strong></p>
              <h3>History</h3><ul className="list">{sessions.slice(0,20).map(s=> <li key={s.id}>{s.at} — {s.minutes} min</li>)}{sessions.length===0 && <li className="muted">No sessions yet.</li>}</ul>
            </div>
          </div>}

          {tab==='notes' && <div className="grid two">
            <div className="card"><h2>Notes & Tasks</h2><p className="muted">Unlimited pages, tasks, and tables. No plan limits.</p>
              <div className="row" style={{marginBottom:8}}><button className="primary" onClick={addNote}>New note</button></div>
              <ul className="list">{notes.map(n=> <li key={n.id}><button className={`navbtn ${n.id===note?.id?'active':''}`} style={{width:'100%'}} onClick={()=>setActiveNote(n.id)}>{n.title||'Untitled'}</button></li>)}</ul>
            </div>
            {note && <div className="card">
              <input style={{width:'100%', fontSize:'1.1rem', fontWeight:700, marginBottom:8}} value={note.title} onChange={e=>updateNote({title:e.target.value})} placeholder="Title" />
              <textarea value={note.body} onChange={e=>updateNote({body:e.target.value})} placeholder="Write notes..." />
              <h3 style={{marginTop:10}}>Tasks</h3>
              <div className="row" style={{marginBottom:8}}><button className="secondary" onClick={addTask}>Add task</button></div>
              <ul className="list">{(note.tasks||[]).map(t=> <li key={t.id} className="row"><input type="checkbox" checked={t.done} onChange={e=>updateNote({tasks: note.tasks.map(x=>x.id===t.id?{...x,done:e.target.checked}:x)})} /><input style={{flex:1}} value={t.text} onChange={e=>updateNote({tasks: note.tasks.map(x=>x.id===t.id?{...x,text:e.target.value}:x)})} /><button className="danger" onClick={()=>updateNote({tasks: note.tasks.filter(x=>x.id!==t.id)})}>x</button></li>)}</ul>
              <h3 style={{marginTop:10}}>Simple table (unlimited)</h3>
              <table><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody><tr><td contentEditable suppressContentEditableWarning>Example</td><td contentEditable suppressContentEditableWarning>Free</td></tr><tr><td contentEditable suppressContentEditableWarning>Exports</td><td contentEditable suppressContentEditableWarning>Unlimited</td></tr></tbody></table>
              <div className="row" style={{marginTop:10}}><button className="danger" onClick={()=>{if(notes.length>1){setNotes(ns=>ns.filter(x=>x.id!==note.id)); setActiveNote('')}}}>Delete note</button></div>
            </div>}
          </div>}
        </main>
      </div>
      <div className="footer">Focus Deck • original open-source app • local-first (browser storage) • no ads, no paywalls. “Premium” capabilities from analyzed app categories are provided here as free features in an independent implementation.</div>
    </div>
  )
}
