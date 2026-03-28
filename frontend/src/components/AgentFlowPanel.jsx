import React, { useMemo } from 'react';

const PIPELINE = [
  { id: 'orchestrator', label: 'Router', desc: 'Routes to the right agent', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5', color: '#dc2626', tint: 'var(--red-tint)' },
  { id: 'data_identifier', label: 'Data Scanner', desc: 'Analyzes schemas & joins', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z', color: '#3b82f6', tint: 'var(--blue-tint)' },
  { id: 'code_generator', label: 'Code Generator', desc: 'Writes Python analysis code', icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5', color: '#f59e0b', tint: 'var(--amber-tint)' },
  { id: 'code_executor', label: 'Executor', desc: 'Runs code in sandbox', icon: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z', color: '#a855f7', tint: 'var(--purple-tint)' },
  { id: 'validator', label: 'Validator', desc: 'Checks result accuracy', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#22c55e', tint: 'var(--green-tint)' },
  { id: 'synthesizer', label: 'Synthesizer', desc: 'Creates business insights', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', color: '#06b6d4', tint: 'var(--cyan-tint)' },
];

export default function AgentFlowPanel({ thoughts, isStreaming }) {
  const agentStatus = useMemo(() => {
    const status = {};
    for (const t of thoughts) {
      if (t.status === 'error') status[t.agent] = 'error';
      else if (t.status === 'done' && status[t.agent] !== 'error') status[t.agent] = 'done';
      else if (t.status === 'running' && (!status[t.agent] || status[t.agent] === 'idle')) status[t.agent] = 'running';
    }
    return status;
  }, [thoughts]);

  const activeAgent = useMemo(() => {
    for (let i = thoughts.length - 1; i >= 0; i--) {
      if (thoughts[i].status === 'running') return thoughts[i].agent;
    }
    return null;
  }, [thoughts]);

  const activePath = useMemo(() => new Set(thoughts.map((t) => t.agent)), [thoughts]);
  const allDone = !isStreaming && thoughts.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span className="text-[13.5px] font-bold" style={{ color: 'var(--text-secondary)' }}>Agent Pipeline</span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'var(--red-tint)' }}>
            <div className="pulse-ring relative">
              <div className="h-2 w-2 rounded-full" style={{ background: 'var(--red)' }} />
            </div>
            <span className="text-[10.5px] font-bold tracking-wider" style={{ color: 'var(--red)' }}>LIVE</span>
          </div>
        )}
        {allDone && (
          <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: 'var(--green-tint)' }}>
            <svg className="h-2.5 w-2.5" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[10.5px] font-bold tracking-wider" style={{ color: 'var(--green)' }}>DONE</span>
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div className="stagger flex-1 overflow-y-auto px-4 py-5">
        {PIPELINE.map((agent, i) => {
          const status = agentStatus[agent.id] || 'idle';
          const isActive = agent.id === activeAgent;
          const inPath = activePath.has(agent.id);
          const isDone = status === 'done';
          const isError = status === 'error';
          const isLast = i === PIPELINE.length - 1;
          const agentThought = [...thoughts].reverse().find((t) => t.agent === agent.id);

          return (
            <div key={agent.id} className="relative">
              {/* Connector with glow */}
              {!isLast && (
                <div
                  className="absolute left-[18px] top-[44px] w-[2px] transition-all duration-700"
                  style={{
                    height: '20px',
                    background: inPath && (isDone || isActive) ? agent.color : 'var(--bg-overlay)',
                    opacity: inPath ? 0.6 : 0.3,
                    boxShadow: isActive ? `0 0 8px ${agent.color}60` : isDone ? `0 0 4px ${agent.color}30` : 'none',
                  }}
                />
              )}

              {/* Node */}
              <div
                className="relative mb-2 flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-500"
                style={{
                  background: isActive ? `${agent.color}10` : 'transparent',
                  outline: isActive ? `1px solid ${agent.color}30` : '1px solid transparent',
                }}
              >
                <div className="relative shrink-0">
                  {isActive && (
                    <div
                      className="absolute -inset-2 rounded-xl"
                      style={{ background: agent.color, opacity: 0.08, animation: 'pulse 2s ease-in-out infinite' }}
                    />
                  )}
                  <div
                    className="relative flex h-[36px] w-[36px] items-center justify-center rounded-xl transition-all duration-500"
                    style={{
                      background: isActive ? agent.color : isDone ? agent.tint : isError ? 'var(--red-tint)' : inPath ? agent.tint : 'var(--bg-raised)',
                      boxShadow: isActive ? `0 4px 20px ${agent.color}50, 0 0 40px ${agent.color}20` : isDone ? `0 2px 8px ${agent.color}20` : 'none',
                    }}
                  >
                    {isDone ? (
                      <svg style={{ color: agent.color, width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isError ? (
                      <svg style={{ color: '#dc2626', width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : isActive ? (
                      <svg style={{ color: '#fff', width: 15, height: 15, animation: 'spin 1.5s linear infinite' }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg
                        style={{ color: inPath ? agent.color : 'var(--text-faint)', width: 15, height: 15 }}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={agent.icon} />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-[13px] font-semibold transition-colors duration-300"
                      style={{ color: isActive ? agent.color : isDone || inPath ? 'var(--text-secondary)' : 'var(--text-faint)' }}
                    >
                      {agent.label}
                    </p>
                    {isDone && (
                      <div className="flex h-4 items-center rounded-full px-1.5" style={{ background: `${agent.color}18` }}>
                        <svg style={{ color: agent.color, width: 8, height: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p
                    className="mt-0.5 truncate text-[11.5px] leading-snug transition-colors duration-300"
                    style={{ color: isActive ? 'var(--text-tertiary)' : isDone ? 'var(--text-faint)' : 'var(--text-ghost)' }}
                  >
                    {isActive && agentThought?.message ? agentThought.message : agent.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Idle state */}
        {thoughts.length === 0 && !isStreaming && (
          <div className="mt-4 text-center">
            <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-raised)' }}>
              <div className="orb" style={{ width: 60, height: 60, top: -5, left: -5, background: 'var(--aurora-1)', filter: 'blur(30px)' }} />
              <svg className="relative h-6 w-6" style={{ color: 'var(--text-ghost)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text-muted)' }}>Agents Idle</p>
            <p className="mx-auto mt-1 max-w-[140px] text-[12px] leading-snug" style={{ color: 'var(--text-ghost)' }}>
              Ask a question to activate the pipeline
            </p>
          </div>
        )}
      </div>

      {/* Footer with progress dots */}
      {thoughts.length > 0 && (
        <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-medium" style={{ color: 'var(--text-faint)' }}>
              {activePath.size} of {PIPELINE.length} agents
            </span>
            <div className="flex gap-1.5">
              {PIPELINE.map((a) => {
                const s = agentStatus[a.id];
                const isRunning = s === 'running';
                return (
                  <div key={a.id} className="relative">
                    {isRunning && (
                      <div
                        className="absolute -inset-1 rounded-full"
                        style={{ background: a.color, opacity: 0.2, animation: 'pulse 1.4s ease-in-out infinite' }}
                      />
                    )}
                    <div
                      className="relative h-2.5 w-2.5 rounded-full transition-all duration-500"
                      style={{
                        background: s === 'done' || isRunning ? a.color : activePath.has(a.id) ? `${a.color}50` : 'var(--bg-overlay)',
                        boxShadow: isRunning ? `0 0 10px ${a.color}80` : s === 'done' ? `0 0 4px ${a.color}40` : 'none',
                      }}
                      title={a.label}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
