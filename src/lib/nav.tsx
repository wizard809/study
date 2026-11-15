import type { DestinationId } from '../types';

export const NAV: { id: DestinationId; label: string; icon: string; group: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠', group: 'Main' },
  { id: 'planner', label: 'Planner', icon: '📅', group: 'Main' },
  { id: 'my-learning', label: 'My Learning', icon: '📚', group: 'Main' },
  { id: 'notes', label: 'Notes', icon: '📝', group: 'Knowledge' },
  { id: 'documents', label: 'Documents', icon: '📄', group: 'Knowledge' },
  { id: 'ai-tutor', label: 'AI Tutor', icon: '🤖', group: 'Knowledge' },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏', group: 'Practice' },
  { id: 'mind-maps', label: 'Mind Maps', icon: '🧠', group: 'Practice' },
  { id: 'quiz-centre', label: 'Quiz Centre', icon: '✅', group: 'Practice' },
  { id: 'focus', label: 'Focus', icon: '⏱️', group: 'Productivity' },
  { id: 'exams', label: 'Exams', icon: '🎓', group: 'Productivity' },
  { id: 'analytics', label: 'Analytics', icon: '📊', group: 'Productivity' },
  { id: 'study-groups', label: 'Study Groups', icon: '👥', group: 'Community' },
  { id: 'resource-library', label: 'Resource Library', icon: '🗂️', group: 'Community' },
  { id: 'settings', label: 'Settings', icon: '⚙️', group: 'System' },
];
