
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

  const [activeTab, setActiveTab] = useState<'analysis' | 'raw'>('analysis');
  const [selfAssessmentText, setSelfAssessmentText] = useState('');

  const handleAnalyze = async () => {
    if (responses.length === 0 || !questions || !user) return;
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const result = await analyzeFeedback(responses, questions, user.name, selfAssessmentText);
      setAnalysis(result);
      setActiveTab('analysis');
      
      // Persist analysis to cloud
      if (user) {
          storageService.saveAnalysis(user.id, result);
      }
    } catch (error: any) {
      setAnalysisError(error.message || "אירעה שגיאה בנתונים.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (analysis) {
        const el = document.getElementById('analysis-header');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
  }, [analysis]);

  const handleSelfAssessmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Simple text file reader for now. PDF parsing would require a library.
      if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = (e) => setSelfAssessmentText(e.target?.result as string);
          reader.readAsText(file);
      } else {
          // If it's a PDF, we'd ideally extract text here.
          setSelfAssessmentText(`[הועלה קובץ: ${file.name}] - (נדרש ניתוח טקסטואלי)`);
      }
  };

  // ... (rest of the helper functions remain same)

  return (
    <Layout>
      <div className="pb-12 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tighter">שלום, <span className="text-[#8b6e58]">{user.name}</span></h1>
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

        {/* Tab Navigation */}
        <div className="flex gap-8 border-b border-slate-200 mb-8">
            <button 
                onClick={() => setActiveTab('analysis')}
                className={`pb-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'analysis' ? 'text-[#8b6e58]' : 'text-slate-400 hover:text-slate-600'}`}
            >
                דוח תובנות
                {activeTab === 'analysis' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#8b6e58] rounded-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('raw')}
                className={`pb-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'raw' ? 'text-[#8b6e58]' : 'text-slate-400 hover:text-slate-600'}`}
            >
                משובים גולמיים
                {activeTab === 'raw' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#8b6e58] rounded-full"></div>}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            
            {activeTab === 'analysis' ? (
                <>
                {/* REPORT HEADER */}
                {analysis && (
                    <div className="text-right mb-12 animate-fade-in" id="analysis-header">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8b6e58] mb-2">Diagnostic 360 Mirror</p>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">דוח 360 עבור {user.name}</h2>
                    </div>
                )}

                {/* ANALYSIS RESULTS SECTION */}
                {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in" id="analysis-report">
                        {/* STRENGTHS FIRST */}
                        <div className="bg-white p-12 rounded-[2.5rem] shadow-soft border-t-8 border-t-[#5d7061] border border-slate-100 group hover:shadow-premium transition-all duration-500">
                            <h4 className="text-[11px] font-black text-[#5d7061] uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                <span className="w-2 h-2 bg-[#5d7061] rounded-full"></span>
                                עוצמות שקופות
                            </h4>
                            <p className="text-xl text-slate-800 leading-relaxed font-bold">{analysis.transparentStrengths}</p>
                        </div>

                        <div className="bg-white p-12 rounded-[2.5rem] shadow-soft border-t-8 border-t-[#9b4d4d] border border-slate-100 group hover:shadow-premium transition-all duration-500">
                            <h4 className="text-[11px] font-black text-[#9b4d4d] uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                <span className="w-2 h-2 bg-[#9b4d4d] rounded-full"></span>
                                נקודות עיוורות (Blind Spots)
                            </h4>
                            <p className="text-xl text-slate-800 leading-relaxed font-bold">{analysis.blindSpots}</p>
                        </div>

                        {/* SELF VS OTHERS COMPARISON */}
                        {analysis.selfVsOthersAnalysis && (
                            <div className="bg-white p-12 rounded-[2.5rem] shadow-soft border-t-8 border-t-[#8b6e58] border border-slate-100 md:col-span-2 group hover:shadow-premium transition-all duration-500">
                                <h4 className="text-[11px] font-black text-[#8b6e58] uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                    <span className="w-2 h-2 bg-[#8b6e58] rounded-full"></span>
                                    תפיסת עצמי מול הסביבה
                                </h4>
                                <p className="text-xl text-slate-800 leading-relaxed font-bold italic">{analysis.selfVsOthersAnalysis}</p>
                            </div>
                        )}

                        <div className="bg-[#121212] p-12 rounded-[2.5rem] shadow-premium md:col-span-2 flex flex-col md:flex-row gap-10 items-center text-white border border-white/5">
                            <div className="flex-shrink-0 text-center bg-white/5 p-10 rounded-[2rem] border border-white/10 min-w-[180px] shadow-inner flex flex-col items-center justify-center">
                                <div className="text-5xl mb-2">⚖️</div>
                                <div className="text-[10px] uppercase font-black text-white/40 tracking-[0.4em]">Sentiment Matrix</div>
                            </div>
                            <div className="flex-grow">
                                <h4 className="text-xl font-black text-[#8b6e58] uppercase mb-5 tracking-widest border-b border-white/10 pb-3">ניתוח סנטימנט: {analysis.sentimentAnalysis.label}</h4>
                                <p className="text-2xl text-slate-300 leading-relaxed font-medium">{analysis.sentimentAnalysis.explanation}</p>
                            </div>
                        </div>

                        {/* RECOMMENDATIONS FOR ACTION */}
                        <div className="bg-[#FBF9F8] p-12 rounded-[2.5rem] border-2 border-dashed border-[#8b6e58]/30 md:col-span-2">
                             <h4 className="text-[11px] font-black text-[#8b6e58] uppercase tracking-[0.4em] mb-8">המלצות אופרטיביות לצמיחה</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {analysis.recommendations?.map((rec, i) => (
                                    <div key={i} className="flex gap-4 items-start bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-[#8b6e58] text-white flex items-center justify-center font-black flex-shrink-0 text-xs">{i+1}</div>
                                        <p className="text-slate-700 font-bold leading-relaxed">{rec}</p>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}

                {/* EMPTY STATE / GENERATION */}
                {!analysis && (
                    <div className="bg-[#1a1a1a] rounded-[2.5rem] p-16 text-center text-white shadow-premium relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 w-2 h-full bg-[#8b6e58]"></div>
                        <div className="max-w-xl mx-auto space-y-8">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 border border-white/10">🔍</div>
                            <h3 className="text-3xl font-black tracking-tight">מוכנים לניתוח?</h3>
                            <p className="text-slate-400 text-lg leading-relaxed font-medium">
                                ככל שיש יותר משובים, הניתוח יהיה מדויק יותר. <br className="hidden md:block"/> כרגע התקבלו <span className="text-[#8b6e58] font-black">{responses.length}</span> משובים.
                            </p>
                            
                            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-right space-y-4">
                                <label className="block text-[10px] font-black text-[#8b6e58] uppercase tracking-widest">אופציונלי: העלאת אבחון עצמי להשוואה</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="file" 
                                        onChange={handleSelfAssessmentUpload}
                                        className="hidden" 
                                        id="self-assessment-upload"
                                        accept=".txt,.pdf"
                                    />
                                    <label 
                                        htmlFor="self-assessment-upload"
                                        className="flex-grow bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl cursor-pointer text-sm font-medium transition-all text-slate-300"
                                    >
                                        {selfAssessmentText ? "קובץ הועלה בהצלחה ✓" : "בחר קובץ PDF או טקסט..."}
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold">העלו דוח אבחון אישי כדי לקבל השוואה בין הדרך שבה אתם רואים את עצמכם לבין הסביבה.</p>
                            </div>

                            <Button onClick={handleAnalyze} isLoading={loadingAnalysis} disabled={responses.length === 0} className="w-full h-16 text-xl bg-[#8b6e58] hover:bg-[#725a48] shadow-2xl shadow-[#8b6e58]/20">
                                הפק דוח 360 מלא
                            </Button>
                        </div>
                    </div>
                )}
                </>
            ) : (
                /* RAW RESPONSES TAB */
                <div className="space-y-10 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                        <h3 className="font-extrabold text-2xl text-slate-900">כל המשובים שהתקבלו ({responses.length})</h3>
                    </div>
                    {responses.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold">טרם התקבלו משובים</div>
                    ) : (
                        Object.entries(groupedResponses).map(([rel, items]) => (
                            <div key={rel} className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                        {relationshipLabels[rel] || rel}
                                    </span>
                                    <div className="h-px bg-slate-200 flex-grow"></div>
                                </div>
                                <div className="grid gap-6">
                                    {items.map(r => (
                                        <div key={r.id} className="bg-white p-8 rounded-2xl shadow-soft border border-slate-100 hover:border-[#8b6e58]/30 transition-all duration-300 group">
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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
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
