import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { FeedbackResponse, User, AnalysisResult } from '../types';

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selfAssessmentText, setSelfAssessmentText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'analysis'>('overview');

  useEffect(() => {
    const loadData = async () => {
      const currentUser = storageService.getCurrentUser();
      if (!currentUser) return;
      setUser(currentUser);

      try {
        const [userResponses, settings, existingAnalysis] = await Promise.all([
          storageService.getResponses(currentUser.id),
          storageService.getAppSettings(),
          storageService.getAnalysis(currentUser.id)
        ]);
        setResponses(userResponses);
        setQuestions(settings.questions);
        if (existingAnalysis) setAnalysis(existingAnalysis);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAnalyze = async () => {
    if (responses.length === 0 || !questions || !user) return;
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const result = await analyzeFeedback(responses, questions, user.name, selfAssessmentText);
      setAnalysis(result);
      setActiveTab('analysis');
      storageService.saveAnalysis(user.id, result);
    } catch (error: any) {
      setAnalysisError(error.message || "אירעה שגיאה בניתוח.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleSelfAssessmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = (e) => setSelfAssessmentText(e.target?.result as string);
          reader.readAsText(file);
      } else {
          alert("לניתוח מקסימלי של Lumina Spark, מומלץ להדביק את הטקסט מה-PDF בתיבה למטה.");
      }
  };

  if (loading) return <Layout><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b6e58]"></div></div></Layout>;

  const groupedResponses = responses.reduce((acc, r) => {
    if (!acc[r.relationship]) acc[r.relationship] = [];
    acc[r.relationship].push(r);
    return acc;
  }, {} as Record<string, FeedbackResponse[]>);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 animate-fade-in">
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 shadow-premium mb-8 border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-[10px] text-[#8b6e58] font-black uppercase tracking-[0.4em] mb-2">Growth Dashboard</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">שלום, {user?.name}</h1>
              <p className="text-slate-400 font-medium mt-1">ריכזנו עבורך את כל נתוני המשוב והתובנות האישיות.</p>
            </div>
            <div className="flex gap-3">
               <Button onClick={() => setActiveTab('overview')} variant={activeTab === 'overview' ? 'primary' : 'outline'} className="rounded-xl px-6 h-12">סקירה כללית</Button>
               <Button onClick={() => setActiveTab('responses')} variant={activeTab === 'responses' ? 'primary' : 'outline'} className="rounded-xl px-6 h-12">פירוט תשובות</Button>
               {analysis && <Button onClick={() => setActiveTab('analysis')} variant={activeTab === 'analysis' ? 'primary' : 'outline'} className="rounded-xl px-6 h-12 bg-accent-500">ניתוח AI</Button>}
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">סה"כ משובים</h3>
                 <p className="text-5xl font-black text-slate-900">{responses.length}</p>
              </div>
              {Object.entries(groupedResponses).map(([rel, resps]) => (
                <div key={rel} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                   <h3 className="text-[10px] font-black text-[#8b6e58] uppercase mb-4 tracking-widest">{rel}</h3>
                   <p className="text-5xl font-black text-slate-900">{resps.length}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#8b6e58]/5 rounded-3xl p-10 border border-[#8b6e58]/10">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-black text-slate-900 mb-4">מוכן לניתוח התוצאות?</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">ה-AI שלנו ינתח את כל התשובות, יזהה נקודות עיוורות ויספק לך תוכנית פעולה אישית לצמיחה מקצועית.</p>
                
                <div className="space-y-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <label className="block text-[10px] font-black text-[#8b6e58] uppercase mb-3 tracking-widest">
                            שילוב אבחון עצמי / Lumina Spark (אופציונלי)
                        </label>
                        <div className="flex flex-col gap-4">
                            <input 
                                type="file" 
                                accept=".txt,.pdf"
                                onChange={handleSelfAssessmentUpload}
                                className="text-xs file:bg-[#8b6e58]/10 file:border-0 file:rounded-lg file:px-4 file:py-2 file:text-[#8b6e58] file:font-bold hover:file:bg-[#8b6e58]/20"
                            />
                            <textarea 
                                value={selfAssessmentText}
                                onChange={e => setSelfAssessmentText(e.target.value)}
                                placeholder="הדבק כאן טקסט מתוך Lumina Spark או אבחון עצמי אחר לניתוח משולב..."
                                className="w-full h-32 p-4 text-sm border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#8b6e58]/20 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                <Button 
                  onClick={handleAnalyze} 
                  isLoading={loadingAnalysis} 
                  disabled={responses.length === 0}
                  className="h-16 px-12 text-lg rounded-2xl shadow-xl bg-[#8b6e58]"
                >
                  הפק דוח תובנות AI Pro
                </Button>
                {analysisError && <p className="text-red-500 mt-4 font-bold text-sm">{analysisError}</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-2xl font-black text-slate-900">פירוט התשובות שהתקבלו</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {responses.map((r, i) => (
                <div key={i} className="p-8 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-[#8b6e58]/10 text-[#8b6e58] text-[10px] font-black rounded-full uppercase">{r.relationship}</span>
                    <span className="text-slate-300 text-xs">{new Date(r.timestamp).toLocaleDateString('he-IL')}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {r.answers.map((ans, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{questions[idx]}</p>
                        <p className="text-slate-700 font-medium leading-relaxed">{ans}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && analysis && (
          <div className="animate-fade-in space-y-8" id="analysis-header">
            {/* AI Analysis View */}
            <div className="bg-slate-900 text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                 <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                 </svg>
              </div>
              <p className="text-[10px] text-[#8b6e58] font-black uppercase tracking-[0.4em] mb-4">AI Integration Insights</p>
              <h2 className="text-3xl font-black mb-8 leading-tight max-w-2xl">ניתוח מעמיק ואינטגרציה של המשוב שלך</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div className="space-y-6">
                   <h3 className="text-[10px] font-black text-[#8b6e58] uppercase tracking-widest">סיכום מנהלים</h3>
                   <p className="text-xl text-slate-100 leading-relaxed font-light">{analysis.summary}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                   <h3 className="text-[10px] font-black text-[#8b6e58] uppercase tracking-widest mb-6">תמות מרכזיות</h3>
                   <div className="space-y-4">
                      {analysis.keyThemes.map((theme, i) => (
                        <div key={i} className="flex items-center gap-4">
                           <span className="w-8 h-8 rounded-full bg-[#8b6e58] flex items-center justify-center text-[10px] font-black">{i+1}</span>
                           <p className="text-sm font-medium">{theme}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                  <h3 className="text-[10px] font-black text-[#5d7061] uppercase tracking-widest mb-4">עוצמות שקופות</h3>
                  <p className="text-slate-700 font-medium leading-relaxed">{analysis.transparentStrengths}</p>
               </div>
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                  <h3 className="text-[10px] font-black text-[#9b4d4d] uppercase tracking-widest mb-4">נקודות עיוורות</h3>
                  <p className="text-slate-700 font-medium leading-relaxed">{analysis.blindSpots}</p>
               </div>
            </div>

            {analysis.selfVsOthersAnalysis && (
                <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-soft">
                    <h4 className="text-[10px] font-black text-[#8b6e58] uppercase mb-6 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#8b6e58] rounded-full"></span>
                        תפיסת עצמי מול הסביבה (Lumina Integration)
                    </h4>
                    <p className="text-xl text-slate-800 leading-relaxed font-bold italic">{analysis.selfVsOthersAnalysis}</p>
                </div>
            )}

            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-soft">
               <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-8">המלצות קונקרטיות לפעולה</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                       <span className="text-2xl">🎯</span>
                       <p className="text-sm text-slate-700 font-medium">{rec}</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-[#5d7061]/5 p-8 rounded-3xl border border-[#5d7061]/10 flex flex-col md:flex-row justify-between items-center gap-6">
               <p className="text-slate-700 font-medium">מעוניין להוריד את הדוח המלא כקובץ?</p>
               <Button variant="outline" className="h-12 px-8 rounded-xl border-[#5d7061] text-[#5d7061]">הורד דוח PDF (בקרוב)</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
