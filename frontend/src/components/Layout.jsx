import React, { useState, useEffect, useCallback } from 'react';
import bainLogo from '../assets/bain-company-seeklogo.svg';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import AgentFlowPanel from './AgentFlowPanel';
import StatsBar from './StatsBar';
import CommandPalette from './CommandPalette';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';

export default function Layout({
  fileManager, chat, sessions, activeSessionIdx, onSelectSession,
  onDeleteSession, onNewSession,
  memorySettings, onMemorySettingsChange,
  user, onLogout,
}) {
  const [showAgents, setShowAgents] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  // Ctrl+K to open command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  const exportChat = useCallback(() => {
    const msgs = chat.messages.filter(m => !m.isPlaceholder);
    if (msgs.length === 0) { addToast('No messages to export', 'info'); return; }
    const md = msgs.map(m => {
      const role = m.role === 'user' ? '**You**' : '**BCN Analyst**';
      return `### ${role}\n\n${m.content}\n`;
    }).join('\n---\n\n');
    const header = `# Coro BAIN & COMPANY - Conversation Export\n_Exported on ${new Date().toLocaleString()}_\n\n---\n\n`;
    const blob = new Blob([header + md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bcn-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Conversation exported as Markdown');
  }, [chat.messages, addToast]);

  const handleCommandAction = useCallback((actionId) => {
    switch (actionId) {
      case 'ask-data': chat.sendMessage('What data do I have?'); break;
      case 'top-revenue': chat.sendMessage('Top 10 by revenue'); break;
      case 'relationships': chat.sendMessage('Show all relationships'); break;
      case 'summary': chat.sendMessage('Sales performance summary'); break;
      case 'clean-report': chat.sendMessage('Show data cleaning summary'); break;
      case 'toggle-theme': toggleTheme(); break;
      case 'toggle-agents': setShowAgents(prev => !prev); break;
      case 'export-chat': exportChat(); break;
      case 'fullscreen': setFocusMode(prev => !prev); break;
      case 'clear-chat': window.location.reload(); break;
    }
  }, [chat, toggleTheme, exportChat]);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* ── Glass top bar ── */}
      <header
        className="glass-heavy relative z-10 flex h-[56px] shrink-0 items-center justify-between px-5"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[20px] font-extrabold tracking-tight" style={{ color: 'var(--red)' }}>
            Coro<span className="text-[12px] align-super" style={{ color: 'var(--red)' }}>®</span>
          </span>
          <div className="h-7 w-px" style={{ background: 'var(--border-color)' }} />
          <img src={bainLogo} alt="Bain & Company" className="h-[28px]" style={{ filter: 'var(--logo-filter)' }} />
        </div>
        <div className="flex items-center gap-2">
          {/* Command palette trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] transition-all duration-200 hover:scale-[1.02] md:flex"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-faint)' }}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span>Search...</span>
            <kbd className="rounded px-1.5 py-0.5 font-mono text-[10.5px] font-medium" style={{ background: 'var(--bg-overlay)', color: 'var(--text-ghost)', border: '1px solid var(--border-color)' }}>
              Ctrl+K
            </kbd>
          </button>

          <div className="hidden h-4 w-px md:block" style={{ background: 'var(--border-color)' }} />

          {/* Export button */}
          <button
            onClick={exportChat}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)' }}
            title="Export conversation"
          >
            <svg className="h-4 w-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>

          {/* Focus mode toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
            style={{
              background: focusMode ? 'var(--purple)' : 'var(--bg-raised)',
              border: focusMode ? 'none' : '1px solid var(--border-color)',
              boxShadow: focusMode ? '0 0 16px rgba(168,85,247,0.3)' : 'none',
            }}
            title={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            <svg className="h-4 w-4" style={{ color: focusMode ? '#fff' : 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              {focusMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              )}
            </svg>
          </button>

          <div className="hidden h-4 w-px md:block" style={{ background: 'var(--border-color)' }} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 hover:scale-110"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" style={{ color: 'var(--amber)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {/* Agents toggle */}
          <button
            onClick={() => setShowAgents(!showAgents)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-200"
            style={{
              background: showAgents ? 'var(--red)' : 'var(--bg-raised)',
              color: showAgents ? '#fff' : 'var(--text-muted)',
              boxShadow: showAgents ? '0 0 16px rgba(220,38,38,0.3)' : 'none',
              border: showAgents ? 'none' : '1px solid var(--border-color)',
            }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Agents
          </button>

          {/* User menu */}
          {user && (
            <>
              <div className="hidden h-4 w-px md:block" style={{ background: 'var(--border-color)' }} />
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: 'var(--red)' }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-[12.5px] font-medium md:block" style={{ color: 'var(--text-muted)' }}>
                  {user.name}
                </span>
                <button
                  onClick={onLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)' }}
                  title="Sign out"
                >
                  <svg className="h-4 w-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Red accent line with glow ── */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          background: 'linear-gradient(90deg, var(--red) 0%, #ef4444 40%, var(--red-dark) 100%)',
          boxShadow: '0 0 10px rgba(220,38,38,0.3), 0 0 30px rgba(220,38,38,0.1)',
        }}
      />

      {/* ── Stats bar ── */}
      {!focusMode && <StatsBar
        files={fileManager.files}
        messages={chat.messages}
        isStreaming={chat.isStreaming}
        thoughts={chat.thoughts}
      />}

      {/* ── Main area ── */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar - collapsible, hidden in focus mode */}
        <div
          className="shrink-0 transition-all duration-300 ease-in-out"
          style={{ width: focusMode ? 0 : (sidebarCollapsed ? 52 : 310), borderRight: focusMode ? 'none' : '1px solid var(--border-color)', background: 'var(--bg-surface)', overflow: 'hidden' }}
        >
          {sidebarCollapsed ? (
            <CollapsedSidebar fileCount={fileManager.files.length} onExpand={() => setSidebarCollapsed(false)} />
          ) : (
            <Sidebar
              sessions={sessions}
              activeSessionIdx={activeSessionIdx}
              onSelectSession={onSelectSession}
              onDeleteSession={onDeleteSession}
              onNewSession={onNewSession}
              memorySettings={memorySettings}
              onMemorySettingsChange={onMemorySettingsChange}
              fileManager={fileManager}
              onCollapse={() => setSidebarCollapsed(true)}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <ChatPanel
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            onSend={chat.sendMessage}
            onStop={chat.stopStreaming}
            generatedCode={chat.generatedCode}
            files={fileManager.files}
            relationships={fileManager.relationships}
            thoughts={chat.thoughts}
          />
        </div>

        {showAgents && !focusMode && (
          <div
            className="glass-heavy hidden w-[270px] shrink-0 lg:block"
            style={{ borderLeft: '1px solid var(--border-color)' }}
          >
            <AgentFlowPanel thoughts={chat.thoughts} isStreaming={chat.isStreaming} />
          </div>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onAction={handleCommandAction}
      />
    </div>
  );
}

/* Mini sidebar when collapsed - arrow to expand */
function CollapsedSidebar({ fileCount, onExpand }) {
  return (
    <div className="flex h-full flex-col items-center py-3 gap-3">
      <button
        onClick={onExpand}
        className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:scale-110"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)' }}
        title="Expand sidebar"
      >
        <svg className="h-4 w-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
      {fileCount > 0 && (
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
          style={{ background: 'var(--red)', boxShadow: '0 0 8px rgba(220,38,38,0.3)' }}
        >
          {fileCount}
        </div>
      )}
    </div>
  );
}
