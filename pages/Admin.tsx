import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [newCode, setNewCode] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      setMsg('סיסמה שגויה');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await storageService.updateRegistrationCode(newCode);
        setMsg('הקוד עודכן בהצלחה');
        setNewCode('');
    } catch (e) {
        setMsg('שגיאה בעדכון');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12">
         <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-800">
                ניהול מערכת
            </h1>
        </div>

        <div className="glass-panel w-full max-w-md p-8">
            
            {!isAuthenticated ? (
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-xs font-bold text-neutral-500 mb-2">סיסמת מנהל</label>
                            <span className="text-[10px] text-primary-400 bg-primary-50 px-2 rounded-full h-fit">Default: admin123</span>
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="הזן סיסמה"
                        />
                    </div>
                    
                    <Button type="submit" variant="primary" className="w-full">כניסה</Button>
                    
                    {msg && <p className="text-red-500 text-center text-xs mt-2 font-bold">{msg}</p>}
                    
                    <button onClick={() => navigate('/')} type="button" className="w-full text-center text-xs text-neutral-400 mt-4 hover:text-primary-600">
                        חזרה למסך הראשי
                    </button>
                </form>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="bg-green-50 p-3 rounded text-center text-xs text-green-800 font-bold border border-green-200">
                        מחובר כמנהל ✓
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 mb-2">קוד רישום חדש למערכת</label>
                        <input 
                            type="text" 
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                            className="input-field text-center font-mono text-lg tracking-widest"
                            placeholder="CODE"
                            dir="ltr"
                        />
                    </div>

                    <Button variant="primary" type="submit" className="w-full">עדכן קוד</Button>
                    
                    {msg && <p className="text-green-600 text-center font-bold text-xs">{msg}</p>}
                    
                    <div className="border-t border-neutral-100 pt-6 mt-2">
                        <button onClick={() => navigate('/')} type="button" className="w-full text-center text-neutral-500 font-bold text-xs hover:text-red-500">יציאה</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </Layout>
  );
};