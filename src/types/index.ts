export type DestinationId =
  | 'home' | 'planner' | 'my-learning' | 'notes' | 'documents' | 'ai-tutor'
  | 'flashcards' | 'mind-maps' | 'quiz-centre' | 'focus' | 'exams'
  | 'analytics' | 'study-groups' | 'resource-library' | 'settings';

export interface Subject { id: string; name: string; description: string; color: string; icon: string; chapters: Chapter[]; createdAt: string }
export interface Chapter { id: string; name: string; description: string; topics: Topic[]; completed: boolean }
export interface Topic { id: string; title: string; description: string; difficulty: 'beginner'|'intermediate'|'advanced'; status: 'not-started'|'learning'|'completed'|'needs-revision'|'mastered' }
export interface Note { id: string; title: string; body: string; subjectId?: string; chapterId?: string; tags: string[]; updatedAt: string; tasks: {id:string;text:string;done:boolean}[] }
export interface TTEvent { id: string; day: string; slot: string; title: string; subject: string; type: string }
export interface MindNode { id: string; text: string; children: MindNode[] }
export interface MindMap { id: string; name: string; subjectId?: string; root: MindNode; updatedAt: string }
export interface FocusSession { id: string; label: string; minutes: number; subject?: string; at: string }
export interface TaskItem { id: string; title: string; done: boolean; due?: string; priority: 'low'|'medium'|'high'; subjectId?: string }
export interface Flashcard { id: string; front: string; back: string; deckId: string }
export interface Deck { id: string; name: string; subjectId?: string }
export interface Exam { id: string; name: string; subjectId?: string; date: string; syllabus: string; status: string }

export interface AppState {
  subjects: Subject[];
  notes: Note[];
  timetable: TTEvent[];
  mindMaps: MindMap[];
  focusSessions: FocusSession[];
  tasks: TaskItem[];
  decks: Deck[];
  flashcards: Flashcard[];
  exams: Exam[];
  blocklist: string[];
  settings: { theme: 'dark'|'light'|'system'; accent: string; name: string };
}
