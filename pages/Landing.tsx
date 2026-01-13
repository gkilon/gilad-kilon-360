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

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await storageService.loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "נכשלה ההתחברות עם גוגל");
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
      setError(err.message || 'אירעה שגיאה.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] relative">
        <div className="text-center mb-12 space-y-6 max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                לממש את <br />
                <span className="text-accent-500">פוטנציאל הצמיחה</span>
            </h1>
            <p className="text-lg text-slate-400 font-light max-w-lg mx-auto leading-relaxed">
               פלטפורמת משוב 360° מאובטחת. זיהוי חסמים, מינוף חוזקות ובניית נתיב קריירה מדויק.
            </p>
        </div>

        <div className="w-full max-w-[400px] bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl relative z-10">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                    {view === 'register' ? 'יצירת חשבון' : view === 'reset' ? 'שחזור סיסמה' : 'כניסה למערכת'}
                </h2>
                <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></div>
            </div>

            <div className="space-y-5">
                {view === 'login' && (
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-lg transition-all shadow-md active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    כניסה עם Google
                  </button>
                )}

                {view === 'login' && (
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px bg-slate-800 flex-grow"></div>
                    <span className="text-[10px] text-slate-600 font-bold uppercase">או</span>
                    <div className="h-px bg-slate-800 flex-grow"></div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {view === 'register' && (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">שם מלא</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="דוגמה: ישראל ישראלי" />
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">כתובת אימייל</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field text-left font-mono" dir="ltr" placeholder="user@corp.com" />
                    </div>
                    {(view === 'register' || view === 'reset') && (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">קוד ארגון</label>
                            <input type="text" value={registrationCode} onChange={(e) => setRegistrationCode(e.target.value)} className="input-field font-mono text-center tracking-[0.2em] uppercase text-accent-400" placeholder="••••••" dir="ltr" />
                        </div>
                    )}
                    <div className={view === 'register' || view === 'reset' ? 'mt-4' : ''}>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
                            {view === 'reset' ? 'סיסמה חדשה' : 'סיסמה'}
                        </label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field text-left font-mono" dir="ltr" placeholder="••••••••" />
                    </div>
                    {error && <p className="text-red-400 text-xs text-center font-medium bg-red-900/20 p-3 rounded">{error}</p>}
                    {successMsg && <p className="text-accent-400 text-xs bg-accent-900/20 p-3 rounded text-center">{successMsg}</p>}
                    <div className="pt-2">
                        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                            {view === 'register' ? 'הרשמה' : view === 'reset' ? 'עדכן סיסמה' : 'התחבר'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                {view === 'login' ? (
                    <>
                        <button onClick={() => setView('register')} className="text-slate-400 hover:text-white transition-colors">אין לך חשבון? הירשם</button>
                        <button onClick={() => setView('reset')} className="text-slate-500 hover:text-slate-300 transition-colors">שכחתי סיסמה</button>
                    </>
                ) : (
                    <button onClick={() => setView('login')} className="w-full text-center text-slate-400 hover:text-white transition-colors">חזרה להתחברות</button>
                )}
            </div>
        </div>
        <div className="mt-12 opacity-30 hover:opacity-100 transition-opacity">
            <Link to="/admin"><span className="text-[10px] font-mono text-slate-500">ADMIN_ACCESS_GATEWAY</span></Link>
        </div>
      </div>
    </Layout>
  );
};