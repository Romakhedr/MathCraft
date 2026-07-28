// src/types/index.ts
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  level: string;
  created_at: string;
}

export interface MathProblem {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}
