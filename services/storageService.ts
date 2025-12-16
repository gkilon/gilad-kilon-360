import { User, FeedbackResponse, FirebaseConfig, RelationshipType, AppSettings, QuestionsConfig } from '../types';
import { firebaseService } from './firebaseService';

// =================================================================
// הגדרות FIREBASE (ממשתני סביבה)
// =================================================================

const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
}; 

// =================================================================

const USER_KEY = '360_user_session';
const DEFAULT_QUESTIONS: QuestionsConfig = {
    q1: "מהם הדברים שהעובד/ת עושה הכי טוב (השפעה ותוצאות)?",
    q2: "איזו מיומנות או תכונה אינה מנוצלת מספיק (פוטנציאל לא מנומש)?",
    q3: "מהו הדפוס ההתנהגותי שמעכב את ההתקדמות וכדאי לשנות?",
    q4: "באיזה תפקיד או כיוון עתידי הפוטנציאל יבוא לידי ביטוי מקסימלי?"
};

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const storageService = {
  
  init: () => {
    if (firebaseService.isInitialized()) return;
    
    if (FIREBASE_CONFIG.apiKey) {
        console.log("Initializing Cloud Storage...");
        const success = firebaseService.init(FIREBASE_CONFIG);
        if (!success) console.error("Critical: Failed to connect to Firebase.");
    } else {
        console.warn("Missing Firebase Configuration Keys.");
    }
  },

  isCloudEnabled: () => firebaseService.isInitialized(),

  getCurrentUser: (): User | null => {
    try {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
  },

  // CONFIG & QUESTIONS
  getAppSettings: async (): Promise<AppSettings> => {
      const settings = await firebaseService.getSettings();
      return {
          registrationCode: settings?.registrationCode || 'OBT-VIP',
          questions: settings?.questions || DEFAULT_QUESTIONS
      };
  },

  updateAppSettings: async (code: string, questions: QuestionsConfig): Promise<void> => {
      await firebaseService.updateSettings(code, questions);
  },

  // LOGIN
  login: async (email: string, password?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת.");

    const user = await firebaseService.findUserByEmail(email);
    
    if (user && user.password === password) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    }
    throw new Error("משתמש לא נמצא או סיסמה שגויה.");
  },

  // GUEST LOGIN (REAL DB ENTRY)
  loginAsGuest: async (): Promise<User> => {
     const guestId = generateId();
     const guestUser: User = {
          id: guestId,
          name: 'אורח מערכת', 
          email: `guest_${guestId}@obt.system`,
          createdAt: Date.now()
      };

      // Must save to cloud to allow linking later
      await firebaseService.createUser(guestUser);
      
      localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
      return guestUser;
  },

  // REGISTER (REAL DB ENTRY)
  registerUser: async (name: string, email: string, password?: string, registrationCode?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת התחברות לשרת הנתונים.");
    
    if (!registrationCode) throw new Error("נדרש קוד רישום.");
    
    // Validate Code against Cloud
    const appSettings = await storageService.getAppSettings();
    const validCode = appSettings.registrationCode;
    
    if (registrationCode.toUpperCase() !== validCode.toUpperCase()) {
         throw new Error("קוד רישום שגוי.");
    }
    
    // Check if exists
    const existing = await firebaseService.findUserByEmail(email);
    if (existing) throw new Error("המייל כבר קיים במערכת.");

    const newUser: User = {
      id: generateId(),
      name,
      email,
      password,
      createdAt: Date.now(),
    };

    // SAVE TO CLOUD (Strict)
    try {
        await firebaseService.createUser(newUser);
    } catch (e: any) {
        console.error("Cloud Save Error:", e);
        if (e.message.includes("permission-denied") || e.message.includes("הרשאה")) {
            throw new Error("שגיאת הרשאות בשרת (Firestore Rules). נא לעדכן את חוקי האבטחה בקונסולת Firebase.");
        }
        throw new Error("שגיאה בשמירת הנתונים בענן.");
    }
    
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  updateUserGoal: async (userId: string, goal: string): Promise<void> => {
      // Optimistic update
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
          const updatedUser = { ...currentUser, userGoal: goal };
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }
      // Real update
      await firebaseService.updateUserGoal(userId, goal);
  },

  resetPassword: async (email: string, registrationCode: string, newPassword: string): Promise<void> => {
    const appSettings = await storageService.getAppSettings();
    if (registrationCode.toUpperCase() !== appSettings.registrationCode.toUpperCase()) {
        throw new Error("קוד שגוי.");
    }
    const user = await firebaseService.findUserByEmail(email);
    if (!user) throw new Error("משתמש לא נמצא.");
    await firebaseService.updatePassword(user.id, newPassword);
  },

  logout: async () => {
    if (storageService.isCloudEnabled()) {
        await firebaseService.logout();
    }
    localStorage.removeItem(USER_KEY);
  },

  // RESPONSE (REAL DB ENTRY)
  addResponse: async (surveyId: string, relationship: RelationshipType, impact: string, untapped: string, pattern: string, future: string) => {
    const newResponse: FeedbackResponse = {
      id: generateId(),
      surveyId,
      relationship,
      q1_impact: impact,
      q2_untapped: untapped,
      q3_pattern: pattern,
      q4_future: future,
      timestamp: Date.now(),
    };

    try {
        await firebaseService.addResponse(newResponse);
    } catch (e: any) {
        if (e.message.includes("permission-denied")) {
             throw new Error("שגיאת הרשאות בשרת: לא ניתן לשמור את המשוב. בדוק את ה-Firestore Rules.");
        }
        throw e;
    }
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
     return await firebaseService.getResponsesForUser(userId);
  },

  getUserDataById: async (userId: string): Promise<{name: string, userGoal?: string}> => {
    const user = await firebaseService.getUser(userId);
    if (user) return { name: user.name, userGoal: user.userGoal };
    
    // Fallback only for current session if cloud fail/delay
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.id === userId) return { name: currentUser.name, userGoal: currentUser.userGoal };
    
    return { name: "משתמש" }; 
  }
};

storageService.init();