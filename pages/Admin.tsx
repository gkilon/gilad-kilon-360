import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { QuestionsConfig } from '../types';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [code, setCode] = useState('');
  const [questions, setQuestions] = useState<QuestionsConfig>({q1:'', q2:'', q3:'', q4:''});
  
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
      if (isAuthenticated) {
          loadSettings();
      }
  }, [isAuthenticated]);

  const loadSettings = async () => {
      setLoading(true);
      try {
          const settings = await storageService.getAppSettings();
          setCode(settings.registrationCode);
          setQuestions(settings.questions);
      } catch (e) {
          setMsg('שגיאה בטעינת הגדרות');
      } finally {
          setLoading(false);
      }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      setMsg('סיסמה שגויה');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
        await storageService.updateAppSettings(code, questions);
        setMsg('ההגדרות עודכנו בהצלחה');
    } catch (e) {
        setMsg('שגיאה בעדכון');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12">
         <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">
                ניהול מערכת
            </h1>
        </div>

        <div className="glass-panel w-full max-w-2xl p-8">
            
            {!isAuthenticated ? (
                <form onSubmit={handleLogin} className="space-y-6 max-w-sm mx-auto">
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-xs font-bold text-slate-500 mb-2">סיסמת מנהל</label>
                            <span className="text-[10px] text-accent-400 bg-accent-900/20 px-2 rounded-full h-fit">Default: admin123</span>
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="הזן סיסמה"
                        />
                    </div>
                    
                    <Button type="submit" variant="primary" className="w-full">כניסה</Button>
                    
                    {msg && <p className="text-red-500 text-center text-xs mt-2 font-bold">{msg}</p>}
                    
                    <button onClick={() => navigate('/')} type="button" className="w-full text-center text-xs text-slate-400 mt-4 hover:text-white">
                        חזרה למסך הראשי
                    </button>
                </form>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="bg-accent-900/20 p-3 rounded text-center text-xs text-accent-400 font-bold border border-accent-900/50">
                        מחובר כמנהל ✓
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Column 1: Config */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">הגדרות כלליות</h3>
                            <label className="block text-xs font-bold text-slate-500 mb-2">קוד רישום למערכת (קוד ארגון)</label>
                            <input 
                                type="text" 
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="input-field text-center font-mono text-lg tracking-widest text-accent-400"
                                dir="ltr"
                            />
                        </div>

                        {/* Column 2: Questions */}
                        <div className="md:col-span-2">
                             <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">עריכת שאלון 360</h3>
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-emerald-500 mb-1">שאלה 1 (חוזקות/השפעה)</label>
                                    <input 
                                        type="text" 
                                        value={questions.q1}
                                        onChange={e => setQuestions({...questions, q1: e.target.value})}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-400 mb-1">שאלה 2 (פוטנציאל)</label>
                                    <input 
                                        type="text" 
                                        value={questions.q2}
                                        onChange={e => setQuestions({...questions, q2: e.target.value})}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-rose-400 mb-1">שאלה 3 (חסמים/דפוסים)</label>
                                    <input 
                                        type="text" 
                                        value={questions.q3}
                                        onChange={e => setQuestions({...questions, q3: e.target.value})}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-purple-400 mb-1">שאלה 4 (עתיד/כיוון)</label>
                                    <input 
                                        type="text" 
                                        value={questions.q4}
                                        onChange={e => setQuestions({...questions, q4: e.target.value})}
                                        className="input-field"
                                    />
                                </div>
                             </div>
                        </div>
                    </div>

                    <Button variant="primary" type="submit" isLoading={loading} className="w-full">שמור שינויים</Button>
                    
                    {msg && <p className="text-accent-400 text-center font-bold text-xs">{msg}</p>}
                    
                    <div className="border-t border-slate-700 pt-6 mt-2">
                        <button onClick={() => { setIsAuthenticated(false); navigate('/'); }} type="button" className="w-full text-center text-slate-500 font-bold text-xs hover:text-white">יציאה</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </Layout>
  );
};