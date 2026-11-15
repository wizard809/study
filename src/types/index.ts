export type DestinationId =
  | 'home' | 'planner' | 'my-learning' | 'notes' | 'documents' | 'ai-tutor'
  | 'flashcards' | 'mind-maps' | 'quiz-centre' | 'focus' | 'exams'
  | 'analytics' | 'study-groups' | 'resource-library' | 'settings';

export interface Topic { id: string; title: string; description: string; difficulty: 'beginner'|'intermediate'|'advanced'; status: 'not-started'|'learning'|'completed'|'needs-revision'|'mastered' }
export interface Chapter { id: string; name: string; description: string; topics: Topic[]; completed: boolean }
export interface Subject { id: string; name: string; description: string; color: string; icon: string; chapters: Chapter[]; createdAt: string }
export interface Note { id: string; title: string; body: string; subjectId?: string; chapterId?: string; tags: string[]; updatedAt: string; tasks: {id:string;text:string;done:boolean}[] }
export interface TTEvent { id: string; day: string; slot: string; title: string; subject: string; type: string; completed?: boolean }
export interface MindNode { id: string; text: string; children: MindNode[] }
export interface MindMap { id: string; name: string; subjectId?: string; root: MindNode; updatedAt: string }
export interface FocusSession { id: string; label: string; minutes: number; subject?: string; at: string }
export interface TaskItem { id: string; title: string; done: boolean; due?: string; priority: 'low'|'medium'|'high'; subjectId?: string }
export interface Flashcard { id: string; front: string; back: string; deckId: string; due: string; interval: number; ease: number; reps: number }
export interface Deck { id: string; name: string; subjectId?: string }
export interface Question { id: string; prompt: string; options: string[]; answer: number; topic?: string }
export interface Quiz { id: string; name: string; questions: Question[]; attempts: {id:string; score:number; total:number; at:string}[] }
export interface SyllabusItem { id: string; text: string; status: 'not-started'|'learning'|'completed'|'needs-revision'|'mastered' }
export interface Exam { id: string; name: string; subjectId?: string; date: string; syllabus: SyllabusItem[]; status: string }
export interface ResourceItem { id: string; title: string; type: string; subjectId?: string; note?: string; url?: string; content?: string; fileName?: string; addedAt: string }
export interface StudyGroup { id: string; name: string; description: string; members: number }

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai-compatible' | 'ollama' | 'anthropic' | 'gemini' | 'custom';
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  transport: 'http' | 'sse' | 'stdio';
  command?: string;
  args?: string;
  enabled: boolean;
  notes?: string;
}

export interface AppState {
  subjects: Subject[];
  notes: Note[];
  timetable: TTEvent[];
  mindMaps: MindMap[];
  focusSessions: FocusSession[];
  tasks: TaskItem[];
  decks: Deck[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  exams: Exam[];
  resources: ResourceItem[];
  groups: StudyGroup[];
  blocklist: string[];
  aiProviders: AIProvider[];
  mcpServers: MCPServer[];
  settings: { theme: 'dark'|'light'|'system'; accent: string; name: string; defaultProviderId?: string; dailyFocusGoal?: number; dailyCardsGoal?: number; streak?: number; lastStudyDate?: string };
}
