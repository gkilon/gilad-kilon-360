import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToWord } from '../services/exportService';
import { User, FeedbackResponse, AnalysisResult } from '../types';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

const relationshipLabels: Record<string, string> = {
  'manager': 'מנהלים',
  'peer': 'קולגות',
  'subordinate': 'כפיפים',
  'friend': 'חברים',
  'other': 'אחר'
};

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
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
    // Goal is now optional, so we don't force edit mode

    const loadData = async () => {
        setLoadingData(true);
        try {
            const data = await storageService.getResponsesForUser(currentUser.id);
            setResponses(data);
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
          alert('Error saving goal');
      } finally {
          setIsSavingGoal(false);
      }
  };

  const handleAnalyze = async () => {
    if (responses.length === 0) return;
    setLoadingAnalysis(true);
    try {
      const result = await analyzeFeedback(responses, user?.userGoal);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert("Error analyzing data.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    if (!user) return;
    
    // Logic Changed: Goal is optional for copying link
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-primary-200">
          <div>
            <h1 className="text-3xl font-black text-primary-950 mb-1">
                שלום, {user.name}
            </h1>
            <p className="text-primary-600 font-medium">
                {responses.length} משובים התקבלו
            </p>
          </div>
          <div className="flex gap-3">
             <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-xs">
                יציאה
             </Button>
          </div>
        </div>

        {/* PROMINENT EXTERNAL LINK BUTTON */}
        <div className="mb-10 bg-gradient-to-r from-primary-800 to-primary-600 rounded-xl p-6 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <span className="text-2xl">⚡</span> 
                    שלב מקדים (מומלץ): שאלון סגנון תקשורת
                </h3>
                <p className="text-primary-100 opacity-90 max-w-xl">
                    כדי למקסם את התהליך, מלא תחילה את שאלון האיפיון האישי במערכת המשלימה.
                </p>
            </div>
            <a 
                href="https://hilarious-kashata-9aafa2.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0"
            >
                <button className="bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                    מעבר לשאלון חיצוני
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </button>
            </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* GOAL SETTING (OPTIONAL) */}
            <div className="glass-panel border-r-4 border-r-primary-600">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-primary-500 uppercase tracking-widest">
                             מטרת הצמיחה (אופציונלי)
                        </h3>
                    </div>
                    {!isEditingGoal && (
                        <button onClick={() => setIsEditingGoal(true)} className="text-primary-700 text-xs font-bold hover:underline">
                            {goal ? 'עריכה' : 'הוסף מטרה'}
                        </button>
                    )}
                </div>

                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="input-field w-full min-h-[100px] text-lg"
                            placeholder="מהי המטרה המרכזית שלך?"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveGoal} isLoading={isSavingGoal} className="py-2">שמור</Button>
                            <button onClick={() => { setIsEditingGoal(false); setGoal(user.userGoal || ''); }} className="text-primary-400 text-sm font-medium px-4">ביטול</button>
                        </div>
                    </div>
                ) : (
                    <div className={`${goal ? 'bg-primary-50 border-primary-100' : 'bg-slate-50 border-slate-200 border-dashed'} p-6 rounded-lg border transition-colors`}>
                        {goal ? (
                            <p className="text-xl text-primary-900 font-medium leading-relaxed">"{goal}"</p>
                        ) : (
                            <p className="text-slate-400 text-sm">לא הוגדרה מטרה. ניתן להוסיף מטרה כדי למקד את נותני המשוב, אך לא חובה.</p>
                        )}
                    </div>
                )}
            </div>

            {/* RESPONSES */}
            {responses.length === 0 ? (
              <div className="glass-panel text-center py-12 border-2 border-dashed border-primary-200 bg-white/50">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-primary-600">
                    ✉️
                </div>
                <h3 className="text-lg font-bold text-primary-900 mb-2">עדיין לא התקבלו משובים</h3>
                <p className="text-primary-500 mb-6 max-w-sm mx-auto text-sm">
                    זה הזמן להעתיק את הקישור ולשלוח לקולגות, מנהלים וכפיפים.
                </p>
                <Button onClick={copyLink} variant="primary">
                    {copied ? 'הקישור הועתק' : 'העתק קישור למשוב'}
                </Button>
              </div>
            ) : (
              <div className="space-y-8 mt-8">
                <div className="flex justify-between items-center border-b border-primary-200 pb-2">
                    <h3 className="text-lg font-bold text-primary-900">משובים</h3>
                    <Button onClick={copyLink} variant="outline" className="px-3 py-1.5 text-xs h-auto">
                        {copied ? 'הועתק' : 'העתק קישור'}
                    </Button>
                </div>

                {Object.entries(groupedResponses).map(([rel, items]) => (
                   <div key={rel}>
                       <h4 className="text-xs font-bold text-primary-400 uppercase mb-4 flex items-center gap-2">
                           <span className="w-2 h-2 bg-primary-300 rounded-full"></span>
                           {relationshipLabels[rel] || rel}
                           <span className="text-primary-300 ml-1">({items.length})</span>
                       </h4>
                       
                       <div className="grid gap-6">
                            {items.map((resp) => (
                                <div key={resp.id} className="glass-panel p-6 hover:border-primary-300 transition-colors">
                                    {/* 4 Questions Display */}
                                    <div className="space-y-6">
                                        
                                        {/* Row 1 */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-green-50/50 p-3 rounded-lg border border-green-100/50">
                                                <div className="text-[10px] font-bold text-green-700 mb-1 uppercase tracking-wide">🏆 השפעה ותוצאות</div>
                                                <p className="text-primary-900 leading-relaxed">{resp.q1_impact}</p>
                                            </div>
                                            
                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                                                <div className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wide">💎 פוטנציאל לא מנוצל</div>
                                                <p className="text-primary-900 leading-relaxed">{resp.q2_untapped}</p>
                                            </div>
                                        </div>

                                        {/* Row 2 */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                                                <div className="text-[10px] font-bold text-red-600 mb-1 uppercase tracking-wide">🚧 דפוס מעכב</div>
                                                <p className="text-primary-900 leading-relaxed">{resp.q3_pattern}</p>
                                            </div>

                                            <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100/50">
                                                <div className="text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-wide">🚀 כיוון עתידי</div>
                                                <p className="text-primary-900 leading-relaxed">{resp.q4_future}</p>
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
                 <div className="glass-panel bg-primary-900 text-white border-none shadow-xl">
                    <div className="mb-6 border-b border-primary-800 pb-4">
                        <h2 className="text-lg font-bold mb-1 flex items-center gap-2 text-white">
                            <span className="text-primary-300">✦</span> ניתוח מנועי צמיחה
                        </h2>
                        <p className="text-primary-300 text-xs">AI Powered Analysis</p>
                    </div>

                    {!analysis ? (
                        <div className="text-center py-6">
                            <p className="text-primary-200 text-sm mb-6 leading-relaxed">
                                המערכת תבצע אינטגרציה של כלל המשובים ותזהה את ה-Superpower והחסם העיקרי שלך.
                            </p>
                            <Button 
                                onClick={handleAnalyze} 
                                disabled={responses.length === 0}
                                isLoading={loadingAnalysis}
                                className="w-full bg-white text-primary-900 hover:bg-primary-50 shadow-none border-none text-sm font-bold"
                            >
                                הפק דוח תובנות
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h4 className="text-[10px] font-bold text-primary-300 uppercase tracking-widest mb-2">סיכום מנהלים</h4>
                                <p className="text-primary-50 text-sm leading-relaxed font-light">{analysis.summary}</p>
                            </div>
                            
                            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                                <h4 className="text-[10px] font-bold text-primary-300 uppercase tracking-widest mb-2">תמות מרכזיות</h4>
                                <ul className="space-y-2">
                                    {analysis.keyThemes.map((theme, i) => (
                                    <li key={i} className="text-xs text-primary-100 flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0"></span>
                                        {theme}
                                    </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-primary-800 p-4 rounded-lg border border-primary-700">
                                <h4 className="text-[10px] font-bold text-primary-200 uppercase tracking-widest mb-2">המלצה למיקוד</h4>
                                <p className="text-base font-bold italic text-white leading-relaxed">"{analysis.actionableAdvice}"</p>
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t border-primary-800">
                                <Button onClick={handleExport} className="w-full bg-transparent border border-primary-700 text-primary-300 hover:bg-white/5 hover:text-white hover:border-primary-500 text-xs">
                                    הורד דוח מלא (Word)
                                </Button>
                                <button onClick={handleAnalyze} className="text-[10px] text-primary-500 hover:text-white w-full uppercase tracking-widest transition-colors">
                                רענן נתונים
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