import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { storageService } from '../services/storageService';

export const SelfAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const user = storageService.getCurrentUser();

  const handleNext = () => setStep(prev => prev + 1);
  
  const handleFinish = () => {
      // In a real app, save to DB. For now, we simulate saving and go back to dashboard.
      // We could use these answers to refine the Goal context in Gemini later.
      navigate('/dashboard');
  };

  if (!user) {
      navigate('/');
      return null;
  }

  return (
    <Layout>
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <span className="text-xs font-bold text-accent-600 uppercase tracking-widest bg-accent-50 px-3 py-1 rounded-full">
                    שלב 1: איפיון אישי
                </span>
                <h1 className="text-3xl font-black text-slate-900 mt-4 mb-2">הכר את עצמך</h1>
                <p className="text-slate-500">שאלון קצר לחידוד המיקוד האישי שלך לפני קבלת משוב</p>
            </div>

            <div className="glass-panel p-8 md:p-12 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1 bg-slate-100 w-full">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-accent-400 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-slate-800">מהו הערך המוביל שלך?</h2>
                        <div className="grid gap-3">
                            {['מצוינות ומקצועיות', 'חדשנות ויצירתיות', 'אנשים ויחסים', 'הישגיות ותוצאות'].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => { setAnswers({...answers, coreValue: opt}); handleNext(); }}
                                    className="p-4 text-right border-2 border-slate-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all font-medium text-slate-700 hover:text-primary-800"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-slate-800">מה החסם המרכזי שלך כרגע?</h2>
                        <textarea 
                            className="input-field min-h-[120px]" 
                            placeholder="אני מרגיש/ה ש..."
                            onChange={(e) => setAnswers({...answers, barrier: e.target.value})}
                        ></textarea>
                        <Button onClick={handleNext} variant="primary" className="w-full">המשך</Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                            ✨
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">מצוין!</h2>
                        <p className="text-slate-500">
                            התשובות שלך נשמרו. כעת, כשיש לך בהירות גדולה יותר, 
                            זה הזמן להגדיר את מטרת הצמיחה שלך בלוח הבקרה ולאסוף משוב.
                        </p>
                        <Button onClick={handleFinish} variant="primary" className="w-full">
                            עבור ללוח הבקרה
                        </Button>
                    </div>
                )}
            </div>
        </div>
    </Layout>
  );
};