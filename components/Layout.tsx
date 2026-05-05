import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col text-slate-900 bg-[#FBF9F8]" dir="rtl">
      
      {/* Subtle Top Accent */}
      <div className="h-1 w-full bg-[#8b6e58]"></div>

      {/* Header - Executive, Refined */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-5 group">
             <div className="flex flex-col items-center">
                 <div className="w-1.5 h-10 bg-slate-900 rounded-full group-hover:bg-[#8b6e58] transition-colors"></div>
                 <div className="w-5 h-1.5 bg-[#8b6e58] rounded-full mt-1.5 shadow-sm"></div>
             </div>
             
             <div className="flex flex-col">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                    Kilon<span className="text-[#8b6e58]">360</span>
                </h1>
                <span className="text-[11px] uppercase tracking-[0.5em] text-slate-400 font-bold -mt-1">Executive Mirror</span>
             </div>
          </Link>

          {/* Nav */}
          {location.pathname.includes('dashboard') && (
               <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                   <a 
                      href="https://hilarious-kashata-9aafa2.netlify.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-700 hover:text-accent-700 border border-slate-200 hover:border-accent-700/30 bg-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                   >
                     שאלון סגנון תקשורת
                     <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                   </a>
               </div>
          )}

        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 relative z-10">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
            <div className="flex flex-col gap-1.5 text-center md:text-right">
                <p className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Feedback 360 Platform</p>
                <p className="hover:text-slate-600 transition-colors cursor-default font-medium">
                    גלעד קילון | ייעוץ ארגוני ופיתוח הנהלות
                </p>
            </div>
            <div className="flex items-center gap-6 mt-6 md:mt-0 font-bold uppercase tracking-tighter opacity-80">
                <span className="flex items-center gap-2 text-accent-700">
                    <div className="w-2 h-2 rounded-full bg-accent-700 animate-pulse"></div> 
                    Secure & Private
                </span>
                <span className="text-slate-200">|</span>
                <span dir="ltr">© 2026 Kilon Consulting.</span>
            </div>
        </div>
      </footer>
    </div>
  );
};