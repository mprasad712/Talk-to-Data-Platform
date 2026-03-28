import React, { useState, useEffect, useRef } from 'react';

const AGENTS = {
  orchestrator: { color: 'var(--red)', label: 'Router' },
  data_identifier: { color: 'var(--blue)', label: 'Data Scanner' },
  code_generator: { color: 'var(--amber)', label: 'Code Gen' },
  code_executor: { color: 'var(--purple)', label: 'Executor' },
  validator: { color: 'var(--green)', label: 'Validator' },
  synthesizer: { color: 'var(--cyan)', label: 'Synthesizer' },
};

export default function ThinkingDropdown({ thoughts, isStreaming }) {
  const [expanded, setExpanded] = useState(false);
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Auto-expand while streaming, collapse when done
  useEffect(() => {
    if (isStreaming) {
      setExpanded(true);
      startTime.current = Date.now();
    }
  }, [isStreaming]);

  // Track elapsed time
  useEffect(() => {
    if (!isStreaming) {
      setElapsed(Math.round((Date.now() - startTime.current) / 1000));
      return;
    }
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  if (thoughts.length === 0 && !isStreaming) return null;

  // Count unique completed agents
  const doneAgents = new Set(thoughts.filter((t) => t.status === 'done').map((t) => t.agent));
  const currentAgent = thoughts.length > 0 ? thoughts[thoughts.length - 1] : null;
  const currentAgentInfo = currentAgent ? (AGENTS[currentAgent.agent] || AGENTS.orchestrator) : null;

  return (
    <div className="fade-up mb-4 ml-9">
      {/* Header — clickable toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-all hover:bg-gray-100"
        style={{ background: expanded ? 'var(--gray-100)' : 'transparent' }}
      >
        {/* Chevron */}
        <svg
          className="h-3 w-3 shrink-0 transition-transform"
          style={{ color: 'var(--gray-400)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>

        {/* Status text */}
        {isStreaming ? (
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5" style={{ color: currentAgentInfo?.color || 'var(--red)', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-[12px] font-medium" style={{ color: 'var(--gray-500)' }}>
              {currentAgent?.message || 'Thinking...'}
            </span>
            <span className="font-mono text-[10px]" style={{ color: 'var(--gray-400)' }}>{elapsed}s</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5" style={{ color: 'var(--gray-400)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-[12px] font-medium" style={{ color: 'var(--gray-500)' }}>
              Analyzed using {doneAgents.size} agent{doneAgents.size !== 1 ? 's' : ''}
            </span>
            <span className="font-mono text-[10px]" style={{ color: 'var(--gray-400)' }}>{elapsed}s</span>
          </div>
        )}
      </button>

      {/* Expanded trace content */}
      {expanded && (
        <div className="ml-5 mt-1 border-l-2 pl-3" style={{ borderColor: 'var(--gray-200)' }}>
          {thoughts.map((t, i) => {
            const agent = AGENTS[t.agent] || AGENTS.orchestrator;
            const isDone = t.status === 'done';
            const isRunning = t.status === 'running';
            const isError = t.status === 'error';

            return (
              <div
                key={i}
                className="flex items-start gap-2 py-1"
                style={{ opacity: isDone ? 0.6 : 1 }}
              >
                {/* Status dot */}
                {isRunning ? (
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: agent.color, animation: 'pulse 1.4s ease-in-out infinite' }} />
                ) : isDone ? (
                  <svg className="mt-0.5 h-3 w-3 shrink-0" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isError ? (
                  <svg className="mt-0.5 h-3 w-3 shrink-0" style={{ color: 'var(--red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--gray-300)' }} />
                )}

                <div className="min-w-0">
                  <span className="text-[11px] font-semibold" style={{ color: agent.color }}>
                    {agent.label}
                  </span>
                  <span className="ml-1.5 text-[11px]" style={{ color: 'var(--gray-500)' }}>
                    {t.message}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
