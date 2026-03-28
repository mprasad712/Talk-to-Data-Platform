import React, { useState, useRef, useCallback } from 'react';
import RelationshipDiagram from './RelationshipDiagram';

export default function Sidebar({
  sessions, activeSessionIdx, onSelectSession, onSaveSession,
  memorySettings, onMemorySettingsChange, fileManager,
}) {
  const [tab, setTab] = useState('files');
  const [expandedReport, setExpandedReport] = useState(null); // filename or null
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.csv'));
    if (droppedFiles.length > 0) fileManager.upload(droppedFiles);
  }, [fileManager]);

  const handleFileSelect = useCallback((e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) fileManager.upload(selected);
    e.target.value = '';
  }, [fileManager]);

  const files = fileManager?.files || [];
  const uploading = fileManager?.uploading || false;
  const uploadError = fileManager?.error || null;
  const cleaningReports = fileManager?.cleaningReports || {};
  const hasReports = Object.keys(cleaningReports).length > 0;

  return (
    <div className="flex w-[240px] shrink-0 flex-col border-r bg-white" style={{ borderColor: 'var(--gray-200)' }}>
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--gray-200)' }}>
        {['files', 'sessions', 'memory'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors"
            style={{
              color: tab === t ? 'var(--red)' : 'var(--gray-400)',
              borderBottom: tab === t ? '2px solid var(--red)' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── FILES TAB ── */}
      {tab === 'files' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Upload zone */}
          <div className="shrink-0 p-2.5 pb-0">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className={`group mb-2 cursor-pointer rounded-lg border-2 border-dashed px-3 py-4 text-center transition-all hover:border-red-300 hover:bg-red-50 ${uploading ? 'shimmer' : ''}`}
              style={{ borderColor: uploading ? 'var(--red)' : 'var(--gray-200)' }}
            >
              <input ref={inputRef} type="file" accept=".csv" multiple onChange={handleFileSelect} className="hidden" />
              <svg className="mx-auto mb-1 h-5 w-5 transition-colors group-hover:text-red-400" style={{ color: uploading ? 'var(--red)' : 'var(--gray-300)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-[11px] font-semibold" style={{ color: uploading ? 'var(--red)' : 'var(--gray-600)' }}>
                {uploading ? 'Cleaning & uploading...' : 'Upload CSV Files'}
              </p>
              <p className="mt-0.5 text-[9px]" style={{ color: 'var(--gray-400)' }}>Auto-cleans duplicates & blanks</p>
            </div>

            {uploadError && (
              <div className="mb-2 rounded border-l-2 px-2.5 py-1.5 text-[11px]" style={{ borderColor: 'var(--red)', background: 'var(--red-light)', color: 'var(--red-dark)' }}>
                {uploadError}
              </div>
            )}
          </div>

          {/* File list + cleaning reports */}
          <div className="flex-1 overflow-y-auto px-2.5 pb-2">
            {files.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto mb-1.5 h-6 w-6" style={{ color: 'var(--gray-300)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-[11px]" style={{ color: 'var(--gray-400)' }}>No files uploaded</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {files.map((file, i) => {
                  const report = cleaningReports[file.filename];
                  const isExpanded = expandedReport === file.filename;
                  return (
                    <div key={file.filename} className="fade-up overflow-hidden rounded-lg border" style={{ borderColor: 'var(--gray-200)', animationDelay: `${i * 30}ms` }}>
                      {/* File row */}
                      <div className="group flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded" style={{ background: 'var(--red-light)' }}>
                          <svg className="h-3.5 w-3.5" style={{ color: 'var(--red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium" style={{ color: 'var(--gray-700)' }}>{file.filename}</p>
                          <p className="text-[9px]" style={{ color: 'var(--gray-400)' }}>
                            {file.row_count?.toLocaleString()} rows &middot; {file.column_count} cols
                          </p>
                        </div>
                        <button
                          onClick={() => fileManager.removeFile(file.filename)}
                          className="p-0.5 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                          style={{ color: 'var(--gray-400)' }}
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Cleaning summary — sticky badge */}
                      {report && report.steps.length > 0 && (
                        <div
                          className="cursor-pointer border-t px-2 py-1.5"
                          style={{ borderColor: 'var(--gray-100)', background: 'var(--green-light, #ecfdf5)' }}
                          onClick={() => setExpandedReport(isExpanded ? null : file.filename)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <svg className="h-3 w-3" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--green)' }}>
                                Cleaned
                              </span>
                            </div>
                            <span className="text-[9px] font-medium" style={{ color: 'var(--gray-500)' }}>
                              {report.rows_removed > 0 ? `${report.rows_removed} rows removed` : 'No issues'}
                              {' '}
                              <span style={{ color: 'var(--gray-400)' }}>{isExpanded ? '▲' : '▼'}</span>
                            </span>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="mt-1.5 space-y-1">
                              {report.steps.map((step, si) => (
                                <div key={si} className="flex items-start gap-1.5">
                                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: step.action.includes('Removed') ? 'var(--red)' : step.action.includes('Detected') ? 'var(--amber)' : 'var(--green)' }} />
                                  <div>
                                    <p className="text-[10px] font-semibold" style={{ color: 'var(--gray-700)' }}>{step.action}</p>
                                    <p className="text-[9px] leading-snug" style={{ color: 'var(--gray-500)' }}>{step.detail}</p>
                                    {step.high_dup_columns && step.high_dup_columns.length > 0 && (
                                      <p className="mt-0.5 text-[9px]" style={{ color: 'var(--gray-400)' }}>
                                        High-dup columns: {step.high_dup_columns.join(', ')}
                                      </p>
                                    )}
                                    {step.columns && (
                                      <div className="mt-0.5 flex flex-wrap gap-1">
                                        {Object.entries(step.columns).slice(0, 4).map(([col, info]) => (
                                          <span key={col} className="rounded px-1 py-0.5 text-[8px] font-medium" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--amber)' }}>
                                            {col}: {info.null_pct}% null
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div className="mt-1 flex items-center justify-between rounded px-1.5 py-1" style={{ background: 'rgba(5,150,105,0.06)' }}>
                                <span className="text-[9px]" style={{ color: 'var(--gray-500)' }}>Before</span>
                                <span className="font-mono text-[9px] font-bold" style={{ color: 'var(--gray-600)' }}>{report.original_rows.toLocaleString()} rows</span>
                              </div>
                              <div className="flex items-center justify-between rounded px-1.5 py-1" style={{ background: 'rgba(5,150,105,0.06)' }}>
                                <span className="text-[9px]" style={{ color: 'var(--gray-500)' }}>After</span>
                                <span className="font-mono text-[9px] font-bold" style={{ color: 'var(--green)' }}>{report.final_rows.toLocaleString()} rows</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Relationships */}
          {(fileManager?.relationships || []).length > 0 && (
            <div className="shrink-0 border-t px-2.5 py-2" style={{ borderColor: 'var(--gray-200)' }}>
              <div className="mb-1.5 flex items-center gap-1">
                <svg className="h-3 w-3" style={{ color: 'var(--gray-500)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--gray-500)' }}>
                  Joins ({fileManager.relationships.length})
                </span>
              </div>
              <RelationshipDiagram files={files} relationships={fileManager.relationships} />
            </div>
          )}
        </div>
      )}

      {/* ── SESSIONS TAB ── */}
      {tab === 'sessions' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="p-2">
            <button
              onClick={onSaveSession}
              className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: 'var(--red)' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Save Session
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg className="mb-2 h-6 w-6" style={{ color: 'var(--gray-300)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-[11px]" style={{ color: 'var(--gray-400)' }}>No saved sessions</p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--gray-400)' }}>Chat history will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(i)}
                    className="slide-in group w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-gray-50"
                    style={{
                      background: activeSessionIdx === i ? 'var(--red-light)' : 'transparent',
                      animationDelay: `${i * 30}ms`,
                    }}
                  >
                    <p className="truncate text-[12px] font-medium" style={{ color: activeSessionIdx === i ? 'var(--red)' : 'var(--gray-700)' }}>
                      {s.name}
                    </p>
                    <p className="mt-0.5 text-[10px]" style={{ color: 'var(--gray-400)' }}>
                      {s.messages.length} messages &middot; {new Date(s.timestamp).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MEMORY TAB ── */}
      {tab === 'memory' && (
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--gray-500)' }}>
            Configure how the AI remembers context from your conversations.
          </p>
          <div className="space-y-3">
            <MemoryToggle label="Short-Term Memory" description="Keep context within the current session" checked={memorySettings.shortTerm} onChange={() => onMemorySettingsChange({ ...memorySettings, shortTerm: !memorySettings.shortTerm })} color="var(--green)" />
            <MemoryToggle label="Long-Term Memory" description="Remember preferences across sessions" checked={memorySettings.longTerm} onChange={() => onMemorySettingsChange({ ...memorySettings, longTerm: !memorySettings.longTerm })} color="var(--blue)" />
            <MemoryToggle label="Auto-Summarize" description="Compress long conversations automatically" checked={memorySettings.autoSummarize} onChange={() => onMemorySettingsChange({ ...memorySettings, autoSummarize: !memorySettings.autoSummarize })} color="var(--purple)" />
          </div>
          <div className="mt-4 rounded-md border p-2.5" style={{ borderColor: 'var(--gray-200)', background: 'var(--gray-50)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--gray-400)' }}>Memory Status</p>
            <div className="mt-2 space-y-1.5">
              <MemoryStat label="Session context" value={memorySettings.shortTerm ? 'Active' : 'Off'} active={memorySettings.shortTerm} />
              <MemoryStat label="Saved preferences" value={memorySettings.longTerm ? '3 items' : 'Off'} active={memorySettings.longTerm} />
              <MemoryStat label="Conversation length" value="Optimal" active />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryToggle({ label, description, checked, onChange, color }) {
  return (
    <div className="flex items-start gap-2.5">
      <button onClick={onChange} className="mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors" style={{ background: checked ? color : 'var(--gray-300)' }}>
        <div className="h-3 w-3 rounded-full bg-white shadow-sm transition-transform" style={{ transform: checked ? 'translateX(12px)' : 'translateX(0)' }} />
      </button>
      <div>
        <p className="text-[12px] font-semibold" style={{ color: 'var(--gray-800)' }}>{label}</p>
        <p className="text-[10px] leading-snug" style={{ color: 'var(--gray-400)' }}>{description}</p>
      </div>
    </div>
  );
}

function MemoryStat({ label, value, active }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: 'var(--gray-500)' }}>{label}</span>
      <span className="text-[10px] font-semibold" style={{ color: active ? 'var(--green)' : 'var(--gray-400)' }}>{value}</span>
    </div>
  );
}
