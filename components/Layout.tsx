import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { useNavigate, Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const user = storageService.getCurrentUser();

  const handleLogout = () => {
    storageService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen selection:bg-blue-600 selection:text-white bg-slate-50">
      {/* Premium Clean Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl hover:scale-105 transition-transform shadow-lg shadow-blue-600/20">K</div>
            <div className="flex flex-col">
                <span className="font-black text-slate-900 text-lg tracking-tighter leading-none">KILON</span>
                <span className="text-[8px] font-bold tracking-[0.4em] text-blue-600 uppercase opacity-80">360 Intelligence</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-10">
            {user ? (
              <>
                <Link to="/admin" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">Admin Console</Link>
                <div className="flex items-center gap-6 pl-8 border-l border-slate-200">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1">{user.name}</p>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Authorized User</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-slate-900 transition-all text-xs font-black border border-slate-200 hover:border-slate-300 rounded-lg"
                  >
                    LOGOUT
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 border border-blue-600/30 px-6 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all">Secure Access</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="relative">
        {children}
      </main>

      {/* Clean Footer */}
      <footer className="py-20 px-8 border-t border-slate-200 bg-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <h3 className="font-black text-2xl tracking-tighter text-slate-900">KILON CONSULTING</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose max-w-xs">
              Advanced Behavioral Architecture <br/>
              © 2026 Internal Insight Platform
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-12 text-slate-500">
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational HQ</p>
                <p className="text-xs font-medium">Shenkin St. 42 / Tel Aviv</p>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Encryption Status</p>
                <p className="text-xs font-medium flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    SSL / Secure Data Flow
                </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};