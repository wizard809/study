import type { AppState } from '../types';

const KEY = 'fd_state_v2';
export const uid = () => Math.random().toString(36).slice(2, 10);
export const now = () => new Date().toISOString();

export const defaultState: AppState = {
  subjects: [
    { id: uid(), name: 'Physics', description: 'Mechanics & motion', color: '#3b82f6', icon: '⚛️', createdAt: now(), chapters: [
      { id: uid(), name: 'Motion', description: 'Kinematics basics', completed: false, topics: [
        { id: uid(), title: 'Velocity', description: 'Rate of change of position', difficulty: 'beginner', status: 'learning' },
        { id: uid(), title: 'Acceleration', description: 'Rate of change of velocity', difficulty: 'beginner', status: 'not-started' },
      ]}
    ]},
  ],
  notes: [{ id: uid(), title: 'Welcome to Focus Deck', body: 'Start by adding subjects, chapters, and notes. Everything is free and unlocked.', tags: ['getting-started'], updatedAt: now(), tasks: [{id:uid(), text:'Explore all modules from the sidebar', done:false}] }],
  timetable: [],
  mindMaps: [{ id: uid(), name: 'Sample Mind Map', root: { id: uid(), text: 'Central Topic', children: [{id:uid(), text:'Idea A', children:[]},{id:uid(), text:'Idea B', children:[]}] }, updatedAt: now() }],
  focusSessions: [],
  tasks: [{ id: uid(), title: 'Plan this week', done: false, priority: 'medium' }],
  decks: [{ id: uid(), name: 'General' }],
  flashcards: [],
  exams: [],
  blocklist: ['social media', 'random videos'],
  settings: { theme: 'dark', accent: '#3b82f6', name: 'Student' },
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings||{}) } };
  } catch { return defaultState; }
}
export function saveState(s: AppState) { localStorage.setItem(KEY, JSON.stringify(s)); }
