import React, { useRef, useEffect } from 'react';

const AGENTS = {
  orchestrator: { color: 'var(--red)', label: 'Router', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
  data_identifier: { color: 'var(--blue)', label: 'Data Scanner', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
  code_generator: { color: 'var(--amber)', label: 'Code Gen', icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5' },
  code_executor: { color: 'var(--purple)', label: 'Executor', icon: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z' },
  validator: { color: 'var(--green)', label: 'Validator', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  synthesizer: { color: 'var(--cyan)', label: 'Synthesizer', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' },
};

export default function TracePanel({ thoughts, isStreaming }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thoughts]);

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--white)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3.5 py-2.5" style={{ borderColor: 'var(--gray-200)' }}>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" style={{ color: 'var(--gray-500)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span className="text-[12px] font-bold" style={{ color: 'var(--gray-800)' }}>Agent Trace</span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: 'var(--red-light)' }}>
            <div className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--red)' }} />
            <span className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--red)' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Steps */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2.5" style={{ background: 'var(--gray-50)' }}>
        {thoughts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--gray-100)' }}>
                <svg className="h-5 w-5" style={{ color: 'var(--gray-300)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--gray-400)' }}>Waiting for activity</p>
              <p className="mt-0.5 text-[10px]" style={{ color: 'var(--gray-300)' }}>Agent steps will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {thoughts.map((t, i) => {
              const agent = AGENTS[t.agent] || AGENTS.orchestrator;
              const isDone = t.status === 'done';
              const isError = t.status === 'error';
              const isRunning = t.status === 'running';

              return (
                <div
                  key={i}
                  className="fade-up overflow-hidden rounded-lg border bg-white"
                  style={{ borderColor: isRunning ? `${agent.color}40` : 'var(--gray-100)', animationDelay: `${i * 30}ms` }}
                >
                  <div className="px-3 py-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Status indicator */}
                        {isRunning ? (
                          <div className="relative flex h-5 w-5 items-center justify-center">
                            <div className="absolute h-5 w-5 rounded-full opacity-20" style={{ background: agent.color, animation: 'pulse 2s ease-in-out infinite' }} />
                            <svg className="h-3.5 w-3.5" style={{ color: agent.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={agent.icon} />
                            </svg>
                          </div>
                        ) : isDone ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--green-light)' }}>
                            <svg className="h-3 w-3" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : isError ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--red-light)' }}>
                            <svg className="h-3 w-3" style={{ color: 'var(--red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center">
                            <svg className="h-3.5 w-3.5" style={{ color: agent.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={agent.icon} />
                            </svg>
                          </div>
                        )}
                        <span className="text-[10px] font-bold" style={{ color: isRunning ? agent.color : isDone ? 'var(--gray-600)' : 'var(--gray-500)' }}>
                          {agent.label}
                        </span>
                      </div>
                      {t.timestamp && (
                        <span className="font-mono text-[9px]" style={{ color: 'var(--gray-400)' }}>
                          {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="ml-7 text-[11px] leading-relaxed" style={{ color: 'var(--gray-500)' }}>{t.message}</p>
                    {t.code && (
                      <pre className="ml-7 mt-2 max-h-24 overflow-auto rounded-lg px-3 py-2 text-[10px] leading-relaxed" style={{ background: 'var(--dark)', color: '#e5e7eb' }}>
                        <code>{t.code}</code>
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
