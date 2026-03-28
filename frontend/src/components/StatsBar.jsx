import React, { useState, useEffect, useRef } from 'react';

function Sparkline({ data, color, width = 60, height = 20 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const lastX = (data.length - 1) * step;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.6 }}
      />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}

export default function StatsBar({ files, messages, isStreaming, thoughts }) {
  const [queryTime, setQueryTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [queryTimes, setQueryTimes] = useState([]);
  const prevStreamingRef = useRef(false);

  const totalRows = files.reduce((sum, f) => sum + (f.row_count || 0), 0);
  const totalCols = files.reduce((sum, f) => sum + (f.column_count || 0), 0);
  const queryCount = messages.filter(m => m.role === 'user').length;
  const activeAgents = new Set(thoughts.filter(t => t.status === 'running').map(t => t.agent)).size;

  useEffect(() => {
    if (isStreaming && !startTime) {
      setStartTime(Date.now());
    }
    if (!isStreaming && startTime) {
      const elapsed = ((Date.now() - startTime) / 1000);
      setQueryTime(elapsed.toFixed(1));
      setQueryTimes(prev => [...prev.slice(-9), elapsed]);
      setStartTime(null);
    }
  }, [isStreaming, startTime]);

  // Track if streaming just finished
  useEffect(() => {
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const stats = [
    { label: 'Datasets', value: files.length, icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z', color: 'var(--blue)' },
    { label: 'Rows', value: totalRows > 0 ? (totalRows > 1000 ? `${(totalRows/1000).toFixed(1)}K` : totalRows) : '—', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z', color: 'var(--green)' },
    { label: 'Fields', value: totalCols || '—', icon: 'M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125z', color: 'var(--purple)' },
    { label: 'Queries', value: queryCount, icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z', color: 'var(--amber)' },
    ...(queryTime ? [{ label: 'Last', value: `${queryTime}s`, icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', color: 'var(--cyan)' }] : []),
  ];

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 overflow-x-auto px-4 py-1.5"
      style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
    >
      {stats.map(({ label, value, icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all"
          style={{ background: 'transparent' }}
        >
          <svg className="h-3.5 w-3.5 shrink-0" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
          <span className="font-mono text-[12.5px] font-bold" style={{ color: 'var(--text-secondary)' }}>{value}</span>
          <span className="text-[10.5px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</span>
        </div>
      ))}

      {/* Sparkline for query response times */}
      {queryTimes.length >= 2 && (
        <div className="flex items-center gap-1.5 rounded-md px-2 py-1" title="Response time trend">
          <Sparkline data={queryTimes} color="var(--cyan)" />
          <span className="text-[8px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>Latency</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Live status */}
      {isStreaming && (
        <div className="flex items-center gap-2 rounded-full px-2.5 py-1" style={{ background: 'var(--red-tint)' }}>
          <div className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--red)', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--red)' }} />
          </div>
          <span className="text-[10.5px] font-bold tracking-wider" style={{ color: 'var(--red)' }}>
            {activeAgents > 0 ? `${activeAgents} AGENT${activeAgents > 1 ? 'S' : ''} ACTIVE` : 'PROCESSING'}
          </span>
        </div>
      )}

      {!isStreaming && queryCount > 0 && (
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'var(--green-tint)' }}>
          <svg className="h-2.5 w-2.5" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[10.5px] font-bold tracking-wider" style={{ color: 'var(--green)' }}>READY</span>
        </div>
      )}
    </div>
  );
}
