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
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'analysis'>('overview');

  useEffect(() => {
    const loadData = async () => {
      const currentUser = storageService.getCurrentUser();
      if (!currentUser) return;
      setUser(currentUser);

      try {
        const [userResponses, settings, existingAnalysis] = await Promise.all([
          storageService.getResponsesForUser(currentUser.id),
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

  const handleAnalyze = async (isIntegrated = false) => {
    if (responses.length === 0 || !questions || !user) return;
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const result = await analyzeFeedback(
          responses, 
          questions, 
          user.name, 
          isIntegrated ? fileData : null,
          isIntegrated ? fileName : null
      );
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
      
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64 = result.split(',')[1];
          setFileData(base64);
      };
      reader.readAsDataURL(file);
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
            </div>
            <div className="flex gap-3 bg-slate-50 p-1.5 rounded-2xl">
               <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-[#8b6e58] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>סקירה</button>
               <button onClick={() => setActiveTab('responses')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'responses' ? 'bg-white text-[#8b6e58] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>משובים ({responses.length})</button>
               {analysis && <button onClick={() => setActiveTab('analysis')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'analysis' ? 'bg-white text-[#8b6e58] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>דוח AI</button>}
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">סה"כ משובים</h3>
                 <p className="text-4xl font-black text-slate-900">{responses.length}</p>
              </div>
              {Object.entries(groupedResponses).map(([rel, resps]) => (
                <div key={rel} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                   <h3 className="text-[10px] font-black text-[#8b6e58] uppercase mb-4 tracking-widest">{rel}</h3>
                   <p className="text-4xl font-black text-slate-900">{resps.length}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* STAGE A: Regular Analysis */}
                <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-soft flex flex-col justify-between">
                    <div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase mb-4 inline-block">שלב א'</span>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">ניתוח 360 סטנדרטי</h2>
                        <p className="text-slate-500 mb-8 text-sm leading-relaxed">ניתוח מעמיק של המשובים שהתקבלו מהקולגות, המנהלים והכפיפים שלך. זיהוי תמות, חוזקות ונקודות לשיפור.</p>
                    </div>
                    <Button 
                        onClick={() => handleAnalyze(false)} 
                        isLoading={loadingAnalysis && !showAdvanced} 
                        disabled={responses.length === 0}
                        className="h-14 w-full rounded-xl bg-slate-900"
                    >
                        הפק ניתוח 360 רגיל
                    </Button>
                </div>

                {/* STAGE B: Integrated Analysis */}
                <div className="bg-[#8b6e58]/5 p-10 rounded-3xl border border-[#8b6e58]/10 shadow-soft">
                    <span className="px-3 py-1 bg-[#8b6e58]/10 text-[#8b6e58] text-[10px] font-black rounded-full uppercase mb-4 inline-block">שלב ב'</span>
                    <h2 className="text-2xl font-black text-slate-900 mb-4">דוח אינטגרטיבי (Pro)</h2>
                    <p className="text-slate-500 mb-6 text-sm leading-relaxed">שילוב של דוחות אבחון חיצוניים (Lumina Spark וכו') עם נתוני ה-360 ליצירת מפה אישיותית ומקצועית שלמה.</p>
                    
                    {!showAdvanced ? (
                        <button onClick={() => setShowAdvanced(true)} className="text-[10px] font-black text-[#8b6e58] underline uppercase tracking-widest">צרף דוח אבחון (PDF) לאינטגרציה +</button>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">בחר קובץ PDF (Lumina Spark / אבחון אחר)</label>
                                <input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={handleSelfAssessmentUpload}
                                    className="text-xs file:bg-[#8b6e58]/10 file:border-0 file:rounded-lg file:px-4 file:py-2 file:text-[#8b6e58] file:font-bold hover:file:bg-[#8b6e58]/20"
                                />
                                {fileName && <p className="mt-4 text-xs font-bold text-[#8b6e58]">✓ קובץ נבחר: {fileName}</p>}
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => handleAnalyze(true)} 
                                    isLoading={loadingAnalysis && showAdvanced}
                                    disabled={!fileData || responses.length === 0}
                                    className="h-14 flex-grow rounded-xl bg-[#8b6e58]"
                                >
                                    הפק דוח אינטגרטיבי מהקובץ
                                </Button>
                                <Button onClick={() => {setShowAdvanced(false); setFileData(null); setFileName(null);}} variant="outline" className="h-14 px-6 rounded-xl border-slate-200 text-slate-400">ביטול</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {analysisError && <p className="text-red-500 text-center font-bold text-sm bg-red-50 p-4 rounded-xl border border-red-100">{analysisError}</p>}
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-2xl font-black text-slate-900">פירוט התשובות שהתקבלו</h2>
            </div>
            {responses.length === 0 ? (
                <div className="p-20 text-center">
                    <p className="text-slate-400 font-bold">טרם התקבלו משובים עבורך.</p>
                </div>
            ) : (
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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{questions[idx] || `שאלה ${idx+1}`}</p>
                            <p className="text-slate-700 font-medium leading-relaxed">{ans}</p>
                        </div>
                        ))}
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && analysis && (
          <div className="animate-fade-in space-y-8" id="analysis-header">
            <div className="bg-slate-900 text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                 <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                 </svg>
              </div>
              <p className="text-[10px] text-[#8b6e58] font-black uppercase tracking-[0.4em] mb-4">AI Insight Report</p>
              <h2 className="text-3xl font-black mb-8 leading-tight max-w-2xl">
                  {analysis.selfVsOthersAnalysis.length > 50 ? "דוח אינטגרטיבי: 360 + אבחון עצמי" : "ניתוח משוב 360 מעלות"}
              </h2>
              
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

            {analysis.selfVsOthersAnalysis && analysis.selfVsOthersAnalysis.length > 10 && (
                <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-soft">
                    <h4 className="text-[10px] font-black text-[#8b6e58] uppercase mb-6 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#8b6e58] rounded-full"></span>
                        אינטגרציית עומק (360 + אבחון)
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
          </div>
        )}
      </div>
    </Layout>
  );
};
