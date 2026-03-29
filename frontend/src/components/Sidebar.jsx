import React, { useState, useRef, useCallback } from 'react';
import RelationshipDiagram from './RelationshipDiagram';
import LLMSettings from './LLMSettings';
import DataWorkbench from './DataWorkbench';

const TAB_ICONS = {
  files: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  workbench: 'M11.42 15.17l-5.384-3.07A2.25 2.25 0 004.5 14.28V21m7.5-6.83l5.384-3.07A2.25 2.25 0 0019.5 14.28V21m-15 0h15M3 11.25V4.875C3 3.839 3.84 3 4.875 3h14.25C20.16 3 21 3.84 21 4.875v6.375',
  sessions: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  llm: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z',
  memory: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
};

export default function Sidebar({
  sessions, activeSessionIdx, onSelectSession, onSaveSession,
  memorySettings, onMemorySettingsChange, fileManager,
}) {
  const [tab, setTab] = useState('files');
  const [expandedReport, setExpandedReport] = useState(null);
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

  return (
    <div className="flex w-[310px] shrink-0 flex-col" style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
      {/* Tabs */}
      <div className="flex shrink-0 gap-0.5 px-2 pt-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {['files', 'workbench', 'sessions', 'llm'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-t-lg py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all"
            style={{
              color: tab === t ? 'var(--red)' : 'var(--text-muted)',
              background: tab === t ? 'var(--bg-raised)' : 'transparent',
              borderBottom: tab === t ? '2px solid var(--red)' : '2px solid transparent',
            }}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={tab === t ? 2 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={TAB_ICONS[t]} />
            </svg>
            {t}
          </button>
        ))}
      </div>

      {/* ── FILES TAB ── */}
      {tab === 'files' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 p-3 pb-1">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className={`group cursor-pointer rounded-xl border-2 border-dashed px-3 py-5 text-center transition-all duration-200 ${uploading ? 'shimmer' : ''}`}
              style={{ borderColor: uploading ? 'var(--red)' : 'var(--bg-overlay)', background: 'var(--bg-raised)' }}
            >
              <input ref={inputRef} type="file" accept=".csv" multiple onChange={handleFileSelect} className="hidden" />
              <div
                className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105"
                style={{ background: uploading ? 'var(--red-tint)' : 'var(--bg-overlay)' }}
              >
                <svg className="h-4 w-4 transition-colors" style={{ color: uploading ? 'var(--red)' : 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-[11px] font-semibold" style={{ color: uploading ? 'var(--red)' : 'var(--text-secondary)' }}>
                {uploading ? 'Cleaning & uploading...' : 'Upload CSV Files'}
              </p>
              <p className="mt-0.5 text-[9.5px]" style={{ color: 'var(--text-faint)' }}>Drop files or click to browse</p>
            </div>

            {uploadError && (
              <div className="mt-2 rounded-lg px-3 py-2 text-[11px]" style={{ borderLeft: '3px solid var(--red)', background: 'var(--red-tint)', color: 'var(--red)' }}>
                {uploadError}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-2">
            {files.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--bg-raised)' }}>
                    <svg className="h-5 w-5" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>No files uploaded</p>
                  <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>Your datasets will appear here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {files.map((file, i) => {
                  const report = cleaningReports[file.filename];
                  const isExpanded = expandedReport === file.filename;
                  return (
                    <div
                      key={file.filename}
                      className="fade-up overflow-hidden rounded-xl transition-shadow duration-200"
                      style={{ border: '1px solid var(--border-color)', background: 'var(--bg-raised)', animationDelay: `${i * 40}ms` }}
                    >
                      <div className="group flex items-center gap-2.5 px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--red-tint)' }}>
                          <svg className="h-4 w-4" style={{ color: 'var(--red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11.5px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{file.filename}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {file.row_count?.toLocaleString()} rows
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>&middot;</span>
                            <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {file.column_count} cols
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => fileManager.removeFile(file.filename)}
                          className="rounded-md p-1 opacity-0 transition-all group-hover:opacity-100"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {report && report.steps.length > 0 && (
                        <div
                          className="cursor-pointer px-3 py-2 transition-colors"
                          style={{ borderTop: '1px solid var(--border-color)', background: 'var(--green-tint)' }}
                          onClick={() => setExpandedReport(isExpanded ? null : file.filename)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'var(--green)' }}>
                                <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-[10px] font-semibold" style={{ color: 'var(--green)' }}>Cleaned</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9.5px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                {report.rows_removed > 0 ? `${report.rows_removed} removed` : 'No issues'}
                              </span>
                              <svg
                                className="h-3 w-3 transition-transform"
                                style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : '' }}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-2 space-y-1.5">
                              {report.steps.map((step, si) => (
                                <div key={si} className="flex items-start gap-2">
                                  <div
                                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{
                                      background: step.action.includes('Removed') ? 'var(--red)' : step.action.includes('Detected') ? 'var(--amber)' : 'var(--green)',
                                    }}
                                  />
                                  <div>
                                    <p className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{step.action}</p>
                                    <p className="text-[9px] leading-snug" style={{ color: 'var(--text-muted)' }}>{step.detail}</p>
                                  </div>
                                </div>
                              ))}
                              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                                <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'var(--bg-overlay)' }}>
                                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Before</p>
                                  <p className="font-mono text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>{report.original_rows.toLocaleString()}</p>
                                </div>
                                <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'var(--bg-overlay)' }}>
                                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>After</p>
                                  <p className="font-mono text-[11px] font-bold" style={{ color: 'var(--green)' }}>{report.final_rows.toLocaleString()}</p>
                                </div>
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

          {(fileManager?.relationships || []).length > 0 && (
            <div className="shrink-0 px-3 py-2.5" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="mb-2 flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" style={{ color: 'var(--purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Joins ({fileManager.relationships.length})
                </span>
              </div>
              <RelationshipDiagram files={files} relationships={fileManager.relationships} />
            </div>
          )}
        </div>
      )}

      {/* ── WORKBENCH TAB ── */}
      {tab === 'workbench' && (
        <DataWorkbench
          files={files}
          sessionId={fileManager?.sessionId}
          onFileAdded={(newFile) => {
            if (fileManager?.addFile) fileManager.addFile(newFile);
          }}
        />
      )}

      {/* ── SESSIONS TAB ── */}
      {tab === 'sessions' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="p-3">
            <button
              onClick={onSaveSession}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'var(--red)', boxShadow: '0 0 16px rgba(220,38,38,0.25)' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Save Current Session
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--bg-raised)' }}>
                  <svg className="h-5 w-5" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>No saved sessions</p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>Chat history will appear here</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {sessions.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(i)}
                    className="slide-in group w-full rounded-xl px-3 py-2.5 text-left transition-all"
                    style={{
                      background: activeSessionIdx === i ? 'var(--red-tint)' : 'var(--bg-raised)',
                      border: `1px solid ${activeSessionIdx === i ? 'rgba(220,38,38,0.2)' : 'var(--border-color)'}`,
                      animationDelay: `${i * 30}ms`,
                    }}
                  >
                    <p className="truncate text-[12px] font-semibold" style={{ color: activeSessionIdx === i ? 'var(--red)' : 'var(--text-secondary)' }}>
                      {s.name}
                    </p>
                    <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {s.messages.length} messages &middot; {new Date(s.timestamp).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LLM TAB ── */}
      {tab === 'llm' && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-3">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>LLM Providers</p>
            <p className="mt-0.5 text-[10px] leading-snug" style={{ color: 'var(--text-faint)' }}>
              Configure your preferred AI model. Add API keys for any supported provider.
            </p>
          </div>
          <LLMSettings />
        </div>
      )}

      {/* ── MEMORY TAB ── */}
      {tab === 'memory' && (
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-4 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Configure how the AI remembers context from your conversations.
          </p>
          <div className="space-y-3.5">
            <MemoryToggle label="Short-Term Memory" description="Keep context within the current session" checked={memorySettings.shortTerm} onChange={() => onMemorySettingsChange({ ...memorySettings, shortTerm: !memorySettings.shortTerm })} color="var(--green)" />
            <MemoryToggle label="Long-Term Memory" description="Remember preferences across sessions" checked={memorySettings.longTerm} onChange={() => onMemorySettingsChange({ ...memorySettings, longTerm: !memorySettings.longTerm })} color="var(--blue)" />
            <MemoryToggle label="Auto-Summarize" description="Compress long conversations automatically" checked={memorySettings.autoSummarize} onChange={() => onMemorySettingsChange({ ...memorySettings, autoSummarize: !memorySettings.autoSummarize })} color="var(--purple)" />
          </div>
          <div className="mt-5 rounded-xl p-3" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-raised)' }}>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Status</p>
            <div className="space-y-2">
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
    <div className="flex items-start gap-3">
      <button
        onClick={onChange}
        className="mt-0.5 flex h-[18px] w-[32px] shrink-0 items-center rounded-full p-[2px] transition-colors duration-200"
        style={{ background: checked ? color : 'var(--bg-overlay)' }}
      >
        <div
          className="h-[14px] w-[14px] rounded-full bg-white transition-transform duration-200"
          style={{ transform: checked ? 'translateX(14px)' : 'translateX(0)' }}
        />
      </button>
      <div>
        <p className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="mt-0.5 text-[10px] leading-snug" style={{ color: 'var(--text-faint)' }}>{description}</p>
      </div>
    </div>
  );
}

function MemoryStat({ label, value, active }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: active ? 'var(--green)' : 'var(--text-ghost)' }} />
        <span className="text-[10px] font-semibold" style={{ color: active ? 'var(--green)' : 'var(--text-faint)' }}>{value}</span>
      </div>
    </div>
  );
}
