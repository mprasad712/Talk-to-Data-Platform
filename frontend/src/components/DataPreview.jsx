import React from 'react';

const COLORS = [
  { main: '#dc2626', tint: 'var(--red-tint)' },
  { main: '#3b82f6', tint: 'var(--blue-tint)' },
  { main: '#f59e0b', tint: 'var(--amber-tint)' },
  { main: '#a855f7', tint: 'var(--purple-tint)' },
  { main: '#06b6d4', tint: 'var(--cyan-tint)' },
  { main: '#22c55e', tint: 'var(--green-tint)' },
];

export default function DataPreview({ files }) {
  if (!files || files.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
        Loaded Datasets
      </p>

      <div className="grid gap-2.5" style={{ gridTemplateColumns: files.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {files.map((file, i) => {
          const c = COLORS[i % COLORS.length];
          return (
            <div
              key={file.filename}
              className="glow-card overflow-hidden rounded-xl"
              style={{ border: '1px solid var(--border-color)', background: 'var(--bg-surface)', animationDelay: `${i * 60}ms` }}
            >
              {/* Color accent bar with glow */}
              <div className="h-[3px]" style={{ background: c.main, boxShadow: `0 0 10px ${c.main}40` }} />
              <div className="p-3.5">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: c.tint }}>
                    <svg className="h-4 w-4" style={{ color: c.main }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375" />
                    </svg>
                  </div>
                  <p className="min-w-0 truncate text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>{file.filename}</p>
                </div>

                <div className="mb-2.5 flex gap-4">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Rows</p>
                    <p className="font-mono text-[15px] font-bold" style={{ color: 'var(--text-secondary)' }}>{file.row_count?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Columns</p>
                    <p className="font-mono text-[15px] font-bold" style={{ color: 'var(--text-secondary)' }}>{file.column_count || '0'}</p>
                  </div>
                </div>

                {file.columns && file.columns.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {file.columns.slice(0, 4).map(col => {
                      const colName = typeof col === 'object' ? col.name : col;
                      return (
                        <span
                          key={colName}
                          className="rounded-md px-1.5 py-0.5 text-[9.5px] font-medium"
                          style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
                        >
                          {colName}
                        </span>
                      );
                    })}
                    {file.columns.length > 4 && (
                      <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-faint)' }}>
                        +{file.columns.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {files.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2" style={{ background: 'var(--bg-raised)' }}>
          <svg className="h-3.5 w-3.5" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <span className="text-[10.5px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Ask &ldquo;show relationships&rdquo; to see connections
          </span>
        </div>
      )}
    </div>
  );
}
