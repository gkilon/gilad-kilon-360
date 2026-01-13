import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToWord } from '../services/exportService';
import { User, FeedbackResponse, AnalysisResult, QuestionsConfig } from '../types';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

const relationshipLabels: Record<string, string> = {
  'manager': 'מנהל/ת ישיר/ה',
  'peer': 'קולגה',
  'subordinate': 'כפיף/ה',
  'friend': 'חבר/ה / משפחה',
  'other': 'אחר'
};

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [questions, setQuestions] = useState<QuestionsConfig | null>(null);
  
  const [goal, setGoal] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cloudError, setCloudError] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!storageService.isCloudEnabled()) {
        setCloudError(true);
    }
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }
    setUser(currentUser);
    setGoal(currentUser.userGoal || '');
    
    const loadData = async () => {
        setLoadingData(true);
        try {
            const [data, settings] = await Promise.all([
                storageService.getResponsesForUser(currentUser.id),
                storageService.getAppSettings()
            ]);
            setResponses(data);
            setQuestions(settings.questions);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingData(false);
        }
    };
    loadData();
  }, [navigate]);

  const handleSaveGoal = async () => {
      if (!user) return;
      if (!goal.trim()) return;

      setIsSavingGoal(true);
      try {
          await storageService.updateUserGoal(user.id, goal);
          setUser({ ...user, userGoal: goal });
          setIsEditingGoal(false);
      } catch (e) {
          alert('שגיאה בשמירת המטרה');
      } finally {
          setIsSavingGoal(false);
      }
  };

  const handleAnalyze = async () => {
    if (responses.length === 0 || !questions || !user) return;
    setLoadingAnalysis(true);
    try {
      const result = await analyzeFeedback(responses, questions, user.name, user.userGoal);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert("שגיאה בניתוח הנתונים.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    if (!user) return;
    const baseUrl = window.location.href.split('#')[0];
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const url = `${cleanBase}/#/survey/${user.id}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = () => {
      if(user) exportToWord(user, analysis, responses);
  };

  const groupResponses = (data: FeedbackResponse[]) => {
      const grouped: Record<string, FeedbackResponse[]> = {};
      data.forEach(r => {
          const key = r.relationship || 'other';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(r);
      });
      return grouped;
  };

  if (!user) return null;
  const groupedResponses = groupResponses(responses);

  return (
    <Layout>
      <div className="pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
                שלום, <span className="text-accent-500">{user.name}</span>
            </h1>
            <p className="text-slate-400 font-medium">
                תמונת מצב ותובנות אישיות
            </p>
          </div>
          <div className="flex gap-3">
             <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-xs text-slate-500 hover:text-white">
                יציאה
             </Button>
          </div>
        </div>

        {/* EXTERNAL LINK BUTTON - SLEEK DARK BANNER */}
        <div className="mb-10 bg-slate-900 border border-slate-700 hover:border-accent-500/50 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-accent-500/10 flex items-center justify-center text-accent-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-200 group-hover:text-accent-400 transition-colors">
                        שאלון סגנון תקשורת
                    </h3>
                    <p className="text-slate-500 text-sm">
                        שלב מקדים מומלץ לקבלת הקשר רחב יותר.
                    </p>
                </div>
            </div>
            <a 
                href="https://hilarious-kashata-9aafa2.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 w-full md:w-auto"
            >
                <button className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 rounded text-sm font-bold border border-slate-600 transition-all flex items-center justify-center gap-2">
                    מעבר לשאלון
                    <svg className="w-3 h-3 text-slate-400 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </button>
            </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* GOAL SETTING */}
            <div className="glass-panel">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-[10px] font-bold text-accent-500 uppercase tracking-widest">
                             מטרת צמיחה
                        </h3>
                    </div>
                    {!isEditingGoal && (
                        <button onClick={() => setIsEditingGoal(true)} className="text-slate-500 text-xs hover:text-white transition-colors">
                            עריכה
                        </button>
                    )}
                </div>

                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="input-field w-full min-h-[100px] text-lg bg-slate-900 border-slate-700"
                            placeholder="מהי מטרת הצמיחה או המיקוד שלך לתקופה הקרובה?"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveGoal} isLoading={isSavingGoal} variant="primary" className="py-2 text-xs h-8">שמור</Button>
                            <button onClick={() => { setIsEditingGoal(false); setGoal(user.userGoal || ''); }} className="text-slate-500 text-xs hover:text-white px-4">ביטול</button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2">
                        {goal ? (
                            <p className="text-lg text-slate-200 font-light leading-relaxed">"{goal}"</p>
                        ) : (
                            <p className="text-slate-600 text-sm italic">טרם הוגדרה מטרה ספציפית.</p>
                        )}
                    </div>
                )}
            </div>

            {/* RESPONSES */}
            {responses.length === 0 ? (
              <div className="glass-panel text-center py-16 border-dashed border-slate-700">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl text-slate-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">עדיין לא התקבלו משובים</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">
                    התהליך מתחיל בשיתוף הקישור האישי עם הקולגות.
                </p>
                <Button onClick={copyLink} variant="outline">
                    {copied ? 'הקישור הועתק' : 'העתק קישור למשוב'}
                </Button>
              </div>
            ) : (
              <div className="space-y-8 mt-8">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-lg font-bold text-white">משובים שהתקבלו <span className="text-slate-500 text-sm font-normal ml-2">({responses.length})</span></h3>
                    <Button onClick={copyLink} variant="outline" className="px-3 py-1.5 text-xs h-auto border-slate-700 text-slate-400 hover:text-white hover:border-slate-500">
                        {copied ? 'הועתק' : 'העתק קישור'}
                    </Button>
                </div>

                {Object.entries(groupedResponses).map(([rel, items]) => (
                   <div key={rel}>
                       <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                           <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                           {relationshipLabels[rel] || rel}
                       </h4>
                       
                       <div className="grid gap-6">
                            {items.map((resp) => (
                                <div key={resp.id} className="glass-panel p-6 hover:border-slate-600 transition-colors">
                                    <div className="space-y-6">
                                        
                                        {/* Row 1 */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                                                    {questions ? questions.q1 : 'חוזקות'}
                                                </div>
                                                <p className="text-slate-300 text-sm leading-relaxed">{resp.q1_impact}</p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                                                    {questions ? questions.q2 : 'פוטנציאל'}
                                                </div>
                                                <p className="text-slate-300 text-sm leading-relaxed">{resp.q2_untapped}</p>
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-slate-800"></div>

                                        {/* Row 2 */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">
                                                    {questions ? questions.q3 : 'חסם'}
                                                </div>
                                                <p className="text-slate-300 text-sm leading-relaxed">{resp.q3_pattern}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">
                                                    {questions ? questions.q4 : 'עתיד'}
                                                </div>
                                                <p className="text-slate-300 text-sm leading-relaxed">{resp.q4_future}</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                       </div>
                   </div> 
                ))}
              </div>
            )}
          </div>

          {/* Analysis Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
                 <div className="glass-panel bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 shadow-2xl">
                    <div className="mb-6 border-b border-slate-700/50 pb-4">
                        <h2 className="text-lg font-bold mb-1 flex items-center gap-2 text-white">
                            <span className="text-accent-500">AI</span> Intelligence
                        </h2>
                        <p className="text-slate-500 text-xs">זיהוי דפוסים אוטומטי</p>
                    </div>

                    {!analysis ? (
                        <div className="text-center py-8">
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                המערכת תבצע אינטגרציה של כלל המשובים ותזהה את ה-Superpower והחסם העיקרי שלך.
                            </p>
                            <Button 
                                onClick={handleAnalyze} 
                                disabled={responses.length === 0}
                                isLoading={loadingAnalysis}
                                className="w-full text-sm font-bold"
                            >
                                הפק דוח תובנות
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h4 className="text-[10px] font-bold text-accent-500 uppercase tracking-widest mb-2">סיכום מנהלים</h4>
                                <p className="text-slate-300 text-sm leading-relaxed font-light">{analysis.summary}</p>
                            </div>
                            
                            <div className="bg-slate-950/50 p-4 rounded border border-slate-800">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">תמות מרכזיות</h4>
                                <ul className="space-y-2">
                                    {analysis.keyThemes.map((theme, i) => (
                                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                        <span className="w-1 h-1 rounded-full bg-accent-500 mt-1.5 flex-shrink-0"></span>
                                        {theme}
                                    </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-accent-900/20 border border-accent-500/20 p-4 rounded">
                                <h4 className="text-[10px] font-bold text-accent-400 uppercase tracking-widest mb-2">מיקוד אסטרטגי</h4>
                                <p className="text-sm font-medium text-accent-100 leading-relaxed">"{analysis.actionableAdvice}"</p>
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t border-slate-700">
                                <Button onClick={handleExport} className="w-full bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white text-xs">
                                    הורד דוח מלא (Word)
                                </Button>
                                <button onClick={handleAnalyze} className="text-[10px] text-slate-600 hover:text-slate-400 w-full uppercase tracking-widest transition-colors">
                                רענן ניתוח
                                </button>
                            </div>
                        </div>
                    )}
                 </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};