import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { RelationshipType, QuestionsConfig } from '../types';

export const Survey: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userName, setUserName] = useState<string>('');
  const [questions, setQuestions] = useState<QuestionsConfig | null>(null);
  
  const [relationship, setRelationship] = useState<RelationshipType>('peer');
  
  // Dynamic answers based on number of questions
  const [answers, setAnswers] = useState<string[]>([]);
  
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const init = async () => {
        setIsLoadingUser(true);
        try {
            // Load Settings for Questions
            const settings = await storageService.getAppSettings();
            const qList = settings.questions;
            setQuestions(qList);
            setAnswers(new Array(qList.length).fill(''));

            // Load User
            if (userId) {
                const userData = await storageService.getUserDataById(userId);
                setUserName(userData?.name || 'משתמש מערכת');
                if (!userData || !userData.name) {
                    console.warn("User name not found for ID:", userId);
                }
            }
        } catch (e) {
            setError('שגיאה בטעינת הנתונים');
        } finally {
            setIsLoadingUser(false);
        }
    };
    init();
  }, [userId]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSending(true);
    try {
        await storageService.addResponse(userId, relationship, answers);
        setSubmitted(true);
    } catch (err) {
        setError('השמירה נכשלה');
    } finally {
        setIsSending(false);
    }
  };

  if (isLoadingUser || !questions) {
      return (
          <Layout>
              <div className="flex justify-center items-center h-[50vh]">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
          </Layout>
      );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="w-20 h-20 bg-accent-50 text-accent-700 rounded-full flex items-center justify-center mb-8 text-4xl shadow-premium border border-accent-100">
             ✓
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">תודה רבה!</h2>
          <p className="text-slate-500 text-lg max-w-md mb-10 font-medium leading-relaxed">
                המשוב שלך נשמר בהצלחה באופן מאובטח ואנונימי, ויעזור ל-{userName} לצמוח.
          </p>
          <Link to="/">
             <Button variant="primary" className="h-14 px-10 shadow-xl">חזרה לדף הבית</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (error) {
      return (
        <Layout>
            <div className="max-w-md mx-auto mt-12 text-center p-12 glass-panel shadow-premium">
                <h2 className="text-xl font-bold text-red-600 mb-4">שגיאה במערכת</h2>
                <p className="text-slate-500 mb-8 font-medium">{error}</p>
                <Link to="/">
                    <Button variant="secondary" className="w-full">חזרה לדף הבית</Button>
                </Link>
            </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full animate-fade-in">
        
        <div className="text-center mb-12">
            <span className="text-[10px] font-black text-accent-700 uppercase tracking-[0.3em] bg-accent-50 px-4 py-2 rounded-full border border-accent-100 shadow-sm">
                Anonymous 360° Feedback
            </span>
            <h1 className="text-4xl font-black text-slate-900 mt-8 mb-4 tracking-tight">
               <span className="text-accent-700">{userName}</span> מבקש/ת ממך משוב
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
                הפרספקטיבה הכנה שלך קריטית להתפתחות המקצועית שלהם. התהליך אנונימי לחלוטין.
            </p>
        </div>

        <div className="glass-panel p-8 md:p-14 border-t-4 border-t-blue-600 shadow-premium">
            
            <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Relationship */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">
                        טיב ההיכרות / יחסים
                    </label>
                    <div className="relative">
                        <select 
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                            className="input-field bg-white"
                        >
                            <option value="peer">קולגה לעבודה</option>
                            <option value="manager">מנהל/ת ישיר/ה</option>
                            <option value="subordinate">כפיף/ה (מנוהל ע"י)</option>
                            <option value="friend">חבר/ה / משפחה</option>
                            <option value="other">אחר</option>
                        </select>
                    </div>
                </div>

                {/* Dynamic Questions */}
                <div className="space-y-10">
                    {questions.map((qText, index) => (
                        <div key={index} className="space-y-4">
                            <label className="block text-xl font-bold text-slate-800 leading-snug">
                                {index + 1}. {qText}
                            </label>
                            <textarea
                                required
                                value={answers[index] || ''}
                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                rows={4}
                                className="input-field min-h-[140px] text-lg font-medium"
                                placeholder="פרט/י כאן את תשובתך..."
                            />
                        </div>
                    ))}
                </div>

                <div className="pt-10 border-t border-slate-100">
                    <Button type="submit" variant="primary" isLoading={isSending} className="w-full text-xl py-6 shadow-xl shadow-blue-900/10">
                        שלח משוב אנונימי
                    </Button>
                    <div className="mt-8 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>
                        Secure & Fully Anonymous
                    </div>
                </div>
            </form>
        </div>
      </div>
    </Layout>
  );
};