
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { QuestionsConfig, User } from '../types';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAnalysis, setUserAnalysis] = useState<any | null>(null);
  const [isEditingReport, setIsEditingReport] = useState(false);

  useEffect(() => {
      const user = storageService.getCurrentUser();
      setCurrentUser(user);

      if (isAuthenticated) {
          loadSettings();
          loadUsers();
      }
  }, [isAuthenticated]);

  const loadSettings = async () => {
      setLoading(true);
      try {
          const settings = await storageService.getAppSettings();
          setCode(settings.registrationCode);
          setQuestions(Array.isArray(settings.questions) ? settings.questions : []);
      } catch (e) {
          setMsg('שגיאה בטעינת הגדרות');
      } finally {
          setLoading(false);
      }
  };

  const loadUsers = async () => {
      try {
          const data = await storageService.getAllUsers();
          setUsers(data);
      } catch (e) { console.error(e); }
  };

  const handleSelectUser = async (user: User) => {
      setLoading(true);
      setSelectedUser(user);
      try {
          const analysis = await storageService.getAnalysis(user.id);
          setUserAnalysis(analysis);
      } catch (e) { console.error(e); }
      setLoading(false);
  };

  const handleSaveUserReport = async () => {
      if (!selectedUser || !userAnalysis) return;
      setLoading(true);
      try {
          await storageService.saveAnalysis(selectedUser.id, userAnalysis);
          setMsg(`הדוח של ${selectedUser.name} עודכן בהצלחה.`);
          setIsEditingReport(false);
      } catch (e) { setMsg("עדכון הדוח נכשל."); }
      setLoading(false);
  };

  // ... (existing handlers for questions remain same)

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="text-center mb-10">
            <p className="text-[10px] text-[#8b6e58] font-black uppercase tracking-[0.4em] mb-2">System Administration</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">ניהול והגדרות</h1>
        </div>

        <div className="w-full max-w-5xl glass-panel border-t-8 border-[#8b6e58] shadow-premium">
            {!isAuthenticated ? (
                /* LOGIN FORM remains same */
                <div className="space-y-8 max-w-sm mx-auto py-4">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest text-center">הזן קוד מנהל</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-field text-center font-mono text-xl"
                                placeholder="••••••••"
                            />
                        </div>
                        <Button type="submit" variant="primary" className="w-full h-14 shadow-lg bg-[#8b6e58]">כניסה למערכת</Button>
                    </form>
                    {msg && <p className="text-red-600 text-center text-xs font-bold bg-red-50 p-3 rounded border border-red-100">{msg}</p>}
                    <button onClick={() => navigate('/')} type="button" className="w-full text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">חזרה לדף הבית</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* LEFT SIDE: USERS LIST */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-4">משתמשים במערכת ({users.length})</h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {users.map(u => (
                                <button 
                                    key={u.id}
                                    onClick={() => handleSelectUser(u)}
                                    className={`w-full text-right p-4 rounded-xl border transition-all ${selectedUser?.id === u.id ? 'bg-[#8b6e58] text-white border-[#8b6e58]' : 'bg-white text-slate-600 border-slate-100 hover:border-[#8b6e58]/30'}`}
                                >
                                    <p className="font-bold text-sm">{u.name}</p>
                                    <p className={`text-[10px] ${selectedUser?.id === u.id ? 'text-white/60' : 'text-slate-400'}`}>{u.email}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE: USER REPORT OR SETTINGS */}
                    <div className="lg:col-span-8 space-y-10">
                        {selectedUser ? (
                            <div className="animate-fade-in space-y-8">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">דוח של {selectedUser.name}</h2>
                                    <button onClick={() => setSelectedUser(null)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500">סגור דוח</button>
                                </div>

                                {userAnalysis ? (
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <div className="flex justify-between mb-4">
                                                <h4 className="text-[10px] font-black text-[#8b6e58] uppercase">סיכום אבחוני</h4>
                                                <button onClick={() => setIsEditingReport(!isEditingReport)} className="text-[10px] font-black text-slate-400 underline">
                                                    {isEditingReport ? "בטל עריכה" : "ערוך דוח"}
                                                </button>
                                            </div>
                                            {isEditingReport ? (
                                                <textarea 
                                                    value={userAnalysis.summary}
                                                    onChange={e => setUserAnalysis({...userAnalysis, summary: e.target.value})}
                                                    className="w-full h-32 p-4 text-sm font-medium border rounded-xl"
                                                />
                                            ) : (
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{userAnalysis.summary}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                                <h4 className="text-[10px] font-black text-[#5d7061] mb-2 uppercase">עוצמות שקופות</h4>
                                                {isEditingReport ? (
                                                    <textarea 
                                                        value={userAnalysis.transparentStrengths}
                                                        onChange={e => setUserAnalysis({...userAnalysis, transparentStrengths: e.target.value})}
                                                        className="w-full h-24 p-3 text-xs border rounded-lg"
                                                    />
                                                ) : (
                                                    <p className="text-xs font-bold text-slate-800">{userAnalysis.transparentStrengths}</p>
                                                )}
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                                <h4 className="text-[10px] font-black text-[#9b4d4d] mb-2 uppercase">נקודות עיוורות</h4>
                                                {isEditingReport ? (
                                                    <textarea 
                                                        value={userAnalysis.blindSpots}
                                                        onChange={e => setUserAnalysis({...userAnalysis, blindSpots: e.target.value})}
                                                        className="w-full h-24 p-3 text-xs border rounded-lg"
                                                    />
                                                ) : (
                                                    <p className="text-xs font-bold text-slate-800">{userAnalysis.blindSpots}</p>
                                                )}
                                            </div>
                                        </div>

                                        {isEditingReport && (
                                            <Button onClick={handleSaveUserReport} isLoading={loading} className="w-full h-12 bg-[#8b6e58]">שמור שינויים בדוח</Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold text-sm">טרם הופק דוח למשתמש זה</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* GLOBAL SETTINGS VIEW */
                            <form onSubmit={handleUpdate} className="space-y-10">
                                <div className="bg-[#8b6e58]/5 p-6 rounded-2xl border border-[#8b6e58]/10 text-right">
                                    <h3 className="text-[10px] font-black text-[#8b6e58] mb-4 uppercase tracking-widest">הגדרות מערכת גלובליות</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">קוד גישה למערכת</label>
                                            <input 
                                                type="text" 
                                                value={code}
                                                onChange={e => setCode(e.target.value)}
                                                className="input-field text-center font-mono text-2xl tracking-[0.4em] uppercase text-[#8b6e58]"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase">שאלון 360</h4>
                                                <button type="button" onClick={handleAddQuestion} className="text-[10px] font-black text-[#8b6e58] underline">+ הוסף שאלה</button>
                                            </div>
                                            {questions.map((q, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <textarea 
                                                        value={q}
                                                        onChange={e => handleQuestionChange(i, e.target.value)}
                                                        className="flex-grow p-4 text-xs border border-slate-100 rounded-xl bg-white shadow-soft"
                                                    />
                                                    <button type="button" onClick={() => handleRemoveQuestion(i)} className="text-slate-300 hover:text-red-500">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Button type="submit" isLoading={loading} className="w-full mt-10 h-14 bg-[#8b6e58]">עדכן הגדרות גלובליות</Button>
                                </div>
                            </form>
                        )}
                        {msg && <p className="text-center font-bold text-[10px] text-[#8b6e58] bg-[#8b6e58]/5 p-4 rounded-xl border border-[#8b6e58]/10">{msg}</p>}
                    </div>
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
};
