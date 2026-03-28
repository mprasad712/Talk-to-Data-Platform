import React from 'react';

const COLORS = ['var(--red)', 'var(--blue)', 'var(--amber)', 'var(--purple)', 'var(--cyan)', 'var(--green)'];

export default function DataPreview({ files }) {
  if (!files || files.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--gray-400)' }}>
        Your Datasets ({files.length})
      </p>

      <div className="grid gap-2" style={{ gridTemplateColumns: files.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {files.map((file, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div
              key={file.filename}
              className="fade-up overflow-hidden rounded-lg border bg-white"
              style={{ borderColor: 'var(--gray-200)', animationDelay: `${i * 60}ms` }}
            >
              {/* Color bar */}
              <div className="h-1" style={{ background: color }} />

              <div className="p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded" style={{ background: color }}>
                    <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold" style={{ color: 'var(--gray-800)' }}>{file.filename}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3">
                  <Stat label="Rows" value={file.row_count?.toLocaleString() || '0'} />
                  <Stat label="Columns" value={file.column_count || '0'} />
                </div>

                {/* Column preview if available */}
                {file.columns && file.columns.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {file.columns.slice(0, 4).map(col => {
                      const colName = typeof col === 'object' ? col.name : col;
                      return (
                        <span key={colName} className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium" style={{ color: 'var(--gray-500)' }}>
                          {colName}
                        </span>
                      );
                    })}
                    {file.columns.length > 4 && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium" style={{ color: 'var(--gray-400)' }}>
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

      {/* Relationship hint */}
      {files.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-md py-1.5" style={{ background: 'var(--gray-100)' }}>
          <svg className="h-3 w-3" style={{ color: 'var(--gray-400)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
          </svg>
          <span className="text-[10px] font-medium" style={{ color: 'var(--gray-500)' }}>
            {files.length} datasets — ask "show relationships" to see how they connect
          </span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-medium" style={{ color: 'var(--gray-400)' }}>{label}</p>
      <p className="text-[14px] font-bold" style={{ color: 'var(--gray-800)' }}>{value}</p>
    </div>
  );
}
