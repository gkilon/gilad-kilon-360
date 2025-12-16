import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { RelationshipType, QuestionsConfig } from '../types';

export const Survey: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userName, setUserName] = useState<string>('');
  const [userGoal, setUserGoal] = useState<string>('');
  const [questions, setQuestions] = useState<QuestionsConfig | null>(null);
  
  const [relationship, setRelationship] = useState<RelationshipType>('peer');
  
  // New 4 Questions State
  const [impact, setImpact] = useState('');
  const [untapped, setUntapped] = useState('');
  const [pattern, setPattern] = useState('');
  const [future, setFuture] = useState('');
  
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
            setQuestions(settings.questions);

            // Load User
            if (userId) {
                const userData = await storageService.getUserDataById(userId);
                if (userData && userData.name) {
                    setUserName(userData.name);
                    setUserGoal(userData.userGoal || '');
                } else {
                    setError('קישור לא תקין');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSending(true);
    try {
        await storageService.addResponse(userId, relationship, impact, untapped, pattern, future);
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
                 <div className="w-8 h-8 border-4 border-slate-800 border-t-accent-500 rounded-full animate-spin"></div>
              </div>
          </Layout>
      );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-accent-900/20 text-accent-500 rounded-full flex items-center justify-center mb-6 text-4xl shadow-glow border border-accent-500/20">
             ✓
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">תודה רבה!</h2>
          <p className="text-slate-400 text-lg max-w-md mb-8">
                המשוב שלך נשמר בהצלחה באופן מאובטח ואנונימי, ויעזור ל-{userName} לצמוח.
          </p>
          <Link to="/">
             <Button variant="outline">חזרה לדף הבית</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (error) {
      return (
        <Layout>
            <div className="max-w-md mx-auto mt-12 text-center p-8 glass-panel">
                <h2 className="text-xl font-bold text-red-400 mb-2">שגיאה</h2>
                <p className="text-slate-400 mb-6">{error}</p>
                <Link to="/">
                    <Button variant="secondary">חזרה</Button>
                </Link>
            </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full">
        
        <div className="text-center mb-12">
            <span className="text-[10px] font-bold text-accent-500 uppercase tracking-widest border border-accent-500/30 px-3 py-1 rounded-full">
                Anonymous 360° Feedback
            </span>
            <h1 className="text-4xl font-bold text-white mt-6 mb-2">
               <span className="text-accent-500">{userName}</span> מבקש/ת ממך משוב
            </h1>
            <p className="text-slate-400 font-light text-lg">
                הפרספקטיבה הכנה שלך קריטית להתפתחות המקצועית שלהם.
            </p>
        </div>

        <div className="glass-panel p-8 md:p-12 border-t-4 border-t-accent-500 shadow-2xl">
            
            <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Introduction - Goal Display (Optional) */}
                {userGoal && (
                    <div className="bg-slate-900/50 p-6 rounded text-center border border-slate-700 relative mb-8">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-4 py-1 rounded text-[10px] font-bold text-accent-400 uppercase tracking-widest border border-slate-700 shadow-sm">
                             מטרת מיקוד נוכחית
                         </div>
                         <p className="text-xl font-medium text-slate-200 leading-relaxed mt-2 italic">
                             "{userGoal}"
                         </p>
                    </div>
                )}

                {/* Relationship */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
                        טיב ההיכרות / יחסים
                    </label>
                    <div className="relative">
                        <select 
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                            className="input-field"
                        >
                            <option value="peer">קולגה לעבודה</option>
                            <option value="manager">מנהל/ת ישיר/ה</option>
                            <option value="subordinate">כפיף/ה (מנוהל ע"י)</option>
                            <option value="friend">חבר/ה / משפחה</option>
                            <option value="other">אחר</option>
                        </select>
                    </div>
                </div>

                {/* Q1 - Impact */}
                <div className="space-y-4">
                    <label className="block text-lg font-medium text-slate-200 leading-relaxed">
                        1. {questions.q1}
                    </label>
                    <textarea
                        required
                        value={impact}
                        onChange={(e) => setImpact(e.target.value)}
                        rows={3}
                        className="input-field min-h-[120px]"
                        placeholder="פרט/י כאן..."
                    />
                </div>

                {/* Q2 - Untapped Potential */}
                <div className="space-y-4">
                    <label className="block text-lg font-medium text-slate-200 leading-relaxed">
                        2. {questions.q2}
                    </label>
                    <textarea
                        required
                        value={untapped}
                        onChange={(e) => setUntapped(e.target.value)}
                        rows={3}
                        className="input-field min-h-[120px]"
                        placeholder="פרט/י כאן..."
                    />
                </div>

                {/* Q3 - Pattern/Blindspot */}
                <div className="space-y-4">
                    <label className="block text-lg font-medium text-slate-200 leading-relaxed">
                        3. {questions.q3}
                    </label>
                    <p className="text-sm text-slate-500 -mt-2 mb-2 italic">מומלץ לתת דוגמה ספציפית אם אפשר.</p>
                    <textarea
                        required
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        rows={3}
                        className="input-field min-h-[120px]"
                        placeholder="לפעמים כש..."
                    />
                </div>

                {/* Q4 - Future/Career */}
                <div className="space-y-4">
                    <label className="block text-lg font-medium text-slate-200 leading-relaxed">
                        4. {questions.q4}
                    </label>
                    <textarea
                        required
                        value={future}
                        onChange={(e) => setFuture(e.target.value)}
                        rows={3}
                        className="input-field min-h-[120px]"
                        placeholder="פרט/י כאן..."
                    />
                </div>

                <div className="pt-8 border-t border-slate-800">
                    <Button type="submit" variant="primary" isLoading={isSending} className="w-full text-lg py-4 shadow-xl">
                        שלח משוב
                    </Button>
                    <div className="mt-6 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                        Encrypted & Anonymous
                    </div>
                </div>
            </form>
        </div>
      </div>
    </Layout>
  );
};