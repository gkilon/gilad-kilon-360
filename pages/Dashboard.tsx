
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToPDF } from '../services/exportService';
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
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
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
    setAnalysisError(null);
    try {
      const result = await analyzeFeedback(responses, questions, user.name, user.userGoal);
      setAnalysis(result);
    } catch (error: any) {
      setAnalysisError(error.message || "אירעה שגיאה בנתונים.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    if (!user) return;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/#/survey/${user.id}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = () => {
      if(user) exportToPDF(user, analysis, responses);
  };

  if (loadingData) return <Layout><div className="flex justify-center py-20 animate-pulse text-accent-500 font-bold">טוען נתונים...</div></Layout>;
  if (!user) return null;

  const groupedResponses = responses.reduce((acc, r) => {
    const key = r.relationship || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, FeedbackResponse[]>);

  return (
    <Layout>
      <div className="pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">שלום, <span className="text-accent-500">{user.name}</span></h1>
            <p className="text-slate-400">לוח בקרה אישי 360°</p>
          </div>
          <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-xs">יציאה</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* GOAL SECTION */}
            <div className="glass-panel relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 blur-3xl rounded-full"></div>
                <div className="flex justify-between mb-4">
                    <h3 className="text-[10px] font-bold text-accent-500 uppercase tracking-widest">מטרת צמיחה</h3>
                    <button onClick={() => setIsEditingGoal(true)} className="text-slate-500 text-xs hover:text-white">ערוך</button>
                </div>
                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="input-field min-h-[100px]" placeholder="מה היעד שלך?" />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveGoal} isLoading={isSavingGoal} className="h-8 py-0 px-4">שמור</Button>
                            <button onClick={() => setIsEditingGoal(false)} className="text-xs text-slate-500">ביטול</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xl text-slate-100 font-light italic leading-relaxed">{goal || "טרם הוגדרה מטרה"}</p>
                )}
            </div>

            {/* ANALYSIS RESULTS SECTION */}
            {analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="glass-panel border-l-4 border-l-rose-500">
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">נקודות עיוורות (Blind Spots)</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{analysis.blindSpots}</p>
                    </div>
                    <div className="glass-panel border-l-4 border-l-emerald-500">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">עוצמות שקופות</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{analysis.transparentStrengths}</p>
                    </div>
                    <div className="glass-panel md:col-span-2 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-shrink-0 text-center">
                            <div className="text-4xl font-black text-accent-500 mb-1">{analysis.sentimentAnalysis.score}%</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">סנטימנט חיובי</div>
                        </div>
                        <div className="flex-grow">
                            <h4 className="text-xs font-bold text-accent-400 uppercase mb-2">ניתוח סנטימנט: {analysis.sentimentAnalysis.label}</h4>
                            <p className="text-xs text-slate-400 italic">{analysis.sentimentAnalysis.explanation}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* RESPONSES SECTION */}
            {responses.length === 0 ? (
                <div className="glass-panel text-center py-24 border-dashed border-slate-700">
                    <div className="text-4xl mb-4">⏳</div>
                    <h3 className="text-xl font-bold mb-4">ממתינים למשובים ראשונים</h3>
                    <Button onClick={copyLink} variant="outline">{copied ? 'הועתק!' : 'העתק קישור להפצה'}</Button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                        <h3 className="font-bold text-lg">משובים גולמיים ({responses.length})</h3>
                        <Button onClick={copyLink} variant="outline" className="text-xs h-9">{copied ? 'הועתק' : 'העתק קישור'}</Button>
                    </div>
                    {Object.entries(groupedResponses).map(([rel, items]) => (
                        <div key={rel} className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-accent-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]"></span>
                                {relationshipLabels[rel] || rel}
                            </h4>
                            <div className="grid gap-4">
                                {items.map(r => (
                                    <div key={r.id} className="glass-panel p-6 text-sm space-y-4 hover:border-slate-600 transition-colors group">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><span className="text-accent-500 font-bold block text-[10px] mb-2 uppercase tracking-wide opacity-70">חוזקות וערך:</span> {r.q1_impact}</div>
                                            <div><span className="text-blue-400 font-bold block text-[10px] mb-2 uppercase tracking-wide opacity-70">פוטנציאל לשיפור:</span> {r.q2_untapped}</div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
                                            <div><span className="text-rose-400 font-bold block text-[10px] mb-2 uppercase tracking-wide opacity-70">יוזמה והובלה:</span> {r.q3_pattern}</div>
                                            <div><span className="text-purple-400 font-bold block text-[10px] mb-2 uppercase tracking-wide opacity-70">עצה לעתיד:</span> {r.q4_future}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* SIDEBAR ANALYSIS */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
                <div className="glass-panel bg-gradient-to-br from-slate-850 to-slate-900 border-accent-500/20 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                        <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
                            <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                        </div>
                        <h2 className="text-lg font-bold">תובנות פסיכולוגיות</h2>
                    </div>

                    {analysisError && (
                        <div className="bg-red-950/30 border border-red-500/40 p-4 rounded mb-6 text-xs text-red-300">
                            {analysisError}
                            <Button onClick={handleAnalyze} variant="outline" className="w-full mt-4 h-8 border-red-500/30 text-red-400">נסה שוב</Button>
                        </div>
                    )}
                    
                    {!analysis ? (
                        <div className="text-center py-6">
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                המערכת תבצע ניתוח מעמיק של הטון, הדפוסים והמיקוד המקצועי שלך.
                            </p>
                            <Button onClick={handleAnalyze} isLoading={loadingAnalysis} disabled={responses.length === 0} className="w-full">
                                בצע ניתוח עומק (AI)
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h4 className="text-[10px] font-bold text-accent-500 uppercase mb-2 tracking-widest">סיכום הניתוח</h4>
                                <p className="text-sm text-slate-300 leading-relaxed font-light">{analysis.summary}</p>
                            </div>
                            
                            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                <h4 className="text-[10px] font-bold text-accent-400 uppercase mb-3 tracking-widest">נושאים מרכזיים</h4>
                                <ul className="space-y-2">
                                    {/* FIX: Properly checking that keyThemes is an array before mapping */}
                                    {analysis && Array.isArray(analysis.keyThemes) && (analysis.keyThemes as string[]).map((theme: string, i: number) => (
                                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2 italic">
                                            <span className="text-accent-500 mt-1">•</span>
                                            {theme}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-accent-500/10 p-5 rounded-xl border border-accent-500/30">
                                <h4 className="text-[10px] font-bold text-accent-400 uppercase mb-2">עצת זהב למימוש</h4>
                                <p className="text-sm font-medium text-slate-100 italic leading-relaxed">"{analysis.actionableAdvice}"</p>
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button onClick={handleExport} variant="outline" className="w-full text-xs h-11">הפק דוח PDF מלא</Button>
                                <button onClick={handleAnalyze} className="w-full text-[10px] text-slate-600 uppercase font-bold hover:text-accent-500 transition-colors">רענן ניתוח</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-panel py-6 px-8 text-center bg-slate-900/30">
                    <p className="text-xs text-slate-500 font-medium">המערכת מאובטחת ומבוססת Gemini 3.0</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
