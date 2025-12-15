import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { RelationshipType } from '../types';

export const Survey: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userName, setUserName] = useState<string>('');
  const [userGoal, setUserGoal] = useState<string>('');
  
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
    const checkConnection = async () => {
        setIsLoadingUser(true);
        if (userId) {
            try {
                const userData = await storageService.getUserDataById(userId);
                if (userData && userData.name) {
                    setUserName(userData.name);
                    setUserGoal(userData.userGoal || '');
                } else {
                    setError('הקישור אינו תקין');
                }
            } catch (e) {
                setError('שגיאה בטעינת נתונים');
            }
        }
        setIsLoadingUser(false);
    };
    checkConnection();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSending(true);
    try {
        await storageService.addResponse(userId, relationship, impact, untapped, pattern, future);
        setSubmitted(true);
    } catch (err) {
        setError('שגיאה בשמירה');
    } finally {
        setIsSending(false);
    }
  };

  if (isLoadingUser) {
      return (
          <Layout>
              <div className="flex justify-center items-center h-[50vh]">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
          </Layout>
      );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 text-4xl shadow-glow">
             ✓
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">תודה רבה!</h2>
          <p className="text-slate-500 text-lg max-w-md mb-8">
                המשוב שלך התקבל בהצלחה ועוזר ל-{userName} בתהליך הצמיחה.
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
                <h2 className="text-xl font-bold text-red-500 mb-2">שגיאה</h2>
                <p className="text-slate-500 mb-6">{error}</p>
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
        
        <div className="text-center mb-10">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full">
                משוב 360 אנונימי
            </span>
            <h1 className="text-4xl font-black text-slate-900 mt-4 mb-2">
               עבור {userName}
            </h1>
            <p className="text-slate-500 font-medium">
                דעתך הכנה חשובה לצמיחה האישית.
            </p>
        </div>

        <div className="glass-panel p-8 md:p-10 border-t-4 border-t-primary-600 shadow-xl shadow-primary-500/5">
            
            <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* Introduction - Goal Display (Optional) */}
                {userGoal && (
                    <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-200 relative mb-8">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 shadow-sm">
                             המטרה ש-{userName} שם/ה למיקוד
                         </div>
                         <p className="text-xl font-medium text-slate-900 leading-relaxed mt-2">
                             "{userGoal}"
                         </p>
                    </div>
                )}

                {/* Relationship */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                        מה הקשר שלך ל-{userName}?
                    </label>
                    <div className="relative">
                        <select 
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                            className="input-field"
                        >
                            <option value="peer">קולגה / עמית</option>
                            <option value="manager">מנהל ישיר</option>
                            <option value="subordinate">כפיף / מנוהל</option>
                            <option value="friend">חבר / אחר</option>
                        </select>
                    </div>
                </div>

                {/* Q1 - Impact */}
                <div className="space-y-3">
                    <label className="block text-lg font-bold text-slate-800 leading-relaxed">
                        1. מהם <span className="text-primary-600 bg-primary-50 px-1 rounded">הדברים שאני עושה הכי טוב</span> (מבחינת השפעה ותוצאות), וכיצד זה בא לידי ביטוי?
                    </label>
                    <textarea
                        required
                        value={impact}
                        onChange={(e) => setImpact(e.target.value)}
                        rows={3}
                        className="input-field min-h-[100px] text-base"
                        placeholder="למשל: היכולת לרתום אנשים..."
                    />
                </div>

                {/* Q2 - Untapped Potential */}
                <div className="space-y-3">
                    <label className="block text-lg font-bold text-slate-800 leading-relaxed">
                        2. איזו <span className="text-primary-600 bg-primary-50 px-1 rounded">מיומנות, יכולת או תכונה שלי לא מנוצלת מספיק</span> ויש לה פוטנציאל להשפיע לטובה?
                    </label>
                    <textarea
                        required
                        value={untapped}
                        onChange={(e) => setUntapped(e.target.value)}
                        rows={3}
                        className="input-field min-h-[100px] text-base"
                        placeholder="יש לך יכולת גבוהה ב... שכדאי להביא יותר לידי ביטוי"
                    />
                </div>

                {/* Q3 - Pattern/Blindspot */}
                <div className="space-y-3">
                    <label className="block text-lg font-bold text-slate-800 leading-relaxed">
                        3. מהו <span className="text-primary-600 bg-primary-50 px-1 rounded">הדפוס ההתנהגותי המרכזי שמעכב אותי</span> ושינוי שלו ישפר משמעותית את האפקטיביות שלי?
                    </label>
                    <p className="text-sm text-slate-400 -mt-2 mb-2 italic">(אנא ספק/י דוגמה ממוקדת)</p>
                    <textarea
                        required
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        rows={3}
                        className="input-field min-h-[100px] text-base"
                        placeholder="לפעמים כשאת/ה..."
                    />
                </div>

                {/* Q4 - Future/Career */}
                <div className="space-y-3">
                    <label className="block text-lg font-bold text-slate-800 leading-relaxed">
                        4. באיזה <span className="text-primary-600 bg-primary-50 px-1 rounded">תפקיד או פרויקט עתידי</span> היית רואה אותי מממש/ת את הפוטנציאל שלי בצורה הטובה ביותר?
                    </label>
                    <textarea
                        required
                        value={future}
                        onChange={(e) => setFuture(e.target.value)}
                        rows={3}
                        className="input-field min-h-[100px] text-base"
                        placeholder="נמק/י בקצרה"
                    />
                </div>

                <div className="pt-6">
                    <Button type="submit" variant="primary" isLoading={isSending} className="w-full text-lg py-4 shadow-xl shadow-primary-500/20">
                        שלח משוב
                    </Button>
                    <div className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        מאובטח ואנונימי
                    </div>
                </div>
            </form>
        </div>
      </div>
    </Layout>
  );
};
