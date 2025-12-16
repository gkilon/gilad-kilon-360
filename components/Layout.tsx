import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col text-slate-200 bg-[#020617]" dir="rtl">
      
      {/* Header - Dark, Minimal, Tech */}
      <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-3 group">
             {/* THE LOGO: Minimalist Tech Symbol */}
             <div className="flex items-center gap-1">
                 <div className="w-1 h-6 bg-accent-500 rounded-full"></div>
                 <div className="w-1 h-4 bg-slate-600 rounded-full group-hover:bg-accent-600 transition-colors"></div>
             </div>
             
             <div className="flex flex-col">
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                    FEEDBACK<span className="text-accent-500 font-light">360</span>
                </h1>
             </div>
          </Link>

          {/* Nav */}
          {location.pathname.includes('dashboard') && (
               <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                   <a 
                      href="https://hilarious-kashata-9aafa2.netlify.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-accent-400 border border-slate-700 hover:border-accent-500/50 bg-slate-900 px-5 py-2 rounded text-xs font-semibold transition-all flex items-center gap-2"
                   >
                     שאלון סגנון תקשורת
                     <svg className="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                   </a>
               </div>
          )}

        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Subtle background glow effect */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-900/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#020617] py-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
            <div className="flex flex-col gap-1 text-center md:text-right">
                <p className="font-semibold text-slate-400">פלטפורמת Feedback 360</p>
                <p className="hover:text-slate-300 transition-colors cursor-default">
                    From <span className="font-medium text-slate-400">Gilad Kilon</span> | Organizational Consulting
                </p>
            </div>
            <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium opacity-60">
                <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent-500"></span> 
                    Secure & Encrypted
                </span>
                <span>•</span>
                <span dir="ltr">© 2025 Gilad Kilon. All rights reserved.</span>
            </div>
        </div>
      </footer>
    </div>
  );
};