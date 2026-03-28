import React from 'react';

const FILE_COLORS = ['#dc2626', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4', '#22c55e'];

export default function RelationshipDiagram({ files, relationships }) {
  if (!relationships || relationships.length === 0) return null;

  const colorMap = {};
  (files || []).forEach((f, i) => { colorMap[f.filename] = FILE_COLORS[i % FILE_COLORS.length]; });

  return (
    <div className="space-y-2">
      {relationships.map((rel, i) => {
        const fromColor = colorMap[rel.from_file] || '#64748b';
        const toColor = colorMap[rel.to_file] || '#64748b';
        const fromCol = rel.from_column || rel.join_column || '?';
        const toCol = rel.to_column || rel.join_column || '?';

        return (
          <div
            key={i}
            className="fade-up rounded-lg p-2.5 transition-shadow duration-200"
            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-raised)', animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="truncate rounded-md px-1.5 py-[3px] text-[8.5px] font-bold text-white"
                style={{ background: fromColor, maxWidth: 75 }}
              >
                {rel.from_file.replace('.csv', '')}
              </span>
              <div className="flex flex-1 items-center">
                <div className="h-0 flex-1 border-t border-dashed" style={{ borderColor: 'var(--text-ghost)' }} />
                <svg className="-ml-px h-2.5 w-2.5 shrink-0" style={{ color: 'var(--text-faint)' }} fill="currentColor" viewBox="0 0 8 8">
                  <path d="M0 0l8 4-8 4z" />
                </svg>
              </div>
              <span
                className="truncate rounded-md px-1.5 py-[3px] text-[8.5px] font-bold text-white"
                style={{ background: toColor, maxWidth: 75 }}
              >
                {rel.to_file.replace('.csv', '')}
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between">
              <span className="font-mono text-[9px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                {fromCol === toCol ? fromCol : `${fromCol} → ${toCol}`}
              </span>
              <span
                className="rounded-md px-1.5 py-[2px] text-[8px] font-bold uppercase tracking-wide"
                style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
              >
                {rel.relationship_type}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
