import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMessage({ message, index }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  if (isUser) {
    return (
      <div className="fade-up mb-5 flex justify-end" style={{ animationDelay: `${index * 20}ms` }}>
        <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 shadow-sm" style={{ background: 'var(--dark)' }}>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white">{message.content}</p>
        </div>
      </div>
    );
  }

  // Separate markdown table from text content
  const { tableMarkdown, textContent } = splitTableAndText(message.content);

  return (
    <div className="fade-up mb-5" style={{ animationDelay: `${index * 20}ms` }}>
      {/* Agent avatar + name */}
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
          style={{ background: isError ? 'var(--red)' : 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)' }}
        >
          {isError ? (
            <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )}
        </div>
        <span className="text-[11px] font-semibold" style={{ color: isError ? 'var(--red)' : 'var(--gray-500)' }}>
          {isError ? 'Error' : 'BCN Analyst'}
        </span>
      </div>

      {/* Message body */}
      <div className="ml-9">
        {/* Error state */}
        {isError && (
          <div
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: 'rgba(204,0,0,0.15)', background: 'var(--red-light)', borderLeft: '3px solid var(--red)' }}
          >
            <div className="prose max-w-none text-[13px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Normal answer */}
        {!isError && (
          <>
            {/* Data table card */}
            {tableMarkdown && (
              <div className="mb-3 overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: 'var(--gray-200)' }}>
                <div className="flex items-center gap-1.5 px-4 py-2" style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  <svg className="h-3.5 w-3.5" style={{ color: 'var(--blue)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--blue)' }}>
                    Data Result
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{tableMarkdown}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Insight text */}
            {textContent && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-100)' }}
              >
                <div className="prose max-w-none text-[13px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Split combined content into markdown table and text sections.
 * The backend sends: table_markdown + "\n\n---\n\n" + insight_text
 */
function splitTableAndText(content) {
  if (!content) return { tableMarkdown: null, textContent: null };

  // Check for the separator pattern
  const separatorIdx = content.indexOf('\n\n---\n\n');
  if (separatorIdx !== -1) {
    const before = content.substring(0, separatorIdx).trim();
    const after = content.substring(separatorIdx + 7).trim();

    // Check if the "before" part contains a markdown table
    if (before.includes('|') && before.includes('---')) {
      return { tableMarkdown: before, textContent: after || null };
    }
  }

  // Check if the entire content is/has a table
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
