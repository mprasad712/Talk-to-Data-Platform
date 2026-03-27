import React, { useState } from 'react';
import bainLogo from '../assets/bain-company-seeklogo.svg';

export default function Layout({ filePanel, chatPanel, thoughtTrace }) {
  const [traceOpen, setTraceOpen] = useState(true);

  return (
    <div className="app-shell">
      {/* ═══ BAIN NAVIGATION ═══ */}
      <nav className="bain-nav">
        <div className="bain-nav-inner">
          <div className="flex items-center">
            {/* Hamburger */}
            <button className="mr-4 flex flex-col gap-[5px] lg:hidden">
              <span className="block h-[2px] w-5 bg-current" />
              <span className="block h-[2px] w-5 bg-current" />
              <span className="block h-[2px] w-5 bg-current" />
            </button>

            {/* Logo */}
            <img src={bainLogo} alt="Bain & Company" className="h-7 mr-4 sm:h-8" />

            {/* Nav Links */}
            <div className="bain-nav-links hidden lg:flex">
              <span className="bain-nav-link" style={{ color: 'var(--bain-red)', fontWeight: 600 }}>
                Analytics
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <span className="bain-nav-link">
                Datasets
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <span className="bain-nav-link">Digital</span>
              <span className="bain-nav-link">
                Insights
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <span className="bain-nav-link">About</span>
            </div>
          </div>

          <div className="bain-nav-right">
            <button
              onClick={() => setTraceOpen(!traceOpen)}
              className={traceOpen ? 'btn-red' : 'btn-dark'}
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              {traceOpen ? 'TRACE ON' : 'TRACE OFF'}
            </button>
            {/* Search */}
            <svg className="bain-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {/* Bookmark */}
            <svg className="bain-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        </div>
      </nav>

      {/* ═══ RED CTA BANNER ═══ */}
      <div className="bain-cta-banner">
        <div className="bain-cta-inner">
          <div className="bain-cta-col">
            <h2 className="bain-cta-title">What can your data tell you?</h2>
            <button className="bain-cta-btn">LET'S ANALYZE</button>
          </div>
          <div className="bain-cta-col">
            <h2 className="bain-cta-title">AI-powered multi-agent insights</h2>
            <button className="bain-cta-btn">EXPLORE AGENTS</button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px', flex: 1 }}>
        <div className="flex flex-col gap-4 xl:flex-row">
          {/* Files */}
          <aside className="panel animate-float-up h-[340px] shrink-0 xl:h-auto xl:w-[280px]">
            {filePanel}
          </aside>

          {/* Chat */}
          <main className="panel animate-float-up min-w-0 flex-1" style={{ animationDelay: '50ms' }}>
            {chatPanel}
          </main>

          {/* Trace */}
          {traceOpen && (
            <aside className="panel animate-float-up h-[340px] shrink-0 xl:h-auto xl:w-[300px]" style={{ animationDelay: '100ms' }}>
              {thoughtTrace}
            </aside>
          )}
        </div>
      </div>

      {/* ═══ DARK FOOTER - SUBSCRIBE ═══ */}
      <div className="bain-footer-subscribe">
        <div className="bain-footer-subscribe-inner">
          <p className="max-w-lg text-[15px] leading-relaxed text-white/80">
            Stay ahead in a rapidly changing world. Use BCN Analytics to uncover the critical insights hidden in your business data.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="email"
              placeholder="Your email address"
              className="h-11 w-64 border-0 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <button className="btn-red h-11" style={{ letterSpacing: '0.1em' }}>SUBSCRIBE</button>
          </div>
        </div>
      </div>

      {/* ═══ DARK FOOTER - BOTTOM ═══ */}
      <div className="bain-footer-bottom">
        <div className="bain-footer-bottom-inner">
          <img src={bainLogo} alt="Bain & Company" className="h-5" style={{ filter: 'grayscale(1) brightness(0.6)' }} />
          <div className="bain-social-icons">
            {/* LinkedIn */}
            <svg className="bain-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            {/* X */}
            <svg className="bain-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            {/* Facebook */}
            <svg className="bain-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            {/* YouTube */}
            <svg className="bain-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            {/* Instagram */}
            <svg className="bain-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
