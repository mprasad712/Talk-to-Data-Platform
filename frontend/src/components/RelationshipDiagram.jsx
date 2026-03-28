import React from 'react';

const FILE_COLORS = ['var(--red)', 'var(--blue)', 'var(--amber)', 'var(--purple)', 'var(--cyan)', 'var(--green)'];

/**
 * Compact relationship view for sidebar — shows dotted-arrow connections
 */
export default function RelationshipDiagram({ files, relationships }) {
  if (!relationships || relationships.length === 0) return null;

  // Assign colors to files
  const colorMap = {};
  (files || []).forEach((f, i) => { colorMap[f.filename] = FILE_COLORS[i % FILE_COLORS.length]; });

  return (
    <div className="space-y-1.5">
      {relationships.map((rel, i) => (
        <div key={i} className="fade-up rounded-md border px-2 py-1.5" style={{ borderColor: 'var(--gray-200)', background: 'var(--gray-50)', animationDelay: `${i * 40}ms` }}>
          {/* Files connected */}
          <div className="flex items-center gap-1">
            <span className="truncate rounded px-1 py-0.5 text-[8px] font-bold text-white" style={{ background: colorMap[rel.from_file] || 'var(--gray-500)', maxWidth: 70 }}>
              {rel.from_file.replace('.csv', '')}
            </span>
            <div className="flex flex-1 items-center">
              <div className="h-0 flex-1 border-t border-dashed" style={{ borderColor: 'var(--gray-400)' }} />
              <svg className="h-2 w-2 shrink-0 -ml-px" style={{ color: 'var(--gray-400)' }} fill="currentColor" viewBox="0 0 8 8">
                <path d="M0 0l8 4-8 4z" />
              </svg>
            </div>
            <span className="truncate rounded px-1 py-0.5 text-[8px] font-bold text-white" style={{ background: colorMap[rel.to_file] || 'var(--gray-500)', maxWidth: 70 }}>
              {rel.to_file.replace('.csv', '')}
            </span>
          </div>
          {/* Join details */}
          <div className="mt-1 flex items-center justify-between">
            <span className="font-mono text-[8px] font-bold" style={{ color: 'var(--gray-600)' }}>
              {rel.join_column}
            </span>
            <span className="rounded px-1 py-0.5 text-[7px] font-semibold" style={{ background: 'var(--gray-200)', color: 'var(--gray-500)' }}>
              {rel.relationship_type}
            </span>
          </div>
          {rel.match_type === 'fuzzy' && (
            <p className="mt-0.5 text-[7px] italic" style={{ color: 'var(--amber)' }}>fuzzy match</p>
          )}
        </div>
      ))}
    </div>
  );
}
