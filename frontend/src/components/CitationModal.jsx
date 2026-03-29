import React, { useEffect } from 'react';

const TYPE_CONFIG = {
  source: { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', title: 'Data Source' },
  columns: { icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', title: 'Columns Analyzed' },
  operations: { icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', title: 'Transformations' },
  output: { icon: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', title: 'Output' },
};

export default function CitationModal({ citations, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!citations || citations.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div
        className="citation-modal relative z-10 w-full max-w-lg rounded-2xl p-0 shadow-2xl"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between rounded-t-2xl px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)' }}>
              <svg className="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>Data Lineage</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>How this result was generated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-110"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lineage Flow */}
        <div className="px-6 py-5">
          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute left-[19px] top-[40px]"
              style={{
                width: '2px',
                height: `calc(100% - 60px)`,
                background: 'linear-gradient(to bottom, var(--border-color), transparent)',
              }}
            />

            <div className="space-y-1">
              {citations.map((c, i) => {
                const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.source;
                return (
                  <div key={i} className="relative">
                    {/* Node */}
                    <div className="flex items-start gap-3 rounded-xl p-3 transition-all hover:scale-[1.01]" style={{ background: 'transparent' }}>
                      {/* Icon circle */}
                      <div
                        className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: cfg.bg, boxShadow: `0 0 20px ${cfg.bg}` }}
                      >
                        <svg className="h-5 w-5" style={{ color: cfg.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.title}</span>
                          {c.type === 'source' && (
                            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: cfg.bg, color: cfg.color }}>CSV</span>
                          )}
                        </div>

                        {/* Source file */}
                        {c.type === 'source' && (
                          <p className="mt-1 text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
                        )}

                        {/* Columns */}
                        {c.type === 'columns' && c.columns && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {c.columns.map((col, ci) => (
                              <span
                                key={ci}
                                className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                                style={{ background: cfg.bg, color: cfg.color }}
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Operations */}
                        {c.type === 'operations' && c.operations && (
                          <div className="mt-1.5 space-y-1">
                            {c.operations.map((op, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <span className="rounded px-1.5 py-0.5 text-[10.5px] font-bold" style={{ background: cfg.bg, color: cfg.color }}>{op.name}</span>
                                <span className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>{op.detail}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Output */}
                        {c.type === 'output' && (
                          <div className="mt-1 flex items-center gap-3">
                            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow between items */}
                    {i < citations.length - 1 && (
                      <div className="flex justify-center py-0.5" style={{ marginLeft: '15px' }}>
                        <svg className="h-4 w-4" style={{ color: 'var(--text-ghost)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between rounded-b-2xl px-6 py-3"
          style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
        >
          <span className="text-[10.5px]" style={{ color: 'var(--text-ghost)' }}>
            Auto-generated from analysis pipeline
          </span>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all hover:scale-105"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
