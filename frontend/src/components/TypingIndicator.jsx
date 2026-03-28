import React, { useMemo } from 'react';

const AGENT_META = {
  orchestrator: { label: 'Router', color: '#dc2626' },
  data_identifier: { label: 'Data Scanner', color: '#3b82f6' },
  code_generator: { label: 'Code Generator', color: '#f59e0b' },
  code_executor: { label: 'Executor', color: '#a855f7' },
  validator: { label: 'Validator', color: '#22c55e' },
  synthesizer: { label: 'Synthesizer', color: '#06b6d4' },
};

export default function TypingIndicator({ thoughts, isStreaming }) {
  const activeAgent = useMemo(() => {
    for (let i = thoughts.length - 1; i >= 0; i--) {
      if (thoughts[i].status === 'running') return thoughts[i];
    }
    return null;
  }, [thoughts]);

  if (!isStreaming || !activeAgent) return null;

  const meta = AGENT_META[activeAgent.agent] || { label: activeAgent.agent, color: '#dc2626' };

  return (
    <div className="fade-in mb-4 ml-[38px]">
      <div
        className="inline-flex items-center gap-2.5 rounded-2xl rounded-bl-sm px-4 py-2.5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
      >
        {/* Agent avatar */}
        <div
          className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${meta.color}20` }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: meta.color, animation: 'pulse 1.4s ease-in-out infinite' }}
          />
          {/* Ping ring */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{ border: `1.5px solid ${meta.color}`, animation: 'pulseRing 2s cubic-bezier(0,0,0.2,1) infinite' }}
          />
        </div>

        {/* Agent name + message */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {activeAgent.message || 'is thinking...'}
          </span>
        </div>

        {/* Animated dots */}
        <div className="flex gap-0.5">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
          <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: meta.color, animationDelay: '200ms' }} />
          <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: meta.color, animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
}
