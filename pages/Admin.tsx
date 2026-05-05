
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { QuestionsConfig, User } from '../types';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [code, setCode] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
      // Check if user is already logged in with Google
      const user = storageService.getCurrentUser();
      setCurrentUser(user);

      if (isAuthenticated) {
          loadSettings();
      }
  }, [isAuthenticated]);

  const loadSettings = async () => {
      setLoading(true);
      try {
          const settings = await storageService.getAppSettings();
          setCode(settings.registrationCode);
          setQuestions(Array.isArray(settings.questions) ? settings.questions : []);
      } catch (e) {
          setMsg('שגיאה בטעינת הגדרות');
      } finally {
          setLoading(false);
      }
  };

  const handleAddQuestion = () => {
      setQuestions([...questions, '']);
  };

  const handleRemoveQuestion = (index: number) => {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
  };

  const handleQuestionChange = (index: number, value: string) => {
      const newQuestions = [...questions];
      newQuestions[index] = value;
      setQuestions(newQuestions);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setMsg('');
    } else {
      setMsg('סיסמה שגויה. נסה admin123');
    }
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      try {
          const user = await storageService.loginWithGoogle();
          setCurrentUser(user);
          if (user.email === 'gkilon@gmail.com') {
              setMsg('מחובר למערכת כ-gkilon@gmail.com');
          } else {
              setMsg(`שים לב: התחברת עם ${user.email}. רק gkilon@gmail.com יכול לשמור שינויים.`);
          }
      } catch (e: any) {
          setMsg('התחברות גוגל נכשלה.');
      } finally {
          setLoading(false);
      }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.email !== 'gkilon@gmail.com') {
        setMsg('שגיאה: עליך להתחבר קודם עם חשבון גוגל של gkilon@gmail.com כדי לשמור.');
        return;
    }

    setLoading(true);
    setMsg('');
    try {
        await storageService.updateAppSettings(code, questions);
        setMsg('ההגדרות עודכנו בהצלחה בענן.');
    } catch (e: any) {
        console.error("Update Error:", e);
        setMsg('שגיאה בעדכון ההגדרות. וודא שאתה מחובר לחשבון הנכון.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
         <div className="text-center mb-10">
            <p className="text-[10px] text-accent-700 font-black uppercase tracking-[0.4em] mb-2">System Administration</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">ניהול והגדרות</h1>
        </div>

        <div className="w-full max-w-3xl glass-panel border-t-4 border-accent-700 shadow-premium">
            {!isAuthenticated ? (
                <div className="space-y-8 max-w-sm mx-auto py-4">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest text-center">הזן קוד מנהל</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-field text-center font-mono text-xl"
                                placeholder="••••••••"
                            />
                        </div>
                        <Button type="submit" variant="primary" className="w-full h-14 shadow-lg">כניסה למערכת</Button>
                    </form>
                    
                    {msg && <p className="text-red-600 text-center text-xs font-bold bg-red-50 p-3 rounded border border-red-100">{msg}</p>}
                    
                    <button onClick={() => navigate('/')} type="button" className="w-full text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">חזרה לדף הבית</button>
                </div>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-10">
                    <div className="bg-accent-50 p-4 rounded-xl text-center text-xs text-accent-700 font-bold border border-accent-100 flex flex-col items-center justify-center gap-2 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-accent-700 rounded-full animate-pulse"></span>
                            SESSION_ACTIVE: מחובר כמנהל מערכת
                        </div>
                        {currentUser ? (
                            <div className="text-[10px] text-slate-500 font-medium">
                                מאומת כחשבון: <span className="text-slate-900 font-bold">{currentUser.email}</span>
                            </div>
                        ) : (
                            <button 
                                type="button" 
                                onClick={handleGoogleLogin}
                                className="mt-2 bg-white text-slate-900 border border-slate-200 px-6 py-2 rounded-lg text-[10px] font-black hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                            >
                                <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg>
                                התחבר עם Google לאישור פעולות
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-10">
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                            <h3 className="text-[10px] font-black text-accent-700 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                בקרת כניסה (קוד הזמנה)
                            </h3>
                            <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                                קוד זה נדרש מכל משתמש חדש שמצטרף למערכת. וודאו שהוא מאובטח.
                            </p>
                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">קוד גישה פעיל</label>
                            <input 
                                type="text" 
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="input-field text-center font-mono text-2xl tracking-[0.4em] uppercase text-accent-700 border-accent-200 bg-white"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-6">
                             <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">מבנה השאלון הדינמי</h3>
                                <button 
                                    type="button" 
                                    onClick={handleAddQuestion}
                                    className="text-[10px] font-black bg-accent-700 hover:bg-accent-800 text-white px-4 py-2 rounded-lg transition-all shadow-md active:scale-95"
                                >
                                    + הוסף שאלה למערכת
                                </button>
                             </div>
                             
                             <div className="space-y-4">
                                {questions.map((qText, index) => (
                                    <div key={index} className="bg-white p-6 rounded-xl border border-slate-100 shadow-soft group hover:border-accent-200 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">שאלה {index + 1}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveQuestion(index)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                        title="מחק שאלה"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                                <textarea 
                                                    value={qText}
                                                    onChange={e => handleQuestionChange(index, e.target.value)}
                                                    className="input-field min-h-[80px] py-3 text-sm font-medium border-slate-200"
                                                    placeholder={`נסח את שאלה ${index + 1}...`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {questions.length === 0 && (
                                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">אין שאלות מוגדרות במערכת</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200">
                        <Button 
                            variant="primary" 
                            type="submit" 
                            isLoading={loading} 
                            disabled={!currentUser || currentUser.email !== 'gkilon@gmail.com'}
                            className="w-full h-16 text-lg shadow-xl shadow-accent-900/10"
                        >
                            שמור ועדכן הגדרות ענן
                        </Button>
                        {msg && <p className={`text-center font-bold text-xs mt-6 p-4 rounded-xl border ${msg.includes('שגיאה') || msg.includes('נכשלה') ? 'text-red-600 bg-red-50 border-red-100' : 'text-accent-700 bg-accent-50 border-accent-100'}`}>{msg}</p>}
                    </div>

                    <div className="flex justify-center pb-4">
                        <button onClick={() => {
                            setIsAuthenticated(false);
                            storageService.logout();
                            setCurrentUser(null);
                        }} type="button" className="text-center text-slate-400 font-bold text-[10px] uppercase hover:text-slate-900 transition-colors tracking-[0.2em]">ניתוק מוחלט של מנהל המערכת</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </Layout>
  );
};
