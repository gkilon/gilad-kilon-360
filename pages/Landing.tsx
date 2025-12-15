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
        setError("שגיאה בכניסת אורח. ודא חיבור לרשת.");
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
        if (!name || !email || !password || !registrationCode) throw new Error("נא למלא את כל השדות");
        
        await storageService.registerUser(name, email, password, registrationCode);
        navigate('/dashboard');
      } 
      else if (view === 'login') {
        if (!email || !password) throw new Error("נא למלא אימייל וסיסמה");
        await storageService.login(email, password);
        navigate('/dashboard');
      }
      else if (view === 'reset') {
         if (!email || !registrationCode || !password) throw new Error("חסרים פרטים לשיחזור");
         await storageService.resetPassword(email, registrationCode, password);
         setSuccessMsg("הסיסמה עודכנה. אפשר להתחבר.");
         setTimeout(() => setView('login'), 2000);
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      if (err.message.includes("permission-denied")) {
          setError("שגיאת הרשאות שרת (Firestore Rules).");
      } else {
          setError(err.message || 'אירעה שגיאה.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12 relative">
        
        {/* Hero Section */}
        <div className="text-center mb-10 space-y-2">
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight">
                Feedback<span className="font-light text-slate-500">360</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto font-light">
               מערכת חכמה לזיהוי מנופי הצמיחה שלך
            </p>
            <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <span>AI Insights</span>
                <span className="text-slate-300">•</span>
                <span>Anonymous</span>
                <span className="text-slate-300">•</span>
                <span>Encrypted</span>
            </div>
        </div>

        {/* Login/Register Card */}
        <div className="glass-panel w-full max-w-[380px] shadow-card border-t-2 border-t-primary-800 relative z-10">
            
            <div className="mb-6 text-center border-b border-slate-100 pb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                    {view === 'register' ? 'פתיחת חשבון' : view === 'reset' ? 'שחזור גישה' : 'כניסה למערכת'}
                </h2>
            </div>

            <div className="space-y-4">
                
                {view === 'login' && ALLOW_GUEST_MODE && (
                    <button 
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        className="w-full text-xs font-bold text-slate-500 hover:text-primary-800 border border-dashed border-slate-300 hover:border-primary-800 bg-slate-50 py-3 rounded transition-all"
                    >
                        כניסה לאורחים (דמו)
                    </button>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {view === 'register' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">שם מלא</label>
                            <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            placeholder="ישראל ישראלי"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">כתובת אימייל</label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field text-left"
                        dir="ltr"
                        placeholder="name@company.com"
                        />
                    </div>

                    {(view === 'register' || view === 'reset') && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">קוד ארגוני</label>
                            <input
                            type="text"
                            value={registrationCode}
                            onChange={(e) => setRegistrationCode(e.target.value)}
                            className="input-field font-mono text-center tracking-widest bg-slate-50"
                            placeholder="CODE"
                            dir="ltr"
                            />
                        </div>
                    )}

                    <div className={view === 'register' || view === 'reset' ? 'mt-4' : ''}>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                {view === 'reset' ? 'סיסמה חדשה' : 'סיסמה'}
                            </label>
                        <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field text-left"
                        dir="ltr"
                        placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 p-2 rounded border border-red-100 animate-pulse">
                             <p className="text-red-600 text-xs text-center font-bold">{error}</p>
                             {error.includes("הרשאה") && (
                                 <p className="text-[10px] text-red-500 text-center mt-1">
                                     חשוב: יש לשנות את חוקי Firestore ל-allow read, write: if true
                                 </p>
                             )}
                        </div>
                    )}
                    {successMsg && <p className="text-green-600 text-xs bg-green-50 p-2 rounded text-center">{successMsg}</p>}

                    <div className="pt-2">
                        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                            {view === 'register' ? 'הרשמה' : view === 'reset' ? 'אפס סיסמה' : 'התחברות'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-xs">
                {view === 'login' && (
                    <>
                        <button onClick={() => setView('reset')} className="text-slate-400 hover:text-primary-800 transition-colors">
                            שכחתי סיסמה
                        </button>
                        <div className="text-slate-400">
                            לא רשום? <button onClick={() => setView('register')} className="text-primary-800 font-semibold hover:underline">פתח חשבון</button>
                        </div>
                    </>
                )}
                {(view === 'register' || view === 'reset') && (
                    <button onClick={() => setView('login')} className="text-slate-500 hover:text-primary-800 font-medium">
                        חזרה למסך כניסה
                    </button>
                )}
            </div>
        </div>
        
        {/* Prominent Admin Link */}
        <div className="mt-8">
            <Link to="/admin">
                <button className="text-xs font-bold text-slate-300 hover:text-primary-600 border border-transparent hover:border-primary-200 px-4 py-2 rounded-full transition-all">
                    🔒 כניסת מנהל מערכת (Admin)
                </button>
            </Link>
        </div>

      </div>
    </Layout>
  );
};