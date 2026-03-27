import React from 'react';

const AGENTS = {
  orchestrator: { color: '#cc0000', label: 'Orchestrator' },
  data_identifier: { color: '#2563eb', label: 'Data Identifier' },
  code_generator: { color: '#d97706', label: 'Code Generator' },
  code_executor: { color: '#7c3aed', label: 'Code Executor' },
  validator: { color: '#059669', label: 'Validator' },
  synthesizer: { color: '#0891b2', label: 'Synthesizer' },
};

export default function ThoughtStep({ thought, index }) {
  const agent = AGENTS[thought.agent] || AGENTS.orchestrator;
  const isRunning = thought.status === 'running';
  const isDone = thought.status === 'done';
  const isError = thought.status === 'error';

  return (
    <div
      className="animate-float-up bg-white"
      style={{ borderLeft: `3px solid ${agent.color}`, border: '1px solid var(--bain-border)', borderLeftWidth: 3, borderLeftColor: agent.color, animationDelay: `${index * 25}ms` }}
    >
      <div className="px-3 py-2.5">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Status */}
            {isRunning ? (
              <svg className="h-3.5 w-3.5 animate-spin" style={{ color: agent.color }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isDone ? (
              <svg className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : isError ? (
              <svg className="h-3.5 w-3.5" style={{ color: 'var(--bain-red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border" style={{ borderColor: 'var(--bain-border)' }} />
            )}

            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: agent.color }}>
              {agent.label}
            </span>
          </div>

          {thought.timestamp && (
            <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {new Date(thought.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{thought.message}</p>

        {thought.code && (
          <pre className="mt-1.5 max-h-28 overflow-auto px-2.5 py-2 text-[11px]" style={{ background: 'var(--bain-dark)', color: '#ddd' }}>
            <code>{thought.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
