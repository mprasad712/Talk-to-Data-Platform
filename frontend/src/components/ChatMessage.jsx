import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  if (isUser) {
    return (
      <div className="animate-float-up mb-4 flex justify-end">
        <div className="max-w-[75%] px-4 py-3 text-white" style={{ background: 'var(--bain-dark)' }}>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-float-up mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-5 w-5 flex items-center justify-center" style={{ background: 'var(--bain-red)' }}>
          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isError ? 'var(--bain-red)' : 'var(--text-muted)' }}>
          {isError ? 'Error' : 'BCN Analyst'}
        </span>
      </div>
      <div
        className="px-4 py-3"
        style={{
          background: isError ? '#fef2f2' : '#fff',
          border: '1px solid ' + (isError ? 'rgba(220,38,38,0.2)' : 'var(--bain-border)'),
          borderLeft: '3px solid ' + (isError ? 'var(--bain-red)' : 'var(--bain-red)'),
        }}
      >
        <div className="prose max-w-none text-[13px]">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
