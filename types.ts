
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
  
  // The keys remain generic to allow question text changes without breaking DB
  q1_impact: string;        
  q2_untapped: string;      
  q3_pattern: string;       
  q4_future: string;        

  timestamp: number;
}

export interface QuestionsConfig {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

export interface AppSettings {
  registrationCode: string;
  questions: QuestionsConfig;
}

export interface AnalysisResult {
  summary: string;
  keyThemes: string[];
  actionableAdvice: string;
  blindSpots: string;            // NEW: Where user thinks they are great but others disagree
  transparentStrengths: string;   // NEW: Things user does naturally that others value highly
  sentimentAnalysis: {           // NEW: Tone of the feedback
    score: number;               // 0 to 100
    label: string;               // e.g., "Constructive & Warm"
    explanation: string;
  };
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