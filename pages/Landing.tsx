import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export const Landing: React.FC = () => {
  const [step, setStep] = useState<'invite' | 'auth'>('invite');
  const [inviteCode, setInviteCode] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    storageService.init();
    const user = storageService.getCurrentUser();
    if (user) navigate('/dashboard');
  }, [navigate]);

  const handleVerifyInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const settings = await storageService.getAppSettings();
      if (inviteCode.toUpperCase() === settings.registrationCode.toUpperCase()) {
        setStep('auth');
      } else {
        setError('קוד הזמנה שגוי. הגישה חסומה.');
      }
    } catch (err) {
      setError('שגיאת תקשורת עם השרת.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isNewUser) {
        if (!name) throw new Error("נא להזין שם מלא להשלמת ההרשמה");
        await storageService.registerUser(name, email, password, inviteCode);
        navigate('/dashboard');
      } else {
        await storageService.login(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message.includes("לא נמצא") && !isNewUser) {
        setIsNewUser(true);
        setError("חשבון לא קיים. בוא ניצור לך אחד! הזן שם מלא:");
      } else {
        setError(err.message || 'אירעה שגיאה.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center py-20 px-6 relative overflow-hidden bg-slate-50">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        {step === 'invite' && (
          <div className="w-full max-w-6xl mb-24 animate-fade-in relative z-10">
            <div className="text-center mb-20 space-y-8">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                 <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Insight Intelligence Engine</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1.05] tracking-tight">
                צמיחה מבוססת <br/> 
                <span className="text-blue-600">פרספקטיבה</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
                תהליך משוב 360 מעלות חכם, המעניק תובנות עמוקות <br className="hidden md:block"/> לצמיחה מקצועית מבוססת נתונים ו-AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border border-slate-200 p-12 text-center group rounded-3xl shadow-soft">
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl mb-8 mx-auto">1</div>
                <h3 className="font-bold text-2xl text-slate-900 mb-4">הזנת קוד גישה</h3>
                <p className="text-slate-600 text-base leading-relaxed">מתחילים בהזנת הקוד שקיבלתם מגלעד. זהו המפתח שלכם לכניסה למערכת.</p>
              </div>
              <div className="bg-white border border-slate-200 p-12 text-center group rounded-3xl shadow-soft">
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl mb-8 mx-auto">2</div>
                <h3 className="font-bold text-2xl text-slate-900 mb-4">קבלת קישור אישי</h3>
                <p className="text-slate-600 text-base leading-relaxed">לאחר הרישום, תקבלו קישור ייחודי. העתיקו אותו ושלחו אותו למשיבים הרלוונטיים.</p>
              </div>
              <div className="bg-white border border-slate-200 p-12 text-center group rounded-3xl shadow-soft">
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl mb-8 mx-auto">3</div>
                <h3 className="font-bold text-2xl text-slate-900 mb-4">ניתוח ותובנות</h3>
                <p className="text-slate-600 text-base leading-relaxed">כשהמשובים יצטברו, ה-AI ינתח את הנתונים ויציג דוח מפורט על נקודות החוזק והצמיחה.</p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-[440px] bg-white border border-slate-200 p-10 relative z-10 border-t-4 border-blue-600 rounded-3xl shadow-premium">
            <div className="text-center mb-10">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.5em] mb-3">Professional Portal</p>
                <h2 className="text-3xl font-black text-slate-900">בואו נתחיל</h2>
            </div>
            
            {step === 'invite' ? (
                <form onSubmit={handleVerifyInvite} className="space-y-8">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-4 tracking-widest text-center">הזן קוד הזמנה</label>
                        <input 
                            type="text" 
                            required
                            autoFocus
                            value={inviteCode} 
                            onChange={(e) => setInviteCode(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center font-mono text-3xl tracking-[0.4em] uppercase focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-slate-900" 
                            placeholder="CODE" 
                            dir="ltr" 
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs text-center font-bold bg-red-500/5 p-4 rounded-xl border border-red-500/20">{error}</p>}
                    <button type="submit" className="btn-premium w-full h-14" disabled={isLoading}>
                        {isLoading ? 'מאמת...' : 'אימות והמשך'}
                    </button>
                </form>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-4 bg-white hover:bg-slate-50 text-black font-black py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-95"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        התחברות עם Google
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="h-px bg-slate-200 flex-grow"></div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">או דרך המערכת</span>
                        <div className="h-px bg-slate-200 flex-grow"></div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-5">
                        {isNewUser && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">שם מלא</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 outline-none focus:border-blue-600" placeholder="ישראל ישראלי" required />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">כתובת אימייל</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-mono outline-none focus:border-blue-600" dir="ltr" placeholder="email@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">סיסמה</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-mono outline-none focus:border-blue-600" dir="ltr" placeholder="••••••••" required />
                        </div>
                        {error && <p className="text-red-500 text-xs text-center font-bold bg-red-500/5 p-4 rounded-xl border border-red-500/20">{error}</p>}
                        <button type="submit" className="btn-premium w-full h-14" disabled={isLoading}>
                            {isNewUser ? 'הרשמה וכניסה' : 'כניסה'}
                        </button>

                        <div className="text-center pt-2">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsNewUser(!isNewUser);
                                    setError('');
                                }}
                                className="text-[11px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest transition-colors"
                            >
                                {isNewUser ? 'כבר יש לך חשבון? להתחברות' : 'עדיין אין לך חשבון? להרשמה'}
                            </button>
                        </div>

                        <button type="button" onClick={() => setStep('invite')} className="w-full text-center text-[10px] text-slate-500 uppercase mt-4 hover:text-white transition-colors font-bold tracking-widest">חזרה לשלב הקודם</button>

                    </form>
                </div>
            )}
        </div>
        <button onClick={() => navigate('/admin')} className="mt-20 text-[10px] text-slate-600 uppercase tracking-[0.5em] hover:text-blue-500 transition-colors font-bold">Registry Console</button>
      </div>
    </Layout>
  );
};
