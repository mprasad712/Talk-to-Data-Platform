import React, { useState } from 'react';
import { useToast } from './Toast';

export default function CodeViewer({ code }) {
  const [expanded, setExpanded] = useState(false);
  const { addToast } = useToast();

  if (!code) return null;

  const copyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    addToast('Code copied to clipboard');
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="fade-up mb-4 ml-[38px]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-all duration-200"
        style={{ background: expanded ? 'var(--bg-raised)' : 'transparent' }}
      >
        <svg
          className="h-3 w-3 shrink-0 transition-transform duration-200"
          style={{ color: 'var(--amber)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <svg className="h-3.5 w-3.5" style={{ color: 'var(--amber)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Generated Python
        </span>
        <span className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)' }}>
          {lineCount} lines
        </span>
        <div className="flex-1" />
        {expanded && (
          <button
            onClick={copyCode}
            className="rounded-md px-2 py-0.5 text-[10px] font-medium transition-all hover:scale-105"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-tertiary)' }}
          >
            Copy
          </button>
        )}
      </button>

      {expanded && (
        <div
          className="mt-1.5 overflow-hidden rounded-xl"
          style={{ border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between px-4 py-2" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#ef4444' }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#22c55e' }} />
              </div>
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-faint)' }}>analysis.py</span>
            </div>
          </div>
          <pre
            className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed"
            style={{ background: 'var(--bg-base)', color: 'var(--text-tertiary)', maxHeight: 300 }}
          >
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
