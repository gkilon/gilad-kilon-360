
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

  const handleAnalyze = async () => {
    if (responses.length === 0 || !questions || !user) return;
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const result = await analyzeFeedback(responses, questions, user.name);
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
      <div className="pb-12 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tighter">שלום, <span className="text-accent-700">{user.name}</span></h1>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-slate-500 font-medium text-sm">מרכז התובנות האישי שלך</p>
            </div>
          </div>
          <div className="flex gap-3">
              <Button onClick={copyLink} variant="outline" className="h-10 text-xs">{copied ? 'הקישור הועתק!' : 'הפץ שאלון'}</Button>
              <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="h-10 text-xs">התנתק</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* ANALYSIS RESULTS SECTION */}
            {analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-soft border-t-4 border-t-red-500 border border-slate-100">
                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-4">נקודות עיוורות (Blind Spots)</h4>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{analysis.blindSpots}</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-soft border-t-4 border-t-emerald-500 border border-slate-100">
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">עוצמות שקופות</h4>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{analysis.transparentStrengths}</p>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-premium md:col-span-2 flex flex-col md:flex-row gap-8 items-center text-white">
                        <div className="flex-shrink-0 text-center bg-white/10 p-6 rounded-2xl border border-white/10 min-w-[140px]">
                            <div className="text-5xl font-black text-accent-500 mb-1">{analysis.sentimentAnalysis.score}%</div>
                            <div className="text-[10px] uppercase font-black text-white/40 tracking-widest">Positive Tone</div>
                        </div>
                        <div className="flex-grow">
                            <h4 className="text-sm font-bold text-accent-400 uppercase mb-3 tracking-widest">ניתוח סנטימנט: {analysis.sentimentAnalysis.label}</h4>
                            <p className="text-sm text-slate-300 leading-relaxed font-light">{analysis.sentimentAnalysis.explanation}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* RESPONSES SECTION */}
            {responses.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl">⏳</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">ממתינים למשובים ראשונים</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">ברגע שתשלח את הקישור ותתקבל התשובה הראשונה, נוכל להתחיל להפיק עבורך תובנות.</p>
                    <Button onClick={copyLink} variant="primary" className="h-14 px-10 text-lg shadow-xl">{copied ? 'הקישור הועתק!' : 'העתק קישור להפצה'}</Button>
                </div>
            ) : (
                <div className="space-y-10">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                        <h3 className="font-extrabold text-2xl text-slate-900">משובים גולמיים ({responses.length})</h3>
                    </div>
                    {Object.entries(groupedResponses).map(([rel, items]) => (
                        <div key={rel} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                    {relationshipLabels[rel] || rel}
                                </span>
                                <div className="h-px bg-slate-200 flex-grow"></div>
                            </div>
                            <div className="grid gap-6">
                                {items.map(r => (
                                    <div key={r.id} className="bg-white p-8 rounded-2xl shadow-soft border border-slate-100 hover:border-accent-700/30 transition-all duration-300 group">
                                        <div className="space-y-6">
                                            {Array.isArray(questions) && questions.map((qText, idx) => (
                                                <div key={idx} className={idx > 0 ? "pt-6 border-t border-slate-50" : ""}>
                                                    <span className="text-slate-400 font-bold block text-[10px] mb-2 uppercase tracking-[0.15em] opacity-80">
                                                        {idx + 1}. {qText}
                                                    </span>
                                                    <p className="text-slate-800 text-sm leading-relaxed font-medium">
                                                        {r.answers && r.answers[idx] ? r.answers[idx] : "אין תשובה"}
                                                    </p>
                                                </div>
                                            ))}
                                            {/* Backward compatibility for old responses */}
                                            {(!r.answers || r.answers.length === 0) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div>
                                                        <span className="text-slate-400 font-bold block text-[10px] mb-2 uppercase tracking-[0.15em]">חוזקות:</span>
                                                        <p className="text-slate-800 text-sm font-medium">{(r as any).q1_impact}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 font-bold block text-[10px] mb-2 uppercase tracking-[0.15em]">לשיפור:</span>
                                                        <p className="text-slate-800 text-sm font-medium">{(r as any).q2_untapped}</p>
                                                    </div>
                                                </div>
                                            )}
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
                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-2 bg-accent-700"></div>
                    
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center text-accent-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-5.636l-.707-.707m1.414 14.142l-.707-.707M4.422 4.422l.707.707" /></svg>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">תובנות ה-AI</h2>
                    </div>

                    {analysisError && (
                        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl mb-8 text-sm text-red-600">
                            <p className="font-bold mb-3">{analysisError}</p>
                            <Button onClick={handleAnalyze} variant="outline" className="w-full h-10 border-red-200 text-red-600 hover:bg-red-100">נסה שוב</Button>
                        </div>
                    )}
                    
                    {!analysis ? (
                        <div className="text-center py-4">
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                                המערכת תנתח את כל המשובים שהתקבלו, תזהה דפוסים חוזרים ותפיק עבורך תמונת מצב מדויקת.
                            </p>
                            <Button onClick={handleAnalyze} isLoading={loadingAnalysis} disabled={responses.length === 0} className="w-full h-14 shadow-lg text-lg">
                                בצע ניתוח מעמיק
                            </Button>
                            {responses.length === 0 && <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest">ממתין למשובים</p>}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h4 className="text-[10px] font-black text-accent-700 uppercase mb-3 tracking-[0.2em]">סיכום אבחוני</h4>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{analysis.summary}</p>
                            </div>
                            
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">נושאים מרכזיים</h4>
                                <ul className="space-y-3">
                                    {analysis && Array.isArray(analysis.keyThemes) && (analysis.keyThemes as string[]).map((theme: string, i: number) => (
                                        <li key={i} className="text-xs text-slate-700 flex items-start gap-3 font-bold">
                                            <span className="text-accent-700 mt-1 text-base leading-none">•</span>
                                            {theme}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-accent-700 p-6 rounded-2xl shadow-lg shadow-accent-900/20 text-white">
                                <h4 className="text-[10px] font-black text-white/50 uppercase mb-3 tracking-[0.2em]">עצת זהב לביצוע</h4>
                                <p className="text-sm font-bold leading-relaxed">"{analysis.actionableAdvice}"</p>
                            </div>

                            <div className="pt-6 space-y-3">
                                <Button onClick={handleExport} variant="outline" className="w-full h-12 text-sm font-bold shadow-sm">הורד דוח PDF מלא</Button>
                                <button onClick={handleAnalyze} className="w-full text-[10px] text-slate-400 uppercase font-black hover:text-accent-700 transition-colors tracking-widest">רענן ניתוח נתונים</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-100/50 py-4 px-8 rounded-2xl text-center border border-slate-200/50">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Gemini 2.5 Pro Powered</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
