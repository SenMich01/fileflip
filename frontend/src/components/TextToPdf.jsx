import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const FONT_OPTIONS = [
  { value: "times", label: "Times New Roman" },
  { value: "helvetica", label: "Helvetica" },
  { value: "courier", label: "Courier (Monospace)" },
];

const FONT_SIZE_OPTIONS = [10, 11, 12, 14, 16, 18, 20, 24];

export default function TextToPdf({ onConversionComplete }) {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [fontSize, setFontSize] = useState(12);
  const [fontStyle, setFontStyle] = useState("times");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleConvert = async () => {
    if (!text.trim()) { setError("Please enter some text first."); return; }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated. Please log in again.");

      const res = await fetch(`${BACKEND_URL}/api/convert/text-to-pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          filename: filename || "document",
          fontSize,
          fontStyle,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Server error: ${res.status}`);
      }

      const blob = await res.blob();
      const downloadName = `${filename || "document"}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`✓ "${downloadName}" is downloading.`);
      onConversionComplete?.();
    } catch (err) {
      setError(err.message || "Conversion failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Text to PDF</h2>
          <p className="text-xs text-white/30 mt-0.5">Type or paste text and download as PDF</p>
        </div>
      </div>

      {/* Filename */}
      <div className="mb-4">
        <label className="label">File name (optional)</label>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="my-document"
          className="input-field"
        />
      </div>

      {/* Font options */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Font</label>
          <select
            value={fontStyle}
            onChange={(e) => setFontStyle(e.target.value)}
            className="input-field"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value} style={{ background: "#0f172a" }}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Font size</label>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="input-field"
          >
            {FONT_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s} style={{ background: "#0f172a" }}>
                {s}pt
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Text area */}
      <div className="mb-2">
        <label className="label">Your text</label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setError(""); setSuccess(""); }}
          placeholder="Type or paste your text here...&#10;&#10;Each new line will be preserved in the PDF.&#10;You can write as much as you need — multiple pages are supported."
          rows={10}
          className="input-field resize-none leading-relaxed"
          style={{ minHeight: "200px" }}
        />
      </div>

      {/* Word / char count */}
      <div className="flex items-center gap-4 mb-5">
        <span className="text-xs text-white/25">{wordCount} words</span>
        <span className="text-xs text-white/25">{charCount} characters</span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={!text.trim() || loading}
        className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: text.trim() && !loading ? "linear-gradient(135deg, #d97706, #f59e0b)" : "rgba(245,158,11,0.2)" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
            Generating PDF...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 17 12 21 16 17"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
            </svg>
            Generate PDF & Download
          </span>
        )}
      </button>
    </div>
  );
}
