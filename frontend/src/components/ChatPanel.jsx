import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ThinkingDropdown from './ThinkingDropdown';
import DataPreview from './DataPreview';

export default function ChatPanel({ messages, isStreaming, onSend, onStop, hasFiles, generatedCode, files, relationships, thoughts }) {
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

  // Filter out placeholder messages for display
  const visibleMessages = messages.filter((m) => !m.isPlaceholder);

  // Check if the last message is from the user (meaning we're waiting for a response)
  const lastMsg = visibleMessages[visibleMessages.length - 1];
  const showThinking = thoughts.length > 0 && (isStreaming || (lastMsg && lastMsg.role === 'assistant'));

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--gray-50)' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {visibleMessages.length === 0 && !isStreaming ? (
          <div className="flex h-full flex-col items-center justify-center px-6">
            <div className="w-full max-w-xl">
              {/* Welcome hero */}
              <div className="fade-up mb-8 text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                  style={{ background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)' }}
                >
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>
                  {hasFiles ? 'Ready to Analyze' : 'BCN Data Analytics'}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: 'var(--gray-500)' }}>
                  {hasFiles
                    ? 'Your data is loaded. Ask any question and our AI agents will analyze it for you.'
                    : 'Upload CSV files from the sidebar to begin exploring your business data.'}
                </p>
              </div>

              {/* Data preview cards */}
              {hasFiles && files.length > 0 && (
                <div className="fade-up mb-6" style={{ animationDelay: '80ms' }}>
                  <DataPreview files={files} />
                </div>
              )}

              {/* Quick prompts */}
              {hasFiles && (
                <div className="fade-up" style={{ animationDelay: '150ms' }}>
                  <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--gray-400)' }}>
                    Try asking
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      { q: 'What data do I have?', desc: 'Overview of all datasets', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', color: 'var(--blue)' },
                      { q: 'Top 10 by revenue', desc: 'Revenue ranking analysis', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', color: 'var(--green)' },
                      { q: 'Show all relationships', desc: 'How datasets connect', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5', color: 'var(--purple)' },
                      { q: 'Sales performance summary', desc: 'Rep and team metrics', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', color: 'var(--amber)' },
                    ].map(({ q, desc, icon, color }) => (
                      <button
                        key={q}
                        onClick={() => onSend(q)}
                        className="group flex items-start gap-3 rounded-xl border bg-white p-3.5 text-left transition-all hover:shadow-md"
                        style={{ borderColor: 'var(--gray-200)' }}
                      >
                        <div
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all group-hover:scale-110"
                          style={{ background: `${color}12` }}
                        >
                          <svg className="h-4 w-4" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[12px] font-semibold leading-tight" style={{ color: 'var(--gray-800)' }}>{q}</span>
                          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--gray-400)' }}>{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-5 py-6">
            {visibleMessages.map((msg, i) => {
              // Show thinking dropdown right before the LAST assistant message
              const isLastAssistant = msg.role === 'assistant' && i === visibleMessages.length - 1;

              return (
                <React.Fragment key={i}>
                  {isLastAssistant && thoughts.length > 0 && (
                    <ThinkingDropdown thoughts={thoughts} isStreaming={isStreaming} />
                  )}
                  <ChatMessage message={msg} index={i} />
                </React.Fragment>
              );
            })}

            {/* While streaming and answer hasn't arrived yet, show dropdown after user msg */}
            {isStreaming && thoughts.length > 0 && visibleMessages[visibleMessages.length - 1]?.role !== 'assistant' && (
              <ThinkingDropdown thoughts={thoughts} isStreaming={isStreaming} />
            )}

            {/* Streaming indicator when no thoughts yet */}
            {isStreaming && thoughts.length === 0 && (
              <div className="fade-in mb-3 ml-9 flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--red)' }} />
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--red)', animationDelay: '200ms' }} />
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--red)', animationDelay: '400ms' }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: 'var(--gray-400)' }}>Starting analysis...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t px-4 py-3" style={{ borderColor: 'var(--gray-200)', background: 'var(--white)' }}>
        <div
          className="mx-auto flex max-w-3xl items-end gap-2.5 rounded-2xl border px-4 py-1.5 transition-all focus-within:shadow-md"
          style={{ borderColor: 'var(--gray-200)', background: 'var(--white)' }}
        >
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasFiles ? 'Ask about your data...' : 'Upload files to start...'}
            disabled={!hasFiles}
            rows={1}
            className="min-h-[36px] min-w-0 flex-1 resize-none bg-transparent py-2 text-[13px] leading-relaxed placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-80"
              style={{ background: 'var(--dark)' }}
            >
              <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || !hasFiles}
              className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-20"
              style={{ background: 'var(--red)' }}
            >
              <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[10px]" style={{ color: 'var(--gray-400)' }}>
          AI-powered analysis may contain errors. Always verify critical findings.
        </p>
      </div>
    </div>
  );
}
