import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from './Toast';
import MessageFeedback from './MessageFeedback';
import CitationModal from './CitationModal';

const ROWS_PER_PAGE = 25;

const CITATION_COLORS = {
  source: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  columns: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  operations: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  output: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

export default function ChatMessage({ message, index }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const { addToast } = useToast();
  const [hovering, setHovering] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showCitations, setShowCitations] = useState(false);

  const copyContent = () => {
    navigator.clipboard.writeText(message.content);
    addToast('Copied to clipboard');
  };

  const downloadTable = () => {
    // Use full CSV data from backend if available
    if (message.csv) {
      const blob = new Blob([message.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bcn-result.csv';
      a.click();
      URL.revokeObjectURL(url);
      addToast('Full dataset downloaded as CSV');
      return;
    }
    // Fallback: parse from markdown
    const { tableMarkdown } = splitTableAndText(message.content);
    if (!tableMarkdown) return;
    const rows = tableMarkdown.split('\n').filter(l => l.trim() && !l.includes('---'));
    const csv = rows.map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bcn-result.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Table downloaded as CSV');
  };

  const timeStr = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  if (isUser) {
    return (
      <div className="fade-up mb-6 flex flex-col items-end" style={{ animationDelay: `${index * 20}ms` }}>
        <div
          className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3"
          style={{ background: 'var(--user-bubble)', boxShadow: 'var(--user-bubble-shadow)' }}
        >
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-white">{message.content}</p>
        </div>
        {timeStr && (
          <span className="mt-1 mr-1 text-[10.5px] font-medium" style={{ color: 'var(--timestamp-color)' }}>{timeStr}</span>
        )}
      </div>
    );
  }

  const { tableMarkdown, textContent } = splitTableAndText(message.content);

  // Parse table rows for pagination
  const tableData = useMemo(() => {
    if (!tableMarkdown) return null;
    const lines = tableMarkdown.split('\n').filter(l => l.trim());
    if (lines.length < 2) return null;
    const headerLine = lines[0];
    const dataLines = lines.filter(l => !l.includes('---') && l !== headerLine);
    const headers = headerLine.split('|').filter(c => c.trim()).map(c => c.trim());
    const rows = dataLines.map(l => l.split('|').filter(c => c.trim()).map(c => c.trim()));
    return { headers, rows };
  }, [tableMarkdown]);

  const totalPages = tableData ? Math.ceil(tableData.rows.length / ROWS_PER_PAGE) : 0;
  const paginatedRows = tableData ? tableData.rows.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE) : [];

  // Check if there's a "Showing top X of Y rows" note
  const truncationNote = tableMarkdown && tableMarkdown.match(/\*Showing top \d+ of ([\d,]+) rows\*/);
  const totalRowCount = truncationNote ? truncationNote[1] : (tableData ? String(tableData.rows.length) : '0');

  return (
    <div
      className="fade-up group mb-6"
      style={{ animationDelay: `${index * 20}ms` }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Agent label + actions */}
      <div className="mb-2.5 flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: isError
              ? 'var(--red-tint)'
              : 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
            boxShadow: isError ? 'none' : '0 2px 8px rgba(220,38,38,0.3)',
          }}
        >
          {isError ? (
            <svg className="h-4 w-4" style={{ color: 'var(--red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="2.5"/>
              <circle cx="12" cy="4" r="1.8"/>
              <circle cx="18.9" cy="8" r="1.8"/>
              <circle cx="18.9" cy="16" r="1.8"/>
              <circle cx="12" cy="20" r="1.8"/>
              <circle cx="5.1" cy="16" r="1.8"/>
              <circle cx="5.1" cy="8" r="1.8"/>
              <rect x="11.4" y="5.5" width="1.2" height="4.5" rx="0.6"/>
              <rect x="11.4" y="14" width="1.2" height="4.5" rx="0.6" />
              <rect x="14" y="10.5" width="1.2" height="4.5" rx="0.6" transform="rotate(60 14.6 12.75)"/>
              <rect x="8.8" y="10.5" width="1.2" height="4.5" rx="0.6" transform="rotate(-60 9.4 12.75)"/>
              <rect x="14" y="10.5" width="1.2" height="4.5" rx="0.6" transform="rotate(120 14.6 12.75)"/>
              <rect x="8.8" y="10.5" width="1.2" height="4.5" rx="0.6" transform="rotate(-120 9.4 12.75)"/>
            </svg>
          )}
        </div>
        <span className="text-[13px] font-semibold" style={{ color: isError ? 'var(--red)' : 'var(--text-muted)' }}>
          {isError ? 'Error' : 'Coro'}
        </span>
        {timeStr && (
          <span className="text-[10.5px] font-medium" style={{ color: 'var(--timestamp-color)' }}>{timeStr}</span>
        )}

        {/* Action buttons - show on hover */}
        {!isError && hovering && (
          <div className="fade-in ml-auto flex items-center gap-1.5">
            <MessageFeedback messageIndex={index} />
            <div className="h-3 w-px" style={{ background: 'var(--border-color)' }} />
            <ActionButton
              icon="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
              label="Copy"
              onClick={copyContent}
            />
            {tableMarkdown && (
              <ActionButton
                icon="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                label="CSV"
                onClick={downloadTable}
              />
            )}
          </div>
        )}
      </div>

      {/* Message body */}
      <div className="ml-[38px]">
        {isError && (
          <div
            className="rounded-xl px-4 py-3"
            style={{ borderLeft: '3px solid var(--red)', background: 'var(--red-tint)' }}
          >
            <div className="prose max-w-none text-[14px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {!isError && (
          <>
            {tableData && (
              <div
                className="mb-3 overflow-hidden rounded-xl"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: 'var(--blue-tint)' }}>
                    <svg className="h-3.5 w-3.5" style={{ color: 'var(--blue)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375" />
                    </svg>
                  </div>
                  <span className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--blue)' }}>Data Result</span>
                  <span className="text-[10.5px] font-medium" style={{ color: 'var(--text-faint)' }}>
                    {totalRowCount} rows
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={downloadTable}
                    className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
                  >
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export
                  </button>
                </div>
                <div className="overflow-x-auto" style={{ background: 'var(--bg-raised)' }}>
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        {tableData.headers.map((h, i) => (
                          <th key={i} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
                              {cell || <span style={{ color: 'var(--text-faint)' }}>(blank)</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)' }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-faint)' }}>
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="rounded px-2 py-1 text-[11px] font-medium transition-all disabled:opacity-30"
                        style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="rounded px-2 py-1 text-[11px] font-medium transition-all disabled:opacity-30"
                        style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {textContent && (
              <div
                className="rounded-xl px-4 py-3.5"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
              >
                <div className="prose max-w-none text-[14px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Citation pills */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>Sources</span>
                {message.citations.map((c, ci) => {
                  const cc = CITATION_COLORS[c.type] || CITATION_COLORS.source;
                  return (
                    <button
                      key={ci}
                      onClick={() => setShowCitations(true)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all hover:scale-105"
                      style={{ background: cc.bg, color: cc.color, border: `1px solid ${cc.bg}` }}
                    >
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold" style={{ background: cc.color, color: '#fff' }}>
                        {ci + 1}
                      </span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Citation Modal */}
      {showCitations && (
        <CitationModal citations={message.citations} onClose={() => setShowCitations(false)} />
      )}
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium transition-all hover:scale-105"
      style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {label}
    </button>
  );
}

function splitTableAndText(content) {
  if (!content) return { tableMarkdown: null, textContent: null };

  const separatorIdx = content.indexOf('\n\n---\n\n');
  if (separatorIdx !== -1) {
    const before = content.substring(0, separatorIdx).trim();
    const after = content.substring(separatorIdx + 7).trim();
    if (before.includes('|') && before.includes('---')) {
      return { tableMarkdown: before, textContent: after || null };
    }
  }

  const lines = content.split('\n');
  const tableLines = [];
  const textLines = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableLines.push(line);
    } else if (inTable && trimmed === '') {
      inTable = false;
      textLines.push(line);
    } else {
      inTable = false;
      textLines.push(line);
    }
  }

  const table = tableLines.length > 2 ? tableLines.join('\n') : null;
  const text = textLines.join('\n').trim() || null;
  return { tableMarkdown: table, textContent: text || (table ? null : content) };
}
