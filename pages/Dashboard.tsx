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
      setAnalysisError(error.message || "נכשל ניתוח הנתונים.");
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

  if (loading) return <Layout><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-courage"></div></div></Layout>;

  const groupedResponses = responses.reduce((acc, r) => {
    if (!acc[r.relationship]) acc[r.relationship] = [];
    acc[r.relationship].push(r);
    return acc;
  }, {} as Record<string, FeedbackResponse[]>);

  return (
    <Layout>
      {/* The Mystery Twist: Subtle Vignette */}
      <div className="vignette"></div>

      <div className="max-w-7xl mx-auto py-24 px-8 animate-fade-in relative z-10">
        {/* Mysterious Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-28">
          <div className="space-y-6">
            <span className="text-[10px] font-black text-accent-courage uppercase tracking-[0.6em] block mb-2 opacity-80 italic">The Archive / Session 2026</span>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-[0.85] uppercase">
              Core <br/> <span className="opacity-30">Mirrors</span>
            </h1>
            <p className="text-xl text-text-dim max-w-lg font-light leading-relaxed">
              שלום {user?.name}. נתוני המשוב שלך עובדו לתוך מפה מסתורית של תובנות וצמיחה.
            </p>
          </div>
          
          <div className="flex gap-2 p-1 bg-black/20 rounded-none border border-white/5 backdrop-blur-xl">
             <button onClick={() => setActiveTab('overview')} className={`px-12 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-accent-courage text-white' : 'text-text-dim hover:text-white'}`}>Insights</button>
             <button onClick={() => setActiveTab('responses')} className={`px-12 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'responses' ? 'bg-accent-courage text-white' : 'text-text-dim hover:text-white'}`}>Archive</button>
             {analysis && <button onClick={() => setActiveTab('analysis')} className={`px-12 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'bg-accent-courage text-white' : 'text-text-dim hover:text-white'}`}>Report</button>}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Stats */}
            <div className="lg:col-span-4 space-y-12">
              <div className="mysterious-card p-14 rounded-none group">
                 <h3 className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-6 italic">Impact Metrics</h3>
                 <div className="flex items-baseline gap-4">
                    <p className="text-9xl font-black text-white group-hover:text-accent-courage transition-all leading-none">{responses.length}</p>
                    <span className="text-accent-courage font-black text-2xl animate-pulse">/</span>
                 </div>
              </div>
              
              <div className="mysterious-card p-12 bg-black/40 rounded-none border-l-4 border-accent-courage">
                 <h3 className="text-[10px] font-black text-accent-courage uppercase tracking-widest mb-10">Role Distribution</h3>
                 <div className="space-y-8">
                    {Object.entries(groupedResponses).map(([rel, resps]) => (
                      <div key={rel} className="flex justify-between items-center group">
                        <span className="text-xs font-bold text-white/40 group-hover:text-white transition-colors uppercase tracking-[0.2em]">{rel}</span>
                        <div className="h-[1px] flex-grow mx-8 bg-white/5"></div>
                        <span className="font-black text-white text-2xl italic">{resps.length}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Actions */}
            <div className="lg:col-span-8 space-y-12">
                <div className="mysterious-card p-16 rounded-none relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-accent-courage uppercase tracking-widest mb-4 block italic">Base Operation</span>
                        <h2 className="text-5xl font-black text-white mb-8">ניתוח 360 מהיר</h2>
                        <p className="text-text-dim mb-16 max-w-sm font-light text-lg leading-relaxed">חילוץ תבניות והתנהגויות מתוך רעשי הרקע של המשובים.</p>
                        <button 
                            onClick={() => handleAnalyze(false)} 
                            disabled={loadingAnalysis || responses.length === 0}
                            className="btn-courage"
                        >
                            {loadingAnalysis && !showAdvanced ? 'Synthesizing...' : 'Run Analysis'}
                        </button>
                    </div>
                </div>

                <div className={`mysterious-card p-16 rounded-none transition-all ${showAdvanced ? 'bg-black/40' : ''}`}>
                    <span className="text-[10px] font-black text-accent-courage uppercase tracking-widest mb-4 block italic">Global Sync</span>
                    <h2 className="text-5xl font-black text-white mb-8">דוח אינטגרטיבי (Pro)</h2>
                    <p className="text-text-dim mb-12 max-w-sm font-light text-lg leading-relaxed">הצלבת דוח Lumina Spark או אבחונים חיצוניים עם המציאות בשטח.</p>
                    
                    {!showAdvanced ? (
                        <button onClick={() => setShowAdvanced(true)} className="group flex items-center gap-6 text-[10px] font-black text-white uppercase tracking-[0.4em] border-b border-white/10 pb-2 hover:border-accent-courage transition-all">
                           + INTEGRATE DIAGNOSTIC PDF
                        </button>
                    ) : (
                        <div className="space-y-10 animate-fade-in">
                            <div className="border border-white/5 p-20 text-center rounded-none bg-black/20 hover:bg-black/40 transition-colors group cursor-pointer">
                                <input type="file" id="pdf-upload" accept=".pdf" onChange={handleSelfAssessmentUpload} className="hidden" />
                                <label htmlFor="pdf-upload" className="cursor-pointer">
                                    <div className="text-4xl mb-6 opacity-20">📜</div>
                                    <p className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-widest">{fileName || 'Choose PDF Strategy Document'}</p>
                                </label>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleAnalyze(true)} 
                                    disabled={!fileData || loadingAnalysis}
                                    className="btn-courage flex-grow"
                                >
                                    {loadingAnalysis ? 'Syncing...' : 'Start Integration'}
                                </button>
                                <button onClick={() => {setShowAdvanced(false); setFileData(null); setFileName(null);}} className="px-12 py-4 text-[10px] font-black text-text-dim uppercase tracking-widest hover:text-white">Abort</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="mysterious-card rounded-none overflow-hidden mt-12">
            <div className="p-16 border-b border-white/5 bg-black/40 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-accent-courage uppercase tracking-widest mb-6 block italic">Raw Log</span>
                <h2 className="text-7xl font-black text-white tracking-tighter uppercase leading-none">The <br/> Registry</h2>
              </div>
            </div>
            {responses.length === 0 ? (
                <div className="p-48 text-center text-text-dim font-black uppercase tracking-widest text-xs opacity-20 italic italic">Awaiting Submissions</div>
            ) : (
                <div className="divide-y divide-white/5">
                {responses.map((r, i) => (
                    <div key={i} className="p-16 hover:bg-white/[0.01] transition-colors group">
                        <div className="flex items-center justify-between mb-20">
                            <div className="flex items-center gap-8">
                                <span className="text-4xl font-black text-white/5 group-hover:text-accent-courage transition-all italic">0{i+1}</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white py-2 px-6 border border-white/5 rounded-none bg-black/20">{r.relationship}</span>
                            </div>
                            <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{new Date(r.timestamp).toLocaleDateString('he-IL')}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                            {r.answers.map((ans, idx) => (
                            <div key={idx} className="space-y-6">
                                <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest border-l-2 border-accent-courage/20 pl-6">{questions[idx] || `Metric ${idx+1}`}</h4>
                                <p className="text-2xl text-white/80 font-light leading-snug italic">{ans}</p>
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
          <div className="animate-fade-in space-y-16 py-12" id="analysis-header">
            <div className="mysterious-card p-16 md:p-28 rounded-none relative overflow-hidden bg-black/60 border-l-8 border-accent-courage">
              <div className="absolute top-0 right-0 p-28 opacity-5 pointer-events-none">
                 <h1 className="text-[300px] font-black leading-none select-none tracking-tighter italic">INSIGHT</h1>
              </div>
              
              <div className="relative z-10">
                <span className="text-[10px] font-black text-accent-courage uppercase tracking-[0.8em] mb-16 block italic">Psychological Synthesis / Confidential</span>
                <h2 className="text-7xl md:text-[10rem] font-black tracking-tighter text-white mb-28 leading-[0.75] uppercase">
                    The <br/> <span className="text-accent-courage">Result</span>
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
                    <div className="lg:col-span-7">
                        <h3 className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-12">Executive Strategy</h3>
                        <p className="text-3xl md:text-5xl font-light leading-tight text-white/90 italic">
                            "{analysis.summary}"
                        </p>
                    </div>
                    <div className="lg:col-span-5 bg-black/40 p-14 border border-white/5 backdrop-blur-xl rounded-none">
                        <h3 className="text-[10px] font-black text-accent-courage uppercase tracking-widest mb-12">Strategic Themes</h3>
                        <div className="space-y-12">
                            {Array.isArray(analysis.keyThemes) && analysis.keyThemes.map((theme, i) => (
                                <div key={i} className="flex gap-10 items-start group">
                                    <span className="text-white/20 font-black text-3xl italic group-hover:text-accent-courage transition-all">0{i+1}</span>
                                    <p className="text-xl font-bold text-white/80 group-hover:text-white transition-colors leading-snug">{theme}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
               <div className="mysterious-card p-20 rounded-none group">
                  <h3 className="text-[10px] font-black text-white/20 group-hover:text-accent-courage uppercase tracking-widest mb-12 transition-all italic">עוצמות שקופות</h3>
                  <p className="text-3xl text-white font-light leading-relaxed italic">{analysis.transparentStrengths}</p>
               </div>
               <div className="mysterious-card p-20 rounded-none group">
                  <h3 className="text-[10px] font-black text-white/20 group-hover:text-red-800 uppercase tracking-widest mb-12 transition-all italic">נקודות עיוורות</h3>
                  <p className="text-3xl text-white font-light leading-relaxed italic">{analysis.blindSpots}</p>
               </div>
            </div>

            {analysis.selfVsOthersAnalysis && (
                <div className="mysterious-card p-16 md:p-28 rounded-none relative overflow-hidden bg-white text-black">
                    <h4 className="text-[10px] font-black text-black/40 uppercase mb-16 tracking-[0.6em] italic">Deep Sync Synthesis</h4>
                    <p className="text-4xl md:text-7xl font-black text-black leading-[0.9] tracking-tighter">
                        {analysis.selfVsOthersAnalysis}
                    </p>
                </div>
            )}

            <div className="bg-black text-white p-16 md:p-28 shadow-2xl">
               <h3 className="text-[10px] font-black text-accent-courage uppercase tracking-widest mb-20 italic">Action Roadmap</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                  {Array.isArray(analysis.recommendations) && analysis.recommendations.map((rec, i) => (
                    <div key={i} className="space-y-8 group">
                       <span className="text-8xl font-black text-white/5 group-hover:text-accent-courage/20 transition-all leading-none italic select-none">STRAT_{i+1}</span>
                       <p className="text-2xl font-bold leading-tight border-l-4 border-white/5 pl-10 group-hover:border-accent-courage transition-all">{rec}</p>
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
