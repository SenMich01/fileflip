import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { supabase } from "../lib/supabaseClient";

const ConversionHistory = forwardRef(function ConversionHistory(_, ref) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("conversions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setHistory(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);
  useImperativeHandle(ref, () => ({ refresh: fetchHistory }));

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const typeLabel = (type) => {
    if (type === "docx-to-pdf") return "Word → PDF";
    if (type === "image-to-text") return "Image → Text";
    if (type === "compress-image") return "Compress";
    if (type === "text-to-pdf") return "Text → PDF";
    return type;
  };

  const typeColor = (type) => {
    if (type === "docx-to-pdf") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (type === "image-to-text") return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    if (type === "compress-image") return "text-green-400 bg-green-500/10 border-green-500/20";
    if (type === "text-to-pdf") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-white/40 bg-white/5 border-white/10";
  };

  return (
    <div className="card p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white">Conversion History</h2>
        <button
          onClick={fetchHistory}
          className="text-white/30 hover:text-white/60 transition-colors p-2 rounded-lg hover:bg-white/5 touch-manipulation"
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-10 sm:py-12">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-white/30 text-sm">No conversions yet</p>
          <p className="text-white/15 text-xs mt-1">Your history will appear here</p>
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="flex flex-col gap-3 sm:hidden">
            {history.map((row) => (
              <div key={row.id} className="bg-white/3 border border-white/8 rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm text-white/70 truncate flex-1">{row.original_filename}</p>
                  {row.status === "success" ? (
                    <span className="badge-success shrink-0">Done</span>
                  ) : (
                    <span className="badge-failed shrink-0">Failed</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor(row.conversion_type)}`}>
                    {typeLabel(row.conversion_type)}
                  </span>
                  {row.file_size_kb && (
                    <span className="text-xs text-white/25">{row.file_size_kb} KB</span>
                  )}
                  <span className="text-xs text-white/25 ml-auto">{formatDate(row.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto -mx-2">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-white/30 pb-3 px-2">File</th>
                  <th className="text-left text-xs font-medium text-white/30 pb-3 px-2">Type</th>
                  <th className="text-left text-xs font-medium text-white/30 pb-3 px-2">Size</th>
                  <th className="text-left text-xs font-medium text-white/30 pb-3 px-2">Status</th>
                  <th className="text-left text-xs font-medium text-white/30 pb-3 px-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex flex-col">
                        <span className="text-sm text-white/70 truncate max-w-[160px]">{row.original_filename}</span>
                        {row.converted_filename && (
                          <span className="text-xs text-white/25 truncate max-w-[160px]">→ {row.converted_filename}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor(row.conversion_type)}`}>
                        {typeLabel(row.conversion_type)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-white/40">{row.file_size_kb ? `${row.file_size_kb} KB` : "—"}</span>
                    </td>
                    <td className="py-3 px-2">
                      {row.status === "success" ? (
                        <span className="badge-success">Success</span>
                      ) : (
                        <span className="badge-failed">Failed</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs text-white/25">{formatDate(row.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
});

export default ConversionHistory;
