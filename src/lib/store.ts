import type { AppState, Flashcard } from '../types';

const KEY = 'fd_state_v4';
const BACKUP_KEY = 'fd_state_backup_last';
export const SCHEMA_VERSION = 4;
export const uid = () => Math.random().toString(36).slice(2, 10);
export const now = () => new Date().toISOString();
export const today = () => new Date().toISOString().slice(0,10);

export const ensureCard = (c: any): Flashcard => ({
  id: c.id || uid(), front: c.front || '', back: c.back || '', deckId: c.deckId || 'general',
  due: c.due || today(), interval: c.interval ?? 0, ease: c.ease ?? 2.5, reps: c.reps ?? 0,
});

export const defaultState: AppState = {
  subjects: [
    { id: uid(), name: 'Physics', description: 'Mechanics & motion', color: '#3b82f6', icon: '⚛️', createdAt: now(), chapters: [
      { id: uid(), name: 'Motion', description: 'Kinematics basics', completed: false, topics: [
        { id: uid(), title: 'Velocity', description: 'Rate of change of position', difficulty: 'beginner', status: 'learning' },
        { id: uid(), title: 'Acceleration', description: 'Rate of change of velocity', difficulty: 'beginner', status: 'not-started' },
      ]}
    ]},
  ],
  notes: [{ id: uid(), title: 'Welcome to Focus Deck', body: 'All modules are available from the sidebar. Everything is free/unlocked. Data is stored locally.', tags: ['getting-started'], updatedAt: now(), tasks: [{id:uid(), text:'Explore all modules from the sidebar', done:false}] }],
  timetable: [],
  mindMaps: [{ id: uid(), name: 'Sample Mind Map', root: { id: uid(), text: 'Central Topic', children: [{id:uid(), text:'Idea A', children:[]},{id:uid(), text:'Idea B', children:[]}] }, updatedAt: now() }],
  focusSessions: [],
  tasks: [{ id: uid(), title: 'Plan this week', done: false, priority: 'medium' }],
  decks: [{ id: uid(), name: 'General' }],
  flashcards: [],
  quizzes: [],
  exams: [],
  resources: [],
  groups: [],
  blocklist: ['social media', 'random videos'],
  aiProviders: [
    { id: uid(), name: 'Local Ollama', type: 'ollama', baseUrl: 'http://localhost:11434', apiKey: '', model: 'llama3.1', enabled: true },
    { id: uid(), name: 'OpenAI-compatible (custom)', type: 'openai-compatible', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini', enabled: false },
  ],
  mcpServers: [],
  settings: { theme: 'dark', accent: '#3b82f6', name: 'Student', defaultProviderId: undefined, dailyFocusGoal: 30, dailyCardsGoal: 20, streak: 0, lastStudyDate: undefined },
};

function isObject(v: any) { return v && typeof v === 'object' && !Array.isArray(v); }
export function sanitizeState(p: any): AppState {
  const base: any = isObject(p) ? p : {};
  const s: AppState = {
    ...defaultState, ...base,
    subjects: Array.isArray(base.subjects) ? base.subjects : defaultState.subjects,
    notes: Array.isArray(base.notes) ? base.notes : defaultState.notes,
    timetable: Array.isArray(base.timetable) ? base.timetable : defaultState.timetable,
    mindMaps: Array.isArray(base.mindMaps) ? base.mindMaps : defaultState.mindMaps,
    focusSessions: Array.isArray(base.focusSessions) ? base.focusSessions : defaultState.focusSessions,
    tasks: Array.isArray(base.tasks) ? base.tasks : defaultState.tasks,
    decks: Array.isArray(base.decks) ? base.decks : defaultState.decks,
    flashcards: Array.isArray(base.flashcards) ? base.flashcards.map(ensureCard) : defaultState.flashcards,
    quizzes: Array.isArray(base.quizzes) ? base.quizzes : defaultState.quizzes,
    exams: Array.isArray(base.exams) ? base.exams.map((e:any)=> ({...e, syllabus: Array.isArray(e?.syllabus)? e.syllabus : (e?.syllabus ? [{id:uid(), text:String(e.syllabus), status:'not-started'}] : [])})) : defaultState.exams,
    resources: Array.isArray(base.resources) ? base.resources : defaultState.resources,
    groups: Array.isArray(base.groups) ? base.groups : defaultState.groups,
    blocklist: Array.isArray(base.blocklist) ? base.blocklist : defaultState.blocklist,
    aiProviders: Array.isArray(base.aiProviders) && base.aiProviders.length ? base.aiProviders : defaultState.aiProviders,
    mcpServers: Array.isArray(base.mcpServers) ? base.mcpServers : defaultState.mcpServers,
    settings: { ...defaultState.settings, ...(isObject(base.settings) ? base.settings : {}) },
  };
  return s;
}

export function loadState(): AppState {
  const raw = localStorage.getItem(KEY) || localStorage.getItem('fd_state_v3') || localStorage.getItem('fd_state_v2');
  if (!raw) return structuredClone(defaultState);
  try {
    const p = JSON.parse(raw);
    if (!isObject(p)) throw new Error('invalid');
    return sanitizeState(p);
  } catch {
    // Preserve potentially recoverable data without overwriting active key
    try { localStorage.setItem(`fd_state_corrupt_${Date.now()}`, raw); } catch {}
    return structuredClone(defaultState);
  }
}
export function saveState(s: AppState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
export function backupCurrentRaw() {
  try { const raw = localStorage.getItem(KEY); if (raw) localStorage.setItem(BACKUP_KEY, raw); } catch {}
}

export function reviewCard(c: Flashcard, grade: number): Flashcard { // 0-5
  let ease = c.ease + (0.1 - (5-grade)*(0.08 + (5-grade)*0.02));
  if (ease < 1.3) ease = 1.3;
  let reps = c.reps; let interval = c.interval;
  if (grade < 3) { reps = 0; interval = 1; }
  else { reps += 1; interval = reps===1?1: reps===2?6: Math.round(interval*ease); }
  const due = new Date(); due.setDate(due.getDate()+interval);
  return { ...c, ease, reps, interval, due: due.toISOString().slice(0,10) };
}
