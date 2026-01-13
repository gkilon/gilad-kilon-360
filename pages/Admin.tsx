
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
    // THE ADMIN PASSWORD IS: admin123
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setMsg('');
    } else {
      setMsg('סיסמה שגויה. נסה admin123');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
        await storageService.updateAppSettings(code, questions);
        setMsg('ההגדרות עודכנו בהצלחה. הקוד החדש פעיל.');
    } catch (e) {
        setMsg('שגיאה בעדכון ההגדרות.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12">
         <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">ניהול מערכת 360</h1>
            <p className="text-slate-500 text-xs mt-2 font-mono">AUTHORIZED PERSONNEL ONLY</p>
        </div>

        <div className="glass-panel w-full max-w-2xl p-8 border-t-4 border-accent-500">
            {!isAuthenticated ? (
                <form onSubmit={handleLogin} className="space-y-6 max-w-sm mx-auto">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter">ADMIN_ACCESS_KEY</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field text-center font-mono"
                            placeholder="••••••••"
                        />
                    </div>
                    <Button type="submit" variant="primary" className="w-full">כניסה ללוח בקרה</Button>
                    {msg && <p className="text-red-500 text-center text-xs mt-4 font-bold bg-red-900/20 p-2 rounded border border-red-500/20">{msg}</p>}
                    <button onClick={() => navigate('/')} type="button" className="w-full text-center text-xs text-slate-400 mt-6 hover:text-white transition-colors">חזרה לדף הבית</button>
                </form>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="bg-accent-900/20 p-3 rounded text-center text-xs text-accent-400 font-bold border border-accent-500/30 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></span>
                        SESSION_ACTIVE: מחובר כמנהל
                    </div>
                    
                    <div className="grid grid-cols-1 gap-10">
                        <div className="bg-slate-950/40 p-6 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-bold text-accent-500 mb-4 border-b border-slate-800 pb-2 uppercase tracking-widest">בקרת כניסה (קוד הזמנה)</h3>
                            <p className="text-xs text-slate-500 mb-4 italic leading-relaxed">
                                קוד זה נדרש מכל משתמש חדש שמנסה להירשם. שנה אותו כדי לחסום הרשמות חדשות או כדי לתת קוד ייחודי לקבוצה מסוימת.
                            </p>
                            <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">קוד נוכחי</label>
                            <input 
                                type="text" 
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="input-field text-center font-mono text-xl tracking-[0.3em] uppercase text-accent-400 border-accent-500/30 bg-accent-500/5"
                                dir="ltr"
                            />
                        </div>

                        <div>
                             <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-700 pb-2 uppercase tracking-widest">תוכן השאלון</h3>
                             <div className="space-y-4">
                                {['q1', 'q2', 'q3', 'q4'].map((qKey, i) => (
                                    <div key={qKey}>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">שאלה {i+1}</label>
                                        <input 
                                            type="text" 
                                            value={(questions as any)[qKey]}
                                            onChange={e => setQuestions({...questions, [qKey]: e.target.value})}
                                            className="input-field"
                                        />
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <Button variant="primary" type="submit" isLoading={loading} className="w-full py-4 text-lg">שמור ועדכן הגדרות ענן</Button>
                        {msg && <p className={`text-center font-bold text-xs mt-4 ${msg.includes('שגיאה') ? 'text-red-400' : 'text-accent-400'}`}>{msg}</p>}
                    </div>

                    <div className="flex justify-center">
                        <button onClick={() => setIsAuthenticated(false)} type="button" className="text-center text-slate-600 font-bold text-[10px] uppercase hover:text-slate-400 transition-colors">התנתק ממצב ניהול</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </Layout>
  );
};
