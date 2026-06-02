import React, { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_EXT = ".jpg,.jpeg,.png,.webp";

export default function ImageToText({ onConversionComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef(null);

  const validateFile = useCallback((f) => {
    if (!f) return "No file selected.";
    if (f.size > 20 * 1024 * 1024) return "File too large. Max 20MB.";
    if (!ACCEPTED_TYPES.includes(f.type))
      return "Invalid file type. Please upload a JPG, PNG or WEBP image.";
    return null;
  }, []);

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
    setError("");
    setSuccess("");
    // Show preview
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

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) handleFile(selected);
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setError("");
    setSuccess("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleExtract = async () => {
    if (!file) { setError("Please select an image first."); return; }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated. Please log in again.");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BACKEND_URL}/api/ocr/image-to-text`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Server error: ${res.status}`);
      }

      // Trigger download
      const blob = await res.blob();
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const downloadName = `${baseName}_extracted.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`✓ Text extracted! "${downloadName}" is downloading.`);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      onConversionComplete?.();
    } catch (err) {
      setError(err.message || "Extraction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="card p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Image to Text</h2>
          <p className="text-xs text-white/30 mt-0.5">Extract text from photos, notes & screenshots</p>
        </div>
      </div>

      {/* Use cases */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["📚 Student notes", "📄 Printed documents", "🖼️ Screenshots", "📋 Whiteboards"].map((tag) => (
          <span key={tag} className="text-xs text-white/40 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
            {tag}
          </span>
        ))}
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
          accept={ACCEPTED_EXT}
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-h-40 max-w-full rounded-lg border border-white/10 object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg" />
            </div>
            <div>
              <p className="text-white font-medium text-sm truncate max-w-[240px]">{file.name}</p>
              <p className="text-white/30 text-xs mt-0.5">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); resetState(); }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-sm">
                <span className="text-purple-400 font-medium">Click to browse</span> or drag & drop
              </p>
              <p className="text-white/25 text-xs mt-1">JPG, PNG or WEBP · Max 20MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs text-purple-300/60 font-medium mb-1.5">📸 Tips for best results</p>
        <ul className="space-y-1">
          {[
            "Use good lighting — avoid shadows over text",
            "Keep the camera straight, not at an angle",
            "Make sure text is in focus and not blurry",
            "Works best with printed or typed text",
          ].map((tip) => (
            <li key={tip} className="text-xs text-white/25 flex items-start gap-1.5">
              <span className="text-purple-400/50 mt-0.5">·</span> {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Error / Success */}
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

      {/* Button */}
      <button
        onClick={handleExtract}
        disabled={!file || loading}
        className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: file && !loading ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(168,85,247,0.2)" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
            Extracting text...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Extract Text & Download
          </span>
        )}
      </button>
    </div>
  );
}
