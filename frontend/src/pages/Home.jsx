import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080e1f] text-white overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 40 ? "bg-[#080e1f]/90 backdrop-blur-xl border-b border-white/5" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">FileFlip</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-white/50 hover:text-white transition-colors">How it works</a>
            <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#faq" className="text-sm text-white/50 hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link to="/register" className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-400 text-xs font-medium tracking-wide uppercase">Free · No software needed · Works in browser</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Convert PDF to Word.{" "}
            <br className="hidden sm:block" />
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)" }}>
                Word to PDF.
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-px opacity-40"
                style={{ background: "linear-gradient(90deg, transparent, #60a5fa, #818cf8, transparent)" }} />
            </span>
            <br />
            Done in seconds.
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed mb-10">
            FileFlip converts your documents instantly — no desktop software, no email required, no file size headaches.
            Just upload, convert, and download. It's that simple.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 text-base">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 17 12 21 16 17"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
              </svg>
              Start converting for free
            </Link>
            <a href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 text-base">
              See how it works
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>

          {/* Hero visual - file conversion demo */}
          <div className="relative max-w-2xl mx-auto">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                {/* Input file card */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-red-500/15 border border-red-500/20 rounded-lg flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/70">report.pdf</p>
                      <p className="text-xs text-white/25">2.4 MB</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-white/10 rounded-full w-full" />
                    <div className="h-1.5 bg-white/10 rounded-full w-4/5" />
                    <div className="h-1.5 bg-white/10 rounded-full w-3/5" />
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                  <span className="text-xs text-white/25">instant</span>
                </div>

                {/* Output file card */}
                <div className="flex-1 bg-white/5 border border-blue-500/20 rounded-xl p-4 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-blue-500/15 border border-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/70">report.docx</p>
                      <p className="text-xs text-white/25">Ready to download</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-blue-500/20 rounded-full w-full" />
                    <div className="h-1.5 bg-blue-500/20 rounded-full w-4/5" />
                    <div className="h-1.5 bg-blue-500/20 rounded-full w-3/5" />
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-full"
                  style={{ animation: "progressPulse 2s ease-in-out infinite" }} />
              </div>
              <p className="text-center text-xs text-white/25 mt-2">Conversion complete ✓</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Numbers ── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: "100%", label: "Free to use" },
            { number: "20MB", label: "Max file size" },
            { number: "2", label: "Conversion types" },
            { number: "< 30s", label: "Average conversion time" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-white mb-1">{stat.number}</p>
              <p className="text-sm text-white/35">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-400 text-sm font-medium uppercase tracking-widest">Simple by design</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">
              Convert any document<br />in three steps
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              No tutorials. No learning curve. FileFlip is built for people who just want their document converted — right now.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create a free account",
                description: "Sign up in seconds with just your email. No credit card, no premium plan, no hidden fees. Your account keeps your conversion history safe.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Upload your file",
                description: "Drag and drop your PDF or Word document onto the converter. We accept files up to 20MB — enough for even the most detailed reports and contracts.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Download instantly",
                description: "Your converted file downloads automatically the moment it's ready. No waiting, no email delivery, no expiry links. Just your file, instantly.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="8 17 12 21 16 17"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="relative bg-white/[0.03] border border-white/8 rounded-2xl p-7 hover:border-white/15 transition-all duration-300 group">
                <div className="absolute top-5 right-5 text-4xl font-bold text-white/[0.04] select-none">{item.step}</div>
                <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-5 group-hover:bg-blue-500/15 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Conversions Section ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-400 text-sm font-medium uppercase tracking-widest">What we convert</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">
              Two conversions.<br />Both done right.
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              We don't try to do everything. We focus on the two document conversions people actually need every day — and we do them exceptionally well.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* PDF to Word */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8 hover:border-orange-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center group-hover:bg-orange-500/15 transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">PDF</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">DOCX</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">PDF to Word</h3>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                Extract text from any PDF and turn it into a fully editable Word document. Perfect for editing contracts, updating reports, or repurposing content you received as a PDF but need to modify.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Preserves text structure and paragraphs",
                  "Editable in Microsoft Word & Google Docs",
                  "Ideal for contracts, reports & forms",
                  "Handles multi-page documents",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/50">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Word to PDF */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8 hover:border-blue-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">DOCX</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    <span className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">PDF</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">Word to PDF</h3>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                Turn any Word document into a polished, print-ready PDF that looks identical on every device. Stop worrying about formatting breaking when you share your CV, proposal, or report.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Pixel-perfect formatting preserved",
                  "Looks identical on every device",
                  "Great for CVs, proposals & invoices",
                  "Supports .doc and .docx formats",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/50">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-400 text-sm font-medium uppercase tracking-widest">Why FileFlip</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">
              Built for people<br />who are short on time
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Every feature in FileFlip exists to make document conversion faster, simpler, and less stressful.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "No software to install",
                description: "Everything runs in your browser. No downloads, no updates, no compatibility issues. Works on Mac, Windows, Linux, and mobile.",
                icon: "🌐",
              },
              {
                title: "Your history, saved",
                description: "Every conversion is logged in your personal dashboard. Scroll back through months of conversions and see file names, sizes, and status at a glance.",
                icon: "📋",
              },
              {
                title: "Private & secure",
                description: "Files are stored in private, encrypted Supabase storage. Only you can access your documents. We never share or sell your files.",
                icon: "🔒",
              },
              {
                title: "Drag & drop simple",
                description: "Drop a file, click convert, done. No settings to configure, no options to decipher. FileFlip is designed for the non-technical user.",
                icon: "⚡",
              },
              {
                title: "Instant downloads",
                description: "Your file downloads the second it's ready — directly to your device. No waiting for email delivery or download links that expire.",
                icon: "📥",
              },
              {
                title: "Up to 20MB files",
                description: "Handle lengthy annual reports, detailed contracts, and multi-chapter documents. Our 20MB limit covers the vast majority of real-world files.",
                icon: "📦",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300">
                <div className="text-2xl mb-4">{feature.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-400 text-sm font-medium uppercase tracking-widest">Who uses FileFlip</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">
              One tool.<br />Every workflow.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                role: "Job seekers",
                use: "Convert CVs and cover letters to PDF before sending to employers — so your formatting never breaks.",
                emoji: "💼",
              },
              {
                role: "Students",
                use: "Turn assignment PDFs into editable Word docs for notes, or submit final work as a polished PDF.",
                emoji: "🎓",
              },
              {
                role: "Freelancers",
                use: "Send invoices, proposals, and contracts as PDFs. Edit any PDF you receive from clients in Word.",
                emoji: "💻",
              },
              {
                role: "Office workers",
                use: "Convert reports, memos, and shared documents between formats without needing Adobe Acrobat.",
                emoji: "🏢",
              },
            ].map((item) => (
              <div key={item.role} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all duration-300">
                <div className="text-3xl mb-4">{item.emoji}</div>
                <h3 className="text-base font-semibold text-white mb-2">{item.role}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{item.use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-400 text-sm font-medium uppercase tracking-widest">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">
              Common questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is FileFlip really free?",
                a: "Yes, completely free. Create an account with your email and start converting immediately. There are no premium plans, no conversion limits, and no credit card required.",
              },
              {
                q: "How accurate is the PDF to Word conversion?",
                a: "FileFlip extracts all text content from your PDF and structures it into a clean Word document. Text-based PDFs convert very accurately. Scanned PDFs (image-only) may have reduced accuracy as they require OCR technology.",
              },
              {
                q: "Is my data safe?",
                a: "Yes. Your files are stored in private, encrypted cloud storage and protected by Row Level Security — meaning only your account can ever access your files. We do not share, sell, or analyse your documents.",
              },
              {
                q: "What file size limit does FileFlip support?",
                a: "FileFlip supports files up to 20MB, which covers the vast majority of real-world documents including lengthy reports, detailed contracts, and multi-chapter Word files.",
              },
              {
                q: "Do I need to install any software?",
                a: "No. FileFlip runs entirely in your browser. There is nothing to download or install. It works on any modern browser on any operating system — including mobile.",
              },
              {
                q: "How long does a conversion take?",
                a: "Most conversions complete in under 30 seconds. The exact time depends on the file size and type. Your file downloads automatically the moment conversion is complete.",
              },
            ].map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-blue-500/20 p-12 text-center"
            style={{ background: "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 60%, transparent 100%), rgba(255,255,255,0.02)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Your document.<br />Converted now.
              </h2>
              <p className="text-white/40 text-lg mb-8 max-w-xl mx-auto">
                Stop wasting time hunting for the right converter. FileFlip is free, fast, and works exactly as advertised.
              </p>
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 text-base">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="8 17 12 21 16 17"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                </svg>
                Create free account
              </Link>
              <p className="text-white/20 text-sm mt-4">No credit card · No software · No nonsense</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-white/70">FileFlip</span>
          </div>
          <p className="text-sm text-white/20">© {new Date().getFullYear()} FileFlip. Built by Senayon Agboyinu.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm text-white/30 hover:text-white/60 transition-colors">Sign in</Link>
            <Link to="/register" className="text-sm text-white/30 hover:text-white/60 transition-colors">Register</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl transition-all duration-300 ${open ? "border-white/15 bg-white/[0.04]" : "border-white/8 bg-white/[0.02] hover:border-white/12"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-5 text-left">
        <span className="text-sm font-semibold text-white pr-4">{question}</span>
        <span className={`shrink-0 w-5 h-5 rounded-full border border-white/20 flex items-center justify-center transition-transform duration-300 ${open ? "rotate-45 border-blue-500/50 bg-blue-500/10" : ""}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={open ? "#60a5fa" : "rgba(255,255,255,0.4)"} strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-white/40 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
