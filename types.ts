export enum Subject {
  CZECH = 'Čeština',
  MATH = 'Matematika'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN = 'FILL_IN'
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // For multiple choice
  correctAnswer: string; // Or index as string
  explanation: string;
  hint?: string; // Subtle clue
}

export interface Lesson {
  id: string;
  title: string;
  subject: Subject;
  topic: string; // Used for prompt generation
  isCompleted: boolean;
  isLocked: boolean;
  stars: number; // 0-3
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserStats {
  totalQuestions: number;
  totalCorrect: number;
  czechXp: number;
  mathXp: number;
  lessonsCompleted: number;
  topicCounts: Record<string, number>;
}

export interface Inventory {
  doubleXpPotions: number;
}

export type PowerUpType = 'DOUBLE_XP';

export interface UserState {
  username: string; // Added for Auth
  createdAt: number; // Timestamp
  hearts: number;
  xp: number;
  streak: number;
  currentSubject: Subject;
  completedLessons: string[]; // IDs
  stats: UserStats;
  avatar: string; // Avatar ID
  badges: string[]; // Array of unlocked Badge IDs
  theme: 'light' | 'warm' | 'dark';
  weeklyGoal: number; // XP Target
  weeklyProgress: number; // XP Earned this week
  inventory: Inventory;
  activePowerUp: PowerUpType | null;
}