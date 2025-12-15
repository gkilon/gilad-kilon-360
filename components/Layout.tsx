import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-[#fdfbf7]">
      
      {/* Header - Warm White with subtle orange border */}
      <header className="sticky top-0 z-50 bg-[#fdfbf7]/90 backdrop-blur border-b border-accent-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-3 group">
             {/* THE LOGO: Warm Diamond */}
             <div className="relative w-8 h-8 flex items-center justify-center transform group-hover:scale-105 transition-transform">
                 <div className="absolute inset-0 border-2 border-accent-600 transform rotate-45 rounded-sm"></div>
                 {/* Center */}
                 <div className="absolute inset-2 bg-gradient-to-tr from-accent-600 to-accent-400 transform rotate-45 rounded-sm shadow-sm"></div>
             </div>
             
             <div className="flex flex-col">
                <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">
                    FEEDBACK<span className="text-accent-600">360</span>
                </h1>
             </div>
          </Link>

          {/* Nav */}
          {location.pathname.includes('dashboard') && (
               <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                   <Link to="/dashboard" className="hover:text-accent-700 transition-colors">לוח בקרה</Link>
                   <a 
                      href="https://hilarious-kashata-9aafa2.netlify.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shadow-accent-200 flex items-center gap-2"
                   >
                     שאלון סגנון תקשורת
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                   </a>
               </div>
          )}

        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-accent-100 bg-[#fdfbf7] py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
            <div className="flex flex-col gap-1 text-center md:text-right">
                <p className="font-bold text-slate-600">Feedback 360 Platform</p>
                <p>מערכת חכמה לניהול צמיחה ומשוב</p>
            </div>
            <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span> 
                    Secure & Anonymous
                </span>
                <span>•</span>
                <span>2024 © All Rights Reserved</span>
            </div>
        </div>
      </footer>
    </div>
  );
};