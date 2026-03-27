import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatPanel({ messages, isStreaming, onSend, onStop, hasFiles, generatedCode }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Red accent line */}
      <div className="h-1" style={{ background: 'var(--bain-red)' }} />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--bain-border)' }}>
        <div>
          <p className="label-xs">Conversation</p>
          <h2 className="mt-0.5 text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>Analysis Workspace</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: hasFiles ? 'var(--success)' : 'var(--text-muted)' }} />
            {hasFiles ? 'Ready' : 'Awaiting data'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bain-gray-light)' }}>
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-8">
            <div className="w-full max-w-md text-center">
              {/* Hero icon */}
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center" style={{ background: 'var(--bain-red)' }}>
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>

              <h3 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {hasFiles ? 'Ready to Analyze' : 'Welcome to BCN'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {hasFiles
                  ? 'Ask questions about your data. Our multi-agent AI will analyze, validate, and deliver insights.'
                  : 'Upload CSV datasets from the left panel to get started. We\'ll detect schemas and prepare your data automatically.'}
              </p>

              {/* CTA buttons matching Bain style */}
              {!hasFiles && (
                <div className="mt-6">
                  <button className="bain-cta-btn" style={{ borderColor: 'var(--bain-red)', color: 'var(--bain-red)', fontSize: '11px', padding: '10px 24px' }}>
                    UPLOAD YOUR DATA
                  </button>
                </div>
              )}

              {/* Suggested prompts */}
              {hasFiles && (
                <div className="mt-6 text-left">
                  <p className="label-xs mb-2">Quick Start</p>
                  <div className="space-y-1.5">
                    {[
                      'What data do I have?',
                      'Top 10 companies by revenue',
                      'Revenue by product category',
                      'Sales rep performance',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => onSend(q)}
                        className="group flex w-full items-center gap-3 bg-white px-4 py-3 text-left transition-all hover:bg-red-50"
                        style={{ border: '1px solid var(--bain-border)' }}
                      >
                        <svg className="h-4 w-4 shrink-0 transition-colors group-hover:text-red-600" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-5 py-5">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {isStreaming && (
              <div className="animate-fade-in mb-4 flex items-center gap-2 px-1">
                <div className="flex gap-1">
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--bain-red)' }} />
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--bain-red)', animationDelay: '200ms' }} />
                  <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: 'var(--bain-red)', animationDelay: '400ms' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Agents analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} onStop={onStop} isStreaming={isStreaming} disabled={!hasFiles} />
    </div>
  );
}
