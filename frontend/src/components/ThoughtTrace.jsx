import React, { useRef, useEffect } from 'react';
import ThoughtStep from './ThoughtStep';

export default function ThoughtTrace({ thoughts, isStreaming }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thoughts]);

  return (
    <div className="flex h-full flex-col">
      {/* Red accent */}
      <div className="h-1" style={{ background: 'var(--bain-red)' }} />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--bain-border)' }}>
        <div>
          <p className="label-xs">System</p>
          <h2 className="mt-0.5 text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>Agent Trace</h2>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full pulse-dot" style={{ background: 'var(--bain-red)' }} />
            <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--bain-red)' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Steps */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3" style={{ background: 'var(--bain-gray-light)' }}>
        {thoughts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center" style={{ background: 'var(--bain-border)' }}>
                <svg className="h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Waiting for activity</p>
              <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>Steps appear here in real time</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {thoughts.map((thought, i) => (
              <ThoughtStep key={i} thought={thought} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
