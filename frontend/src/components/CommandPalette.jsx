import React, { useState, useEffect, useRef, useCallback } from 'react';

const ACTIONS = [
  { id: 'ask-data', label: 'What data do I have?', category: 'Quick Queries', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', color: '#3b82f6' },
  { id: 'top-revenue', label: 'Top 10 by revenue', category: 'Quick Queries', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', color: '#22c55e' },
  { id: 'relationships', label: 'Show all relationships', category: 'Quick Queries', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5', color: '#a855f7' },
  { id: 'summary', label: 'Sales performance summary', category: 'Quick Queries', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z', color: '#f59e0b' },
  { id: 'clean-report', label: 'Show data cleaning summary', category: 'Quick Queries', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3', color: '#06b6d4' },
  { id: 'toggle-theme', label: 'Toggle dark/light theme', category: 'Settings', icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z', color: '#f59e0b' },
  { id: 'toggle-agents', label: 'Toggle agent panel', category: 'Settings', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', color: '#dc2626' },
  { id: 'export-chat', label: 'Export conversation as Markdown', category: 'Tools', icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3', color: '#a855f7' },
  { id: 'fullscreen', label: 'Toggle focus mode', category: 'Settings', icon: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15', color: '#22c55e' },
  { id: 'clear-chat', label: 'Clear current conversation', category: 'Tools', icon: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0', color: '#dc2626' },
];

export default function CommandPalette({ open, onClose, onAction }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = query.trim()
    ? ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()))
    : ACTIONS;

  const grouped = filtered.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatFiltered[selectedIdx]) {
      e.preventDefault();
      onAction(flatFiltered[selectedIdx].id);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [flatFiltered, selectedIdx, onAction, onClose]);

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="slide-up w-full max-w-lg overflow-hidden rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <svg className="h-5 w-5 shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, queries, or settings..."
            className="flex-1 bg-transparent text-[14px] focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)', border: '1px solid var(--border-color)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          {flatFiltered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No results found</p>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--text-faint)' }}>Try a different search term</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, actions]) => (
              <div key={category} className="mb-1">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  {category}
                </p>
                {actions.map((action) => {
                  flatIdx++;
                  const isSelected = flatIdx === selectedIdx;
                  const idx = flatIdx;
                  return (
                    <button
                      key={action.id}
                      onClick={() => { onAction(action.id); onClose(); }}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                      style={{
                        background: isSelected ? 'var(--bg-raised)' : 'transparent',
                        outline: isSelected ? '1px solid var(--border-glow)' : 'none',
                      }}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${action.color}15` }}
                      >
                        <svg className="h-4 w-4" style={{ color: action.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                        </svg>
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {action.label}
                      </span>
                      {isSelected && (
                        <kbd className="ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)' }}>
                          Enter
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-raised)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <kbd className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)', border: '1px solid var(--border-color)' }}>↑</kbd>
              <kbd className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)', border: '1px solid var(--border-color)' }}>↓</kbd>
              <span className="text-[9px]" style={{ color: 'var(--text-ghost)' }}>navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)', border: '1px solid var(--border-color)' }}>Enter</kbd>
              <span className="text-[9px]" style={{ color: 'var(--text-ghost)' }}>select</span>
            </div>
          </div>
          <span className="text-[9px] font-medium" style={{ color: 'var(--text-ghost)' }}>{flatFiltered.length} results</span>
        </div>
      </div>
    </div>
  );
}
