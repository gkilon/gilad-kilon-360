import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

const ALLOW_GUEST_MODE = false;

export const Landing: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState(''); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    storageService.init();
  }, []);

  const handleGuestLogin = async () => {
      setIsLoading(true);
      try {
        await storageService.loginAsGuest();
        navigate('/dashboard');
      } catch (e) {
        setError("שגיאת רשת בהתחברות כאורח.");
      } finally {
        setIsLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (view === 'register') {
        if (!name || !email || !password || !registrationCode) throw new Error("כל השדות הינם חובה");
        
        await storageService.registerUser(name, email, password, registrationCode);
        navigate('/dashboard');
      } 
      else if (view === 'login') {
        if (!email || !password) throw new Error("נא להזין מייל וסיסמה");
        await storageService.login(email, password);
        navigate('/dashboard');
      }
      else if (view === 'reset') {
         if (!email || !registrationCode || !password) throw new Error("חסרים פרטי שחזור");
         await storageService.resetPassword(email, registrationCode, password);
         setSuccessMsg("הסיסמה עודכנה בהצלחה. נא להתחבר.");
         setTimeout(() => setView('login'), 2000);
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      if (err.message.includes("permission-denied")) {
          setError("אין הרשאה לשרת.");
      } else {
          setError(err.message || 'אירעה שגיאה.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] relative">
        
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6 max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                לממש את <br />
                <span className="text-accent-500">פוטנציאל הצמיחה</span>
            </h1>
            <p className="text-xl text-slate-400 font-light max-w-lg mx-auto leading-relaxed">
               פלטפורמת משוב 360° מבוססת AI למקצוענים.
               זיהוי חסמים, מינוף חוזקות ובניית נתיב קריירה מדויק.
            </p>
        </div>

        {/* Login/Register Card - Dark Minimalist */}
        <div className="w-full max-w-[400px] bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl relative z-10">
            
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                    {view === 'register' ? 'יצירת חשבון' : view === 'reset' ? 'שחזור סיסמה' : 'כניסה למערכת'}
                </h2>
                <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></div>
            </div>

            <div className="space-y-5">
                
                {view === 'login' && ALLOW_GUEST_MODE && (
                    <button 
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        className="w-full text-xs font-bold text-slate-400 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 bg-transparent py-3 rounded transition-all"
                    >
                        כניסת הדגמה (אורח)
                    </button>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {view === 'register' && (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">שם מלא</label>
                            <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            placeholder="דוגמה: ישראל ישראלי"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">כתובת אימייל</label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field text-left font-mono"
                        dir="ltr"
                        placeholder="user@corp.com"
                        />
                    </div>

                    {(view === 'register' || view === 'reset') && (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">קוד ארגון</label>
                            <input
                            type="text"
                            value={registrationCode}
                            onChange={(e) => setRegistrationCode(e.target.value)}
                            className="input-field font-mono text-center tracking-[0.2em] uppercase text-accent-400"
                            placeholder="••••••"
                            dir="ltr"
                            />
                        </div>
                    )}

                    <div className={view === 'register' || view === 'reset' ? 'mt-4' : ''}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
                                {view === 'reset' ? 'סיסמה חדשה' : 'סיסמה'}
                            </label>
                        <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field text-left font-mono"
                        dir="ltr"
                        placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-900/50 p-3 rounded">
                             <p className="text-red-400 text-xs text-center font-medium">{error}</p>
                        </div>
                    )}
                    {successMsg && <p className="text-accent-400 text-xs bg-accent-900/20 border border-accent-900/50 p-3 rounded text-center">{successMsg}</p>}

                    <div className="pt-2">
                        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                            {view === 'register' ? 'הרשמה' : view === 'reset' ? 'עדכן סיסמה' : 'התחבר'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                {view === 'login' && (
                    <>
                         <button onClick={() => setView('register')} className="text-slate-400 hover:text-white transition-colors">
                            אין לך חשבון? הירשם
                        </button>
                        <button onClick={() => setView('reset')} className="text-slate-500 hover:text-slate-300 transition-colors">
                            שכחתי סיסמה
                        </button>
                    </>
                )}
                {(view === 'register' || view === 'reset') && (
                    <button onClick={() => setView('login')} className="w-full text-center text-slate-400 hover:text-white transition-colors">
                        חזרה להתחברות
                    </button>
                )}
            </div>
        </div>
        
        {/* Subtle Admin Link */}
        <div className="mt-12 opacity-30 hover:opacity-100 transition-opacity">
            <Link to="/admin">
                <span className="text-[10px] font-mono text-slate-500">
                    ADMIN_ACCESS_GATEWAY
                </span>
            </Link>
        </div>

      </div>
    </Layout>
  );
};