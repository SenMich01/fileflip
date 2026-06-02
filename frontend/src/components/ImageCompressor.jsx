import React, { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ImageCompressor({ onConversionComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [quality, setQuality] = useState(75);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const inputRef = useRef(null);

  const validateFile = useCallback((f) => {
    if (!f) return "No file selected.";
    if (f.size > 20 * 1024 * 1024) return "File too large. Max 20MB.";
    if (!ACCEPTED_TYPES.includes(f.type)) return "Please upload a JPG, PNG or WEBP image.";
    return null;
  }, []);

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
    setError("");
    setStats(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [validateFile]);

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setStats(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (kb) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleCompress = async () => {
    if (!file) { setError("Please select an image first."); return; }
    setLoading(true);
    setError("");
    setStats(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated. Please log in again.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", quality);

      const res = await fetch(`${BACKEND_URL}/api/convert/compress-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Server error: ${res.status}`);
      }

      // Read stats from headers
      const originalSize = parseInt(res.headers.get("X-Original-Size")) || 0;
      const compressedSize = parseInt(res.headers.get("X-Compressed-Size")) || 0;
      const savedPercent = parseInt(res.headers.get("X-Saved-Percent")) || 0;

      // Trigger download
      const blob = await res.blob();
      const ext = file.name.split(".").pop();
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const downloadName = `${baseName}_compressed.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStats({ originalSize, compressedSize, savedPercent });
      onConversionComplete?.();
    } catch (err) {
      setError(err.message || "Compression failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 17 12 21 16 17"/>
            <line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Image Compressor</h2>
          <p className="text-xs text-white/30 mt-0.5">Reduce image file size without losing quality</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone rounded-2xl p-6 text-center cursor-pointer mb-5 ${dragOver ? "drag-over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          className="hidden"
        />

        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img src={preview} alt="Preview"
              className="max-h-36 max-w-full rounded-lg border border-white/10 object-contain" />
            <div>
              <p className="text-white font-medium text-sm truncate max-w-[240px]">{file.name}</p>
              <p className="text-white/30 text-xs mt-0.5">{formatSize(Math.round(file.size / 1024))}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); resetState(); }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Remove image
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-sm">
                <span className="text-green-400 font-medium">Click to browse</span> or drag & drop
              </p>
              <p className="text-white/25 text-xs mt-1">JPG, PNG or WEBP · Max 20MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Quality slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-white/60">Compression Quality</label>
          <span className="text-sm font-bold text-white">{quality}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={quality}
          onChange={(e) => setQuality(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #22c55e ${quality}%, rgba(255,255,255,0.1) ${quality}%)` }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/25">Smaller file</span>
          <span className="text-xs text-white/25">Better quality</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
          <p className="text-green-400 text-sm font-semibold mb-2">✓ Compressed successfully!</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-white/30 mb-1">Original</p>
              <p className="text-sm font-bold text-white">{formatSize(stats.originalSize)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/30 mb-1">Compressed</p>
              <p className="text-sm font-bold text-green-400">{formatSize(stats.compressedSize)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/30 mb-1">Saved</p>
              <p className="text-sm font-bold text-green-400">{stats.savedPercent}%</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button onClick={handleCompress} disabled={!file || loading}
        className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: file && !loading ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(34,197,94,0.2)" }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
            Compressing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 17 12 21 16 17"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
            </svg>
            Compress & Download
          </span>
        )}
      </button>
    </div>
  );
}
