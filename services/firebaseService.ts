import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  limit,
  updateDoc
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User as FirebaseUser } from "firebase/auth";
import { FirebaseConfig, User, FeedbackResponse, QuestionsConfig } from "../types";

// Global instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    // ... init logic (same as before) ...
    if (!config.apiKey || config.apiKey.length === 0) return false;

    try {
      const apps = getApps();
      if (apps.length > 0) {
        app = getApp();
      } else {
        app = initializeApp(config);
      }
      
      db = getFirestore(app);
      auth = getAuth(app);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  isInitialized: () => !!db && !!auth,

  // --- Settings (Config & Questions) ---
  
  getSettings: async (): Promise<{ registrationCode?: string, questions?: QuestionsConfig } | null> => {
      if (!db) return null;
      try {
        const configRef = doc(db, "settings", "config");
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
            return docSnap.data() as any;
        }
        return null;
      } catch (e) {
          console.warn("Fetch settings failed", e);
          return null;
      }
  },

  updateSettings: async (code: string, questions: QuestionsConfig): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    try {
        const configRef = doc(db, "settings", "config");
        await setDoc(configRef, { 
            registrationCode: code,
            questions: questions
        }, { merge: true });
    } catch (e) {
        throw new Error("Failed to update settings");
    }
  },

  // --- User Operations ---

  createUser: async (user: User): Promise<void> => {
    if (!db) throw new Error("System Error: Database not connected.");
    try {
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, user);
    } catch (e: any) {
      if (e.code === 'permission-denied') throw new Error("permission-denied");
      throw new Error("נכשל הרישום לענן.");
    }
  },

  updatePassword: async (userId: string, newPassword: string): Promise<void> => {
    if (!db) throw new Error("Database disconnected");
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { password: newPassword });
    } catch (e) {
        throw new Error("עדכון סיסמה נכשל.");
    }
  },

  updateUserGoal: async (userId: string, goal: string): Promise<void> => {
    if (!db) throw new Error("Database disconnected");
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { userGoal: goal });
    } catch (e) {
        throw new Error("עדכון מטרה נכשל.");
    }
  },

  getUser: async (userId: string): Promise<User | null> => {
    if (!db) return null;
    try {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) return docSnap.data() as User;
      return null;
    } catch (e) { return null; }
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    if (!db) return null;
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      return querySnapshot.docs[0].data() as User;
    } catch (e: any) {
      if (e.code === 'permission-denied') throw new Error("permission-denied");
      throw e;
    }
  },
  
  logout: async (): Promise<void> => {
    if (auth) {
        await signOut(auth);
    }
  },

  // --- Response Operations ---

  addResponse: async (response: FeedbackResponse): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    try {
      const responseRef = doc(db, "responses", response.id);
      await setDoc(responseRef, response);
    } catch (e) {
      throw new Error("Failed to save response to cloud.");
    }
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    if (!db) return [];
    try {
      const responsesRef = collection(db, "responses");
      const q = query(responsesRef, where("surveyId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const responses: FeedbackResponse[] = [];
      querySnapshot.forEach((doc: any) => {
        responses.push(doc.data() as FeedbackResponse);
      });
      
      return responses.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      return [];
    }
  }
};