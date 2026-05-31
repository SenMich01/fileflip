import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Navbar({ session }) {
  const navigate = useNavigate();
  const email = session?.user?.email || "";
  const name = session?.user?.user_metadata?.full_name || email.split("@")[0];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">FileFlip</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-400">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-white/50 max-w-[160px] truncate">{email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
