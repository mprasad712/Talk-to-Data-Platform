import React, { useCallback, useRef } from 'react';

export default function FilePanel({ files, uploading, error, onUpload, onRemove, sessionId }) {
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.csv'));
      if (droppedFiles.length > 0) onUpload(droppedFiles);
    },
    [onUpload]
  );

  const handleDragOver = (e) => e.preventDefault();

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) onUpload(selected);
    e.target.value = '';
  };

  return (
    <div className="flex h-full flex-col">
      {/* Red top accent */}
      <div className="h-1" style={{ background: 'var(--bain-red)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bain-border)' }}>
        <div>
          <p className="label-xs">Data Room</p>
          <h2 className="mt-0.5 text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>Source Files</h2>
        </div>
        <div
          className="flex h-7 min-w-[28px] items-center justify-center px-1 text-[11px] font-bold"
          style={{
            background: files.length > 0 ? 'var(--bain-red)' : 'var(--bain-gray-light)',
            color: files.length > 0 ? '#fff' : 'var(--text-muted)',
          }}
        >
          {files.length}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-3">
        {/* Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className={`group mb-3 cursor-pointer border-2 border-dashed p-4 text-center transition-all hover:border-red-400 hover:bg-red-50 ${uploading ? 'shimmer' : ''}`}
          style={{
            borderColor: uploading ? 'var(--bain-red)' : 'var(--bain-border)',
            background: uploading ? '#fef2f2' : 'transparent',
          }}
        >
          <input ref={inputRef} type="file" accept=".csv" multiple onChange={handleFileSelect} className="hidden" />
          <svg className="mx-auto mb-1.5 h-6 w-6 transition-colors group-hover:text-red-500" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {uploading ? (
            <p className="text-xs font-semibold" style={{ color: 'var(--bain-red)' }}>Uploading...</p>
          ) : (
            <>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Upload CSV</p>
              <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>Drop or click</p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-2 border-l-3 bg-red-50 px-3 py-2 text-xs font-medium" style={{ borderLeft: '3px solid var(--bain-red)', color: 'var(--bain-red-dark)' }}>
            {error}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {files.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No datasets uploaded</p>
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file, i) => (
                <div
                  key={file.filename}
                  className="animate-float-up group flex items-center gap-2.5 px-2 py-2 transition-colors hover:bg-gray-50"
                  style={{ borderBottom: '1px solid var(--bain-border)', animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center" style={{ background: 'var(--bain-red)' }}>
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{file.filename}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {file.row_count?.toLocaleString() || 0} rows &middot; {file.column_count || 0} cols
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(file.filename)}
                    className="p-1 opacity-0 transition-all hover:text-red-600 group-hover:opacity-100"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {sessionId && (
          <div className="mt-2 border-t pt-2" style={{ borderColor: 'var(--bain-border)' }}>
            <p className="truncate font-mono text-[10px]" style={{ color: 'var(--text-muted)' }} title={sessionId}>
              {sessionId.slice(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
