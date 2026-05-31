import React, { useRef } from "react";
import Navbar from "../components/Navbar";
import FileUploader from "../components/FileUploader";
import ConversionHistory from "../components/ConversionHistory";

export default function Dashboard({ session }) {
  const historyRef = useRef(null);

  const handleConversionComplete = () => {
    // Refresh history after a short delay to let DB write complete
    setTimeout(() => {
      historyRef.current?.refresh();
    }, 800);
  };

  const name = session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] || "there";

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar session={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-10 animate-fade-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            Hey, {name} 👋
          </h1>
          <p className="text-white/40">Convert your documents in seconds — PDF ↔ Word.</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10 animate-fade-up stagger-1" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <StatCard
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
            label="PDF → Word"
            desc="Extract & format text"
            color="text-orange-400"
            bg="bg-orange-500/10"
          />
          <StatCard
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            }
            label="Word → PDF"
            desc="Print-ready PDFs"
            color="text-electric-400"
            bg="bg-electric-500/10"
          />
          <div className="hidden sm:block card p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Secure</p>
                <p className="text-xs text-white/30">Files stored privately</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Uploader - larger */}
          <div className="lg:col-span-2 animate-fade-up stagger-2" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <FileUploader onConversionComplete={handleConversionComplete} />
          </div>

          {/* History - wider */}
          <div className="lg:col-span-3 animate-fade-up stagger-3" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <ConversionHistory ref={historyRef} />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, desc, color, bg }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/30">{desc}</p>
        </div>
      </div>
    </div>
  );
}
