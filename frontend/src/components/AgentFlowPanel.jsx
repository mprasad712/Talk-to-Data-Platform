import React, { useMemo } from 'react';

const PIPELINE = [
  {
    id: 'orchestrator',
    label: 'Router',
    desc: 'Routes query to the right agent',
    icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
    color: '#cc0000',
  },
  {
    id: 'data_identifier',
    label: 'Data Scanner',
    desc: 'Analyzes schemas & relationships',
    icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    color: '#2563eb',
  },
  {
    id: 'code_generator',
    label: 'Code Generator',
    desc: 'Writes Python/Pandas analysis code',
    icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
    color: '#d97706',
  },
  {
    id: 'code_executor',
    label: 'Executor',
    desc: 'Runs code in secure sandbox',
    icon: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z',
    color: '#7c3aed',
  },
  {
    id: 'validator',
    label: 'Validator',
    desc: 'Checks results for accuracy',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#059669',
  },
  {
    id: 'synthesizer',
    label: 'Synthesizer',
    desc: 'Creates final business insights',
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
    color: '#0891b2',
  },
];

export default function AgentFlowPanel({ thoughts, isStreaming }) {
  // Derive agent statuses from thought trace
  const agentStatus = useMemo(() => {
    const status = {};
    for (const t of thoughts) {
      const current = status[t.agent];
      // running overrides idle, done overrides running, error overrides all
      if (t.status === 'error') {
        status[t.agent] = 'error';
      } else if (t.status === 'done') {
        if (current !== 'error') status[t.agent] = 'done';
      } else if (t.status === 'running') {
        if (!current || current === 'idle') status[t.agent] = 'running';
      }
    }
    return status;
  }, [thoughts]);

  // Find the active agent (last running one)
  const activeAgent = useMemo(() => {
    for (let i = thoughts.length - 1; i >= 0; i--) {
      if (thoughts[i].status === 'running') return thoughts[i].agent;
    }
    return null;
  }, [thoughts]);

  // Determine which agents are in the active path
  const activePath = useMemo(() => {
    const path = new Set();
    for (const t of thoughts) {
      path.add(t.agent);
    }
    return path;
  }, [thoughts]);

  const allDone = !isStreaming && thoughts.length > 0;

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--white)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--gray-200)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold" style={{ color: 'var(--gray-800)' }}>Agent Pipeline</span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: 'var(--red-light)' }}>
            <div className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--red)' }} />
            <span className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--red)' }}>RUNNING</span>
          </div>
        )}
        {allDone && (
          <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: 'var(--green-light)' }}>
            <svg className="h-2.5 w-2.5" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--green)' }}>DONE</span>
          </div>
        )}
      </div>

      {/* Pipeline visualization */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="relative">
          {PIPELINE.map((agent, i) => {
            const status = agentStatus[agent.id] || 'idle';
            const isActive = agent.id === activeAgent;
            const inPath = activePath.has(agent.id);
            const isDone = status === 'done';
            const isError = status === 'error';
            const isRunning = status === 'running';
            const isLast = i === PIPELINE.length - 1;

            // Find the message for this agent
            const agentThought = [...thoughts].reverse().find((t) => t.agent === agent.id);
            const message = agentThought?.message || '';

            return (
              <div key={agent.id} className="relative">
                {/* Connector line to next agent */}
                {!isLast && (
                  <div
                    className="absolute left-[19px] top-[40px] w-[2px]"
                    style={{
                      height: '32px',
                      background: inPath && (isDone || isRunning)
                        ? `linear-gradient(180deg, ${agent.color}, ${PIPELINE[i + 1] && activePath.has(PIPELINE[i + 1].id) ? PIPELINE[i + 1].color : 'var(--gray-200)'})`
                        : 'var(--gray-200)',
                      opacity: inPath ? 1 : 0.4,
                      transition: 'all 0.5s ease',
                    }}
                  />
                )}

                {/* Agent node */}
                <div
                  className="relative mb-3 flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-500"
                  style={{
                    background: isActive ? `${agent.color}08` : 'transparent',
                    border: isActive ? `1px solid ${agent.color}25` : '1px solid transparent',
                  }}
                >
                  {/* Icon circle */}
                  <div className="relative shrink-0">
                    {/* Pulse ring for active agent */}
                    {isActive && (
                      <div
                        className="absolute -inset-1 rounded-full"
                        style={{ background: agent.color, opacity: 0.15, animation: 'pulse 2s ease-in-out infinite' }}
                      />
                    )}
                    <div
                      className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl transition-all duration-500"
                      style={{
                        background: isDone ? `${agent.color}15`
                          : isActive ? agent.color
                          : isError ? 'var(--red-light)'
                          : inPath ? `${agent.color}10`
                          : 'var(--gray-100)',
                        boxShadow: isActive ? `0 0 0 3px ${agent.color}20` : 'none',
                      }}
                    >
                      {isDone ? (
                        <svg className="h-4.5 w-4.5" style={{ color: agent.color, width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isError ? (
                        <svg className="h-4 w-4" style={{ color: 'var(--red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : isActive ? (
                        <svg className="h-4 w-4" style={{ color: '#fff', animation: 'spin 2s linear infinite' }} fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          style={{ color: inPath ? agent.color : 'var(--gray-400)', width: '16px', height: '16px' }}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={agent.icon} />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="min-w-0 pt-0.5">
                    <p
                      className="text-[12px] font-semibold transition-colors duration-300"
                      style={{
                        color: isActive ? agent.color
                          : isDone ? 'var(--gray-700)'
                          : inPath ? 'var(--gray-600)'
                          : 'var(--gray-400)',
                      }}
                    >
                      {agent.label}
                    </p>
                    <p
                      className="mt-0.5 text-[10px] leading-snug transition-colors duration-300"
                      style={{
                        color: isActive || isDone ? 'var(--gray-500)' : 'var(--gray-300)',
                      }}
                    >
                      {isActive && message ? message : agent.desc}
                    </p>
                    {/* Duration badge */}
                    {isDone && agentThought?.timestamp && (
                      <span className="mt-1 inline-block rounded-full px-1.5 py-0.5 font-mono text-[9px]" style={{ background: `${agent.color}10`, color: agent.color }}>
                        completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Idle state */}
        {thoughts.length === 0 && !isStreaming && (
          <div className="mt-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--gray-100)' }}>
              <svg className="h-6 w-6" style={{ color: 'var(--gray-300)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <p className="text-[12px] font-medium" style={{ color: 'var(--gray-400)' }}>Agents Idle</p>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--gray-300)' }}>Ask a question to activate the pipeline</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      {thoughts.length > 0 && (
        <div className="shrink-0 border-t px-4 py-2.5" style={{ borderColor: 'var(--gray-100)', background: 'var(--gray-50)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: 'var(--gray-400)' }}>Agents used</span>
            <div className="flex gap-1">
              {PIPELINE.filter((a) => activePath.has(a.id)).map((a) => (
                <div
                  key={a.id}
                  className="h-2 w-2 rounded-full transition-all duration-300"
                  style={{
                    background: agentStatus[a.id] === 'done' ? a.color
                      : agentStatus[a.id] === 'running' ? a.color
                      : `${a.color}40`,
                  }}
                  title={a.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
