
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  userGoal?: string; // The goal defined by the user for the survey context
  createdAt: number;
}

export type RelationshipType = 'manager' | 'peer' | 'subordinate' | 'friend' | 'other';

export interface FeedbackResponse {
  id: string;
  surveyId: string; // Linked to User.id
  relationship: RelationshipType;
  
  // New Question Structure
  q1_strengths: string;   // מה החוזקות המרכזיות
  q2_improvement: string; // מה אם אני אעשה אחרת...
  q3_examples: string;    // דוגמאות

  timestamp: number;
}

export interface AnalysisResult {
  summary: string;
  keyThemes: string[];
  actionableAdvice: string;
  groupAnalysis: Record<string, string>;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export enum AppRoute {
  HOME = '/',
  DASHBOARD = '/dashboard',
  SURVEY = '/survey/:userId',
  ADMIN = '/admin'
}
