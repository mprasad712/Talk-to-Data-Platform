import React, { useState, useEffect } from 'react';
import { previewOperation, saveOperationResult, getSessionColumns } from '../api/client';

const OPERATIONS = [
  { id: 'join', label: 'Join', desc: 'Merge two datasets on key columns', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5', color: 'var(--blue)' },
  { id: 'union', label: 'Union', desc: 'Stack datasets vertically', icon: 'M3 4h18M3 12h18M3 20h18', color: 'var(--green)' },
  { id: 'filter', label: 'Filter', desc: 'Filter rows by conditions', icon: 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z', color: 'var(--amber)' },
  { id: 'group', label: 'Group & Aggregate', desc: 'Group by + sum/avg/count', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', color: 'var(--purple)' },
  { id: 'sort', label: 'Sort', desc: 'Sort rows by columns', icon: 'M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 21m0 0L12 16.5m4.5 4.5V7.5', color: 'var(--cyan)' },
  { id: 'deduplicate', label: 'Deduplicate', desc: 'Remove duplicate rows', icon: 'M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3', color: 'var(--red)' },
  { id: 'column_tools', label: 'Column Tools', desc: 'Drop, rename, reorder columns', icon: 'M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125z', color: 'var(--text-muted)' },
];

const JOIN_TYPES = [
  { id: 'inner', label: 'Inner', desc: 'Only matching rows' },
  { id: 'left', label: 'Left', desc: 'All left + matching right' },
  { id: 'right', label: 'Right', desc: 'All right + matching left' },
  { id: 'outer', label: 'Full Outer', desc: 'All rows from both' },
];

const FILTER_OPS = [
  { id: 'equals', label: 'Equals' },
  { id: 'not_equals', label: 'Not Equals' },
  { id: 'contains', label: 'Contains' },
  { id: 'not_contains', label: 'Not Contains' },
  { id: 'greater_than', label: '>' },
  { id: 'less_than', label: '<' },
  { id: 'greater_equal', label: '>=' },
  { id: 'less_equal', label: '<=' },
  { id: 'is_null', label: 'Is Null' },
  { id: 'not_null', label: 'Not Null' },
];

const AGG_FUNCTIONS = ['sum', 'mean', 'count', 'min', 'max', 'nunique'];

const WB_ROWS_PER_PAGE = 25;

export default function DataWorkbench({ files, sessionId, onFileAdded }) {
  const [selectedOp, setSelectedOp] = useState(null);
  const [columnsMap, setColumnsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastParams, setLastParams] = useState(null);
  const [wbPage, setWbPage] = useState(0);

  // Fetch all columns when files change
  useEffect(() => {
    if (!sessionId || files.length === 0) return;
    getSessionColumns(sessionId).then(setColumnsMap).catch(() => {});
  }, [sessionId, files]);

  const fileNames = files.map(f => f.filename);

  const handleExecute = async (operation, params) => {
    setLoading(true);
    setError(null);
    setPreview(null);
    setWbPage(0);
    setLastParams({ operation, params });
    try {
      const result = await previewOperation(sessionId, operation, params);
      setPreview(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview || !lastParams) return;
    setSaving(true);
    try {
      const result = await saveOperationResult(sessionId, lastParams.operation, lastParams.params, preview.name);
      if (onFileAdded) onFileAdded(result.file);
      setPreview(null);
      setSelectedOp(null);
      setLastParams(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!preview || !preview.full_csv) return;
    const filename = preview.name.endsWith('.csv') ? preview.name : `${preview.name}.csv`;
    const blob = new Blob([preview.full_csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-raised)' }}>
          <svg className="h-6 w-6" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.07A2.25 2.25 0 004.5 14.28V21m7.5-6.83l5.384-3.07A2.25 2.25 0 0019.5 14.28V21m-15 0h15M3 11.25V4.875C3 3.839 3.84 3 4.875 3h14.25C20.16 3 21 3.84 21 4.875v6.375" />
          </svg>
        </div>
        <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>Upload datasets first</p>
        <p className="mt-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>Data operations require at least one CSV file</p>
      </div>
    );
  }

  // Preview results view
  if (preview) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => { setPreview(null); setLastParams(null); }} className="rounded-md p-1 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>{preview.name}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{preview.row_count.toLocaleString()} rows / {preview.column_count} columns</p>
            </div>
          </div>
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10.5px] font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
              style={{ background: 'var(--green)' }}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {saving ? 'Saving...' : 'Add to Workspace'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10.5px] font-semibold transition-all"
              style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download CSV
            </button>
          </div>
        </div>

        {/* Preview table — scrollable both horizontal and vertical */}
        <div className="min-h-0 flex-1 overflow-auto">
            <table className="text-[11px]" style={{ borderCollapse: 'collapse', minWidth: `${Math.max(preview.columns.length * 150, 600)}px` }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 1 }}>
                  {preview.columns.map(col => (
                    <th key={col.name} className="whitespace-nowrap px-2.5 py-2 text-left font-semibold" style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      {col.name}
                      <span className="ml-1 text-[9px] font-normal" style={{ color: 'var(--text-faint)' }}>{col.dtype}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.slice(wbPage * WB_ROWS_PER_PAGE, (wbPage + 1) * WB_ROWS_PER_PAGE).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {preview.columns.map(col => (
                      <td key={col.name} className="whitespace-nowrap px-2.5 py-1.5" style={{ color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {String(row[col.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

          {/* Pagination — max 10 pages shown, download for full data */}
          {(() => {
            const previewRows = preview.preview.length;
            const totalRows = preview.row_count;
            const maxPages = Math.min(Math.ceil(previewRows / WB_ROWS_PER_PAGE), 10);
            const maxVisibleRows = maxPages * WB_ROWS_PER_PAGE;
            return (
              <div
                className="shrink-0 px-3 py-2"
                style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
              >
                {maxPages > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                      {(wbPage * WB_ROWS_PER_PAGE + 1).toLocaleString()}-{Math.min((wbPage + 1) * WB_ROWS_PER_PAGE, previewRows).toLocaleString()} of {previewRows.toLocaleString()} shown
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setWbPage(p => Math.max(0, p - 1))}
                        disabled={wbPage === 0}
                        className="rounded px-2 py-0.5 text-[10px] font-medium transition-all disabled:opacity-30"
                        style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
                      >
                        Prev
                      </button>
                      <span className="px-1 text-[10px] font-medium" style={{ color: 'var(--text-faint)', lineHeight: '22px' }}>
                        {wbPage + 1}/{maxPages}
                      </span>
                      <button
                        onClick={() => setWbPage(p => Math.min(maxPages - 1, p + 1))}
                        disabled={wbPage >= maxPages - 1}
                        className="rounded px-2 py-0.5 text-[10px] font-medium transition-all disabled:opacity-30"
                        style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {totalRows > maxVisibleRows && (
                  <p className="mt-1.5 text-center text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                    Showing {Math.min(previewRows, maxVisibleRows).toLocaleString()} of {totalRows.toLocaleString()} total rows &mdash;{' '}
                    <button onClick={handleDownload} className="underline" style={{ color: 'var(--blue)' }}>
                      Download CSV for full view
                    </button>
                  </p>
                )}
                {totalRows <= maxVisibleRows && maxPages <= 1 && (
                  <p className="text-center text-[10px]" style={{ color: 'var(--text-faint)' }}>
                    {totalRows.toLocaleString()} rows
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // Operation form view
  if (selectedOp) {
    const opInfo = OPERATIONS.find(o => o.id === selectedOp);
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => { setSelectedOp(null); setError(null); }} className="rounded-md p-1 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${opInfo.color}20` }}>
              <svg className="h-3.5 w-3.5" style={{ color: opInfo.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={opInfo.icon} />
              </svg>
            </div>
            <p className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>{opInfo.label}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {error && (
            <div className="mb-3 rounded-lg px-3 py-2 text-[11px]" style={{ borderLeft: '3px solid var(--red)', background: 'var(--red-tint)', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          {selectedOp === 'join' && <JoinForm files={fileNames} columnsMap={columnsMap} onExecute={handleExecute} loading={loading} />}
          {selectedOp === 'union' && <UnionForm files={fileNames} onExecute={handleExecute} loading={loading} />}
          {selectedOp === 'filter' && <FilterForm files={fileNames} columnsMap={columnsMap} onExecute={handleExecute} loading={loading} />}
          {selectedOp === 'group' && <GroupForm files={fileNames} columnsMap={columnsMap} onExecute={handleExecute} loading={loading} />}
          {selectedOp === 'sort' && <SortForm files={fileNames} columnsMap={columnsMap} onExecute={handleExecute} loading={loading} />}
          {selectedOp === 'deduplicate' && <DeduplicateForm files={fileNames} columnsMap={columnsMap} onExecute={handleExecute} loading={loading} />}
          {selectedOp === 'column_tools' && <ColumnToolsForm files={fileNames} columnsMap={columnsMap} onExecute={handleExecute} loading={loading} />}
        </div>
      </div>
    );
  }

  // Operation picker
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <p className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>Data Workbench</p>
        <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>Transform and combine your datasets</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1.5">
          {OPERATIONS.map(op => (
            <button
              key={op.id}
              onClick={() => { setSelectedOp(op.id); setError(null); setPreview(null); }}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
              style={{ border: '1px solid var(--border-color)', background: 'var(--bg-raised)' }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110" style={{ background: `${op.color}18` }}>
                <svg className="h-4 w-4" style={{ color: op.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={op.icon} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{op.label}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{op.desc}</p>
              </div>
              <svg className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shared UI ──

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div className="mb-2.5">
      {label && <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-2.5 py-2 text-[12px] focus:outline-none"
        style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options.map(o => <option key={typeof o === 'string' ? o : o.id} value={typeof o === 'string' ? o : o.id}>{typeof o === 'string' ? o : o.label}</option>)}
      </select>
    </div>
  );
}

function MultiSelect({ label, options, selected, onChange }) {
  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(s => s !== val));
    else onChange([...selected, val]);
  };
  return (
    <div className="mb-2.5">
      {label && <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</label>}
      <div className="flex flex-wrap gap-1">
        {options.map(o => (
          <button
            key={o}
            onClick={() => toggle(o)}
            className="rounded-md px-2 py-1 text-[10.5px] font-medium transition-all"
            style={{
              background: selected.includes(o) ? 'var(--blue)' : 'var(--bg-raised)',
              color: selected.includes(o) ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${selected.includes(o) ? 'var(--blue)' : 'var(--border-color)'}`,
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExecuteButton({ onClick, loading, label = 'Execute' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold text-white transition-all hover:shadow-lg disabled:opacity-50"
      style={{ background: 'var(--red)', boxShadow: '0 0 16px rgba(220,38,38,0.2)' }}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Processing...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ── Operation Forms ──

function JoinForm({ files, columnsMap, onExecute, loading }) {
  const [leftFile, setLeftFile] = useState('');
  const [rightFile, setRightFile] = useState('');
  const [leftOn, setLeftOn] = useState([]);
  const [rightOn, setRightOn] = useState([]);
  const [joinType, setJoinType] = useState('inner');

  const leftCols = (columnsMap[leftFile] || []).map(c => c.name);
  const rightCols = (columnsMap[rightFile] || []).map(c => c.name);

  return (
    <>
      <Select label="Left Dataset" value={leftFile} onChange={v => { setLeftFile(v); setLeftOn([]); }} options={files} placeholder="Select left file..." />
      <Select label="Right Dataset" value={rightFile} onChange={v => { setRightFile(v); setRightOn([]); }} options={files.filter(f => f !== leftFile)} placeholder="Select right file..." />
      {leftFile && <MultiSelect label="Left Join Columns" options={leftCols} selected={leftOn} onChange={setLeftOn} />}
      {rightFile && <MultiSelect label="Right Join Columns" options={rightCols} selected={rightOn} onChange={setRightOn} />}
      <div className="mb-2.5">
        <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Join Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {JOIN_TYPES.map(jt => (
            <button
              key={jt.id}
              onClick={() => setJoinType(jt.id)}
              className="rounded-lg px-2 py-2 text-left transition-all"
              style={{
                background: joinType === jt.id ? 'var(--blue)' : 'var(--bg-raised)',
                color: joinType === jt.id ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${joinType === jt.id ? 'var(--blue)' : 'var(--border-color)'}`,
              }}
            >
              <p className="text-[11px] font-semibold">{jt.label}</p>
              <p className="text-[9px] opacity-75">{jt.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <ExecuteButton
        loading={loading}
        onClick={() => onExecute('join', { left_file: leftFile, right_file: rightFile, left_on: leftOn, right_on: rightOn, how: joinType })}
      />
    </>
  );
}

function UnionForm({ files, onExecute, loading }) {
  const [selected, setSelected] = useState([]);

  return (
    <>
      <MultiSelect label="Select Datasets to Union" options={files} selected={selected} onChange={setSelected} />
      {selected.length >= 2 && (
        <p className="mb-2 text-[10px]" style={{ color: 'var(--text-faint)' }}>
          {selected.length} datasets will be stacked vertically. Columns will be aligned by name.
        </p>
      )}
      <ExecuteButton
        loading={loading}
        label={`Union ${selected.length} Datasets`}
        onClick={() => onExecute('union', { files: selected })}
      />
    </>
  );
}

function FilterForm({ files, columnsMap, onExecute, loading }) {
  const [file, setFile] = useState('');
  const [conditions, setConditions] = useState([{ column: '', operator: 'equals', value: '' }]);

  const cols = (columnsMap[file] || []).map(c => c.name);

  const updateCond = (idx, field, val) => {
    const next = [...conditions];
    next[idx] = { ...next[idx], [field]: val };
    setConditions(next);
  };

  const addCond = () => setConditions([...conditions, { column: '', operator: 'equals', value: '' }]);
  const removeCond = (idx) => setConditions(conditions.filter((_, i) => i !== idx));

  return (
    <>
      <Select label="Dataset" value={file} onChange={v => { setFile(v); setConditions([{ column: '', operator: 'equals', value: '' }]); }} options={files} />
      {file && (
        <>
          <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Conditions</label>
          {conditions.map((cond, i) => (
            <div key={i} className="mb-2 flex items-center gap-1.5">
              <select value={cond.column} onChange={e => updateCond(i, 'column', e.target.value)} className="min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-[11px]" style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                <option value="">Column</option>
                {cols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={cond.operator} onChange={e => updateCond(i, 'operator', e.target.value)} className="rounded-md px-1 py-1.5 text-[11px]" style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                {FILTER_OPS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
              </select>
              {!['is_null', 'not_null'].includes(cond.operator) && (
                <input
                  value={cond.value}
                  onChange={e => updateCond(i, 'value', e.target.value)}
                  placeholder="Value"
                  className="min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-[11px] focus:outline-none"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                />
              )}
              {conditions.length > 1 && (
                <button onClick={() => removeCond(i)} className="shrink-0 rounded p-0.5" style={{ color: 'var(--red)' }}>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button onClick={addCond} className="mb-2 flex items-center gap-1 text-[10.5px] font-medium" style={{ color: 'var(--blue)' }}>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add condition
          </button>
        </>
      )}
      <ExecuteButton loading={loading} onClick={() => onExecute('filter', { file, conditions })} />
    </>
  );
}

function GroupForm({ files, columnsMap, onExecute, loading }) {
  const [file, setFile] = useState('');
  const [groupBy, setGroupBy] = useState([]);
  const [aggs, setAggs] = useState([{ column: '', function: 'sum' }]);

  const cols = (columnsMap[file] || []).map(c => c.name);

  const updateAgg = (idx, field, val) => {
    const next = [...aggs];
    next[idx] = { ...next[idx], [field]: val };
    setAggs(next);
  };

  return (
    <>
      <Select label="Dataset" value={file} onChange={v => { setFile(v); setGroupBy([]); setAggs([{ column: '', function: 'sum' }]); }} options={files} />
      {file && (
        <>
          <MultiSelect label="Group By Columns" options={cols} selected={groupBy} onChange={setGroupBy} />
          <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Aggregations</label>
          {aggs.map((agg, i) => (
            <div key={i} className="mb-2 flex items-center gap-1.5">
              <select value={agg.column} onChange={e => updateAgg(i, 'column', e.target.value)} className="min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-[11px]" style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                <option value="">Column</option>
                {cols.filter(c => !groupBy.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={agg.function} onChange={e => updateAgg(i, 'function', e.target.value)} className="rounded-md px-1.5 py-1.5 text-[11px]" style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                {AGG_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              {aggs.length > 1 && (
                <button onClick={() => setAggs(aggs.filter((_, j) => j !== i))} className="shrink-0 rounded p-0.5" style={{ color: 'var(--red)' }}>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setAggs([...aggs, { column: '', function: 'sum' }])} className="mb-2 flex items-center gap-1 text-[10.5px] font-medium" style={{ color: 'var(--blue)' }}>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add aggregation
          </button>
        </>
      )}
      <ExecuteButton loading={loading} onClick={() => onExecute('group', { file, group_by: groupBy, aggregations: aggs })} />
    </>
  );
}

function SortForm({ files, columnsMap, onExecute, loading }) {
  const [file, setFile] = useState('');
  const [sortBy, setSortBy] = useState([{ column: '', ascending: true }]);

  const cols = (columnsMap[file] || []).map(c => c.name);

  const update = (idx, field, val) => {
    const next = [...sortBy];
    next[idx] = { ...next[idx], [field]: val };
    setSortBy(next);
  };

  return (
    <>
      <Select label="Dataset" value={file} onChange={v => { setFile(v); setSortBy([{ column: '', ascending: true }]); }} options={files} />
      {file && (
        <>
          <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Sort By</label>
          {sortBy.map((s, i) => (
            <div key={i} className="mb-2 flex items-center gap-1.5">
              <select value={s.column} onChange={e => update(i, 'column', e.target.value)} className="min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-[11px]" style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                <option value="">Column</option>
                {cols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => update(i, 'ascending', !s.ascending)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                {s.ascending ? 'ASC' : 'DESC'}
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.ascending ? 'M4.5 15.75l7.5-7.5 7.5 7.5' : 'M19.5 8.25l-7.5 7.5-7.5-7.5'} />
                </svg>
              </button>
              {sortBy.length > 1 && (
                <button onClick={() => setSortBy(sortBy.filter((_, j) => j !== i))} className="shrink-0 rounded p-0.5" style={{ color: 'var(--red)' }}>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setSortBy([...sortBy, { column: '', ascending: true }])} className="mb-2 flex items-center gap-1 text-[10.5px] font-medium" style={{ color: 'var(--blue)' }}>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add sort column
          </button>
        </>
      )}
      <ExecuteButton loading={loading} onClick={() => onExecute('sort', { file, sort_by: sortBy })} />
    </>
  );
}

function DeduplicateForm({ files, columnsMap, onExecute, loading }) {
  const [file, setFile] = useState('');
  const [columns, setColumns] = useState([]);
  const [keep, setKeep] = useState('first');

  const cols = (columnsMap[file] || []).map(c => c.name);

  return (
    <>
      <Select label="Dataset" value={file} onChange={v => { setFile(v); setColumns([]); }} options={files} />
      {file && (
        <>
          <MultiSelect label="Columns to Check (empty = all)" options={cols} selected={columns} onChange={setColumns} />
          <div className="mb-2.5">
            <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Keep</label>
            <div className="flex gap-1.5">
              {['first', 'last'].map(k => (
                <button
                  key={k}
                  onClick={() => setKeep(k)}
                  className="flex-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold capitalize transition-all"
                  style={{
                    background: keep === k ? 'var(--blue)' : 'var(--bg-raised)',
                    color: keep === k ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${keep === k ? 'var(--blue)' : 'var(--border-color)'}`,
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <ExecuteButton loading={loading} onClick={() => onExecute('deduplicate', { file, columns: columns.length > 0 ? columns : null, keep })} />
    </>
  );
}

function ColumnToolsForm({ files, columnsMap, onExecute, loading }) {
  const [file, setFile] = useState('');
  const [action, setAction] = useState('drop');
  const [selectedCols, setSelectedCols] = useState([]);
  const [renameMap, setRenameMap] = useState({});

  const cols = (columnsMap[file] || []).map(c => c.name);

  const updateRename = (oldName, newName) => {
    setRenameMap({ ...renameMap, [oldName]: newName });
  };

  return (
    <>
      <Select label="Dataset" value={file} onChange={v => { setFile(v); setSelectedCols([]); setRenameMap({}); }} options={files} />
      {file && (
        <>
          <div className="mb-2.5">
            <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Action</label>
            <div className="flex gap-1.5">
              {[{ id: 'drop', label: 'Drop' }, { id: 'rename', label: 'Rename' }].map(a => (
                <button
                  key={a.id}
                  onClick={() => { setAction(a.id); setSelectedCols([]); setRenameMap({}); }}
                  className="flex-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all"
                  style={{
                    background: action === a.id ? 'var(--blue)' : 'var(--bg-raised)',
                    color: action === a.id ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${action === a.id ? 'var(--blue)' : 'var(--border-color)'}`,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {action === 'drop' && (
            <MultiSelect label="Columns to Drop" options={cols} selected={selectedCols} onChange={setSelectedCols} />
          )}

          {action === 'rename' && (
            <>
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Rename Columns</label>
              {cols.map(c => (
                <div key={c} className="mb-1.5 flex items-center gap-1.5">
                  <span className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-[11px]" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>{c}</span>
                  <svg className="h-3 w-3 shrink-0" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <input
                    value={renameMap[c] || ''}
                    onChange={e => updateRename(c, e.target.value)}
                    placeholder={c}
                    className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-[11px] focus:outline-none"
                    style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              ))}
            </>
          )}
        </>
      )}
      <ExecuteButton
        loading={loading}
        onClick={() => {
          if (action === 'drop') onExecute('column_tools', { file, action: 'drop', columns: selectedCols });
          else if (action === 'rename') {
            const filtered = Object.fromEntries(Object.entries(renameMap).filter(([k, v]) => v && v !== k));
            onExecute('column_tools', { file, action: 'rename', rename_map: filtered });
          }
        }}
      />
    </>
  );
}
