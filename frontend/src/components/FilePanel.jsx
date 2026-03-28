import React, { useCallback, useRef } from 'react';

export default function FilePanel({ files, uploading, error, onUpload, onRemove, sessionId }) {
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.csv'));
    if (droppedFiles.length > 0) onUpload(droppedFiles);
  }, [onUpload]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: 'var(--gray-200)' }}>
        <span className="text-[12px] font-bold" style={{ color: 'var(--gray-800)' }}>Files</span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: files.length > 0 ? 'var(--red)' : 'var(--gray-200)', color: files.length > 0 ? '#fff' : 'var(--gray-500)' }}>
          {files.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-2.5">
        {/* Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`group mb-2 cursor-pointer rounded-lg border-2 border-dashed px-3 py-4 text-center transition-all hover:border-red-300 hover:bg-red-50 ${uploading ? 'shimmer' : ''}`}
          style={{ borderColor: uploading ? 'var(--red)' : 'var(--gray-200)' }}
        >
          <input ref={inputRef} type="file" accept=".csv" multiple onChange={(e) => { const s = Array.from(e.target.files); if (s.length > 0) onUpload(s); e.target.value = ''; }} className="hidden" />
          <svg className="mx-auto mb-1 h-5 w-5 transition-colors group-hover:text-red-400" style={{ color: 'var(--gray-300)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-[11px] font-semibold" style={{ color: uploading ? 'var(--red)' : 'var(--gray-600)' }}>
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </p>
        </div>

        {error && (
          <div className="mb-2 rounded border-l-2 px-2.5 py-1.5 text-[11px]" style={{ borderColor: 'var(--red)', background: 'var(--red-light)', color: 'var(--red-dark)' }}>
            {error}
          </div>
        )}

        {/* Files */}
        <div className="flex-1 space-y-1 overflow-y-auto">
          {files.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-[11px]" style={{ color: 'var(--gray-400)' }}>No files</p>
            </div>
          ) : files.map((file, i) => (
            <div key={file.filename} className="fade-up group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded" style={{ background: 'var(--red-light)' }}>
                <svg className="h-3 w-3" style={{ color: 'var(--red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium" style={{ color: 'var(--gray-700)' }}>{file.filename}</p>
                <p className="text-[9px]" style={{ color: 'var(--gray-400)' }}>{file.row_count?.toLocaleString()} rows &middot; {file.column_count} cols</p>
              </div>
              <button onClick={() => onRemove(file.filename)} className="p-0.5 opacity-0 transition hover:text-red-500 group-hover:opacity-100" style={{ color: 'var(--gray-400)' }}>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        {sessionId && (
          <div className="mt-1.5 border-t pt-1.5" style={{ borderColor: 'var(--gray-200)' }}>
            <p className="truncate font-mono text-[9px]" style={{ color: 'var(--gray-400)' }}>{sessionId.slice(0, 20)}...</p>
          </div>
        )}
      </div>
    </div>
  );
}
