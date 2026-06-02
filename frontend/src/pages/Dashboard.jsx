import React, { useRef, useState } from "react";
import Navbar from "../components/Navbar";
import FileUploader from "../components/FileUploader";
import ImageToText from "../components/ImageToText";
import ImageCompressor from "../components/ImageCompressor";
import TextToPdf from "../components/TextToPdf";
import ConversionHistory from "../components/ConversionHistory";

const TABS = [
  {
    id: "convert",
    label: "Word → PDF",
    shortLabel: "Word→PDF",
    color: "blue",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    id: "ocr",
    label: "Image → Text",
    shortLabel: "Img→Text",
    color: "purple",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    id: "compress",
    label: "Compress Image",
    shortLabel: "Compress",
    color: "green",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="8 17 12 21 16 17"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
      </svg>
    ),
  },
  {
    id: "text-to-pdf",
    label: "Text → PDF",
    shortLabel: "Text→PDF",
    color: "amber",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

const TAB_ACTIVE_STYLES = {
  blue: "bg-blue-500 text-white shadow-lg shadow-blue-500/20",
  purple: "bg-purple-500 text-white shadow-lg shadow-purple-500/20",
  green: "bg-green-500 text-white shadow-lg shadow-green-500/20",
  amber: "bg-amber-500 text-white shadow-lg shadow-amber-500/20",
};

export default function Dashboard({ session }) {
  const historyRef = useRef(null);
  const [activeTab, setActiveTab] = useState("convert");

  const handleConversionComplete = () => {
    setTimeout(() => { historyRef.current?.refresh(); }, 800);
  };

  const name =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="gradient-bg min-h-screen min-h-dvh">
      <Navbar session={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2">
            Hey, {name} 👋
          </h1>
          <p className="text-sm sm:text-base text-white/40">
            Your all-in-one document toolkit.
          </p>
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <div className="mb-6 sm:mb-8 -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-2 p-1 bg-white/5 border border-white/8 rounded-2xl w-max min-w-full sm:min-w-0 sm:w-fit overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap touch-manipulation shrink-0 ${
                  activeTab === tab.id
                    ? TAB_ACTIVE_STYLES[tab.color]
                    : "text-white/40 hover:text-white/70 active:text-white/90"
                }`}
              >
                {tab.icon}
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content — stacked on mobile, side by side on desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-5 sm:gap-6">
          {/* Tool panel */}
          <div className="w-full lg:col-span-2">
            {activeTab === "convert" && <FileUploader onConversionComplete={handleConversionComplete} />}
            {activeTab === "ocr" && <ImageToText onConversionComplete={handleConversionComplete} />}
            {activeTab === "compress" && <ImageCompressor onConversionComplete={handleConversionComplete} />}
            {activeTab === "text-to-pdf" && <TextToPdf onConversionComplete={handleConversionComplete} />}
          </div>

          {/* History */}
          <div className="w-full lg:col-span-3">
            <ConversionHistory ref={historyRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
