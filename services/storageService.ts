import { User, FeedbackResponse, FirebaseConfig, RelationshipType, AppSettings, QuestionsConfig } from '../types';
import { firebaseService } from './firebaseService';

// =================================================================
// FIREBASE SETTINGS
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

// Setting the specific questions requested by the user
const DEFAULT_QUESTIONS: QuestionsConfig = {
    q1: "מהו הדבר שהעובד/ת עושה הכי טוב ומהווה את החוזקה המרכזית שלו/ה?",
    q2: "מהו הדבר האחד שאם העובד/ת ישנה או ישפר, זה יקפיץ את הביצועים שלו/ה קדימה?",
    q3: "באילו מצבים היית רוצה לראות אותו/ה לוקח/ת יותר יוזמה או הובלה?",
    q4: "איזו עצה היית נותן/ת לו/ה כדי לממש את הפוטנציאל המקסימלי בשנה הקרובה?"
};

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const storageService = {
  
  init: () => {
    if (firebaseService.isInitialized()) return;
    
    if (FIREBASE_CONFIG.apiKey) {
        firebaseService.init(FIREBASE_CONFIG);
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

  loginWithGoogle: async (): Promise<User> => {
    const user = await firebaseService.signInWithGoogle();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

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

  login: async (email: string, password?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת.");
    const user = await firebaseService.findUserByEmail(email);
    if (user && user.password === password) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    }
    throw new Error("משתמש לא נמצא או סיסמה שגויה.");
  },

  loginAsGuest: async (): Promise<User> => {
     const guestId = generateId();
     const guestUser: User = {
          id: guestId,
          name: 'אורח מערכת', 
          email: `guest_${guestId}@obt.system`,
          createdAt: Date.now()
      };
      await firebaseService.createUser(guestUser);
      localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
      return guestUser;
  },

  registerUser: async (name: string, email: string, password?: string, registrationCode?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת התחברות לשרת הנתונים.");
    if (!registrationCode) throw new Error("נדרש קוד רישום.");
    const appSettings = await storageService.getAppSettings();
    if (registrationCode.toUpperCase() !== appSettings.registrationCode.toUpperCase()) {
         throw new Error("קוד רישום שגוי.");
    }
    const existing = await firebaseService.findUserByEmail(email);
    if (existing) throw new Error("המייל כבר קיים במערכת.");
    const newUser: User = {
      id: generateId(),
      name,
      email,
      password,
      createdAt: Date.now(),
    };
    await firebaseService.createUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  updateUserGoal: async (userId: string, goal: string): Promise<void> => {
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
          localStorage.setItem(USER_KEY, JSON.stringify({ ...currentUser, userGoal: goal }));
      }
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
    await firebaseService.addResponse(newResponse);
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
     return await firebaseService.getResponsesForUser(userId);
  },

  getUserDataById: async (userId: string): Promise<{name: string, userGoal?: string}> => {
    const user = await firebaseService.getUser(userId);
    if (user) return { name: user.name, userGoal: user.userGoal };
    return { name: "משתמש" }; 
  }
};

storageService.init();