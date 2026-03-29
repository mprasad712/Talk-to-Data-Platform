import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ThinkingDropdown from './ThinkingDropdown';
import CodeViewer from './CodeViewer';
import DataPreview from './DataPreview';
import TypingIndicator from './TypingIndicator';
import BainIcon from '../assets/Bain_icom.svg';

export default function ChatPanel({ messages, isStreaming, onSend, onStop, generatedCode, files, relationships, thoughts }) {
  const hasFiles = files && files.length > 0;
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [text, setText] = React.useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thoughts]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleSubmit = () => {
    if (!text.trim() || !hasFiles) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const visibleMessages = messages.filter((m) => !m.isPlaceholder);
  const queryCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {visibleMessages.length === 0 && !isStreaming ? (
          <div className="aurora bg-grid flex min-h-full flex-col items-center justify-center px-6 py-10">
            <div className="relative z-10 w-full max-w-xl">
              {/* Welcome hero */}
              <div className="slide-up mb-10 text-center">
                <div className="relative mx-auto mb-6 h-20 w-20">
                  <div className="orb" style={{ width: 120, height: 120, top: -20, left: -20, background: 'var(--aurora-1)' }} />
                  <div className="orb" style={{ width: 80, height: 80, top: 10, right: -30, background: 'var(--aurora-2)', animationDelay: '2s' }} />
                  <div className="breathe relative flex h-20 w-20 items-center justify-center">
                    <img src={BainIcon} alt="Bain Logo" className="h-16 w-16" />
                  </div>
                </div>

                {hasFiles ? (
                  <h2 className="text-[30px] font-extrabold tracking-tight" style={{ color: 'var(--red)' }}>
                    Ready to Analyze
                  </h2>
                ) : (
                  <div className="text-center">
                    <h2 className="text-[36px] font-extrabold tracking-tight" style={{ color: 'var(--red)' }}>
                      Coro<span className="text-[20px] align-super" style={{ color: 'var(--red)' }}>®</span>
                    </h2>
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--text-secondary)' }}>
                      Bain &amp; Company
                    </p>
                  </div>
                )}
                <p className="mx-auto mt-3 max-w-xs text-[14.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {hasFiles
                    ? 'Your data is loaded. Ask anything and our AI agents will analyze it.'
                    : 'Upload CSV files from the sidebar to start exploring your data.'}
                </p>

                {/* Feature pills */}
                {!hasFiles && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {['Multi-Agent AI', '6 Specialized Agents', 'Auto Data Cleaning', 'Python Sandbox'].map(f => (
                      <span key={f} className="rounded-full px-3 py-1 text-[11.5px] font-medium" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Data previews */}
              {hasFiles && files.length > 0 && (
                <div className="slide-up mb-8" style={{ animationDelay: '100ms' }}>
                  <DataPreview files={files} />
                </div>
              )}

              {/* Prompt cards */}
              {hasFiles && (
                <div className="slide-up" style={{ animationDelay: '200ms' }}>
                  <p className="mb-3.5 text-center text-[11.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                    Try asking
                  </p>
                  <div className="stagger grid gap-2.5 sm:grid-cols-2">
                    {[
                      { q: 'What data do I have?', desc: 'Overview of datasets', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', color: '#3b82f6', tint: 'var(--blue-tint)' },
                      { q: 'Top 10 by revenue', desc: 'Revenue ranking', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', color: '#22c55e', tint: 'var(--green-tint)' },
                      { q: 'Show all relationships', desc: 'Dataset connections', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5', color: '#a855f7', tint: 'var(--purple-tint)' },
                      { q: 'Sales performance summary', desc: 'Team metrics', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', color: '#f59e0b', tint: 'var(--amber-tint)' },
                    ].map(({ q, desc, icon, color, tint }) => (
                      <button
                        key={q}
                        onClick={() => onSend(q)}
                        className="glow-card group flex items-start gap-3 rounded-xl p-3.5 text-left"
                        style={{ border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                      >
                        <div
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                          style={{ background: tint }}
                        >
                          <svg className="h-5 w-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{q}</span>
                          <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-faint)' }}>{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl px-5 py-6">
            {visibleMessages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant' && i === visibleMessages.length - 1;
              // Use saved thoughts from DB, or live thoughts for the latest message
              const msgThoughts = isLastAssistant && thoughts.length > 0
                ? thoughts
                : (msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 ? msg.thoughts : null);
              return (
                <React.Fragment key={i}>
                  {msg.role === 'assistant' && msgThoughts && (
                    <ThinkingDropdown thoughts={msgThoughts} isStreaming={isLastAssistant && isStreaming} />
                  )}
                  {isLastAssistant && generatedCode && !isStreaming && (
                    <CodeViewer code={generatedCode} />
                  )}
                  <ChatMessage message={msg} index={i} />
                </React.Fragment>
              );
            })}

            {isStreaming && thoughts.length > 0 && visibleMessages[visibleMessages.length - 1]?.role !== 'assistant' && (
              <ThinkingDropdown thoughts={thoughts} isStreaming={isStreaming} />
            )}

            {isStreaming && thoughts.length > 0 && (
              <TypingIndicator thoughts={thoughts} isStreaming={isStreaming} />
            )}

            {isStreaming && thoughts.length === 0 && (
              <div className="fade-in mb-4 ml-[38px] flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--red)' }} />
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--red)', animationDelay: '200ms' }} />
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--red)', animationDelay: '400ms' }} />
                </div>
                <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-faint)' }}>Starting analysis...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input with animated gradient border */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div
          className="gradient-border mx-auto flex max-w-4xl items-end gap-2.5 rounded-2xl px-4 py-2 transition-all duration-300"
          style={{ border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
        >
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasFiles ? 'Ask about your data...' : 'Upload files to start...'}
            disabled={!hasFiles}
            rows={1}
            className="min-h-[38px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-relaxed focus:outline-none disabled:cursor-not-allowed"
            style={{ color: 'var(--text-secondary)' }}
          />

          {/* Query counter */}
          {queryCount > 0 && !isStreaming && (
            <span className="mb-1.5 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)' }}>
              {queryCount}
            </span>
          )}

          {isStreaming ? (
            <button
              onClick={onStop}
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--bg-overlay)' }}
            >
              <svg className="h-4 w-4" style={{ color: 'var(--text-primary)' }} fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || !hasFiles}
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-20 disabled:hover:scale-100"
              style={{
                background: text.trim() && hasFiles ? 'var(--red)' : 'var(--bg-overlay)',
                boxShadow: text.trim() && hasFiles ? '0 0 20px rgba(220,38,38,0.4)' : 'none',
              }}
            >
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11.5px]" style={{ color: 'var(--text-ghost)' }}>
          Shift+Enter for new line &middot; Ctrl+K for commands &middot; AI-powered multi-agent analysis
        </p>
      </div>
    </div>
  );
}
