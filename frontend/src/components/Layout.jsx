import React, { useState } from 'react';
import bainLogo from '../assets/bain-company-seeklogo.svg';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import AgentFlowPanel from './AgentFlowPanel';

export default function Layout({
  fileManager, chat, sessions, activeSessionIdx, onSelectSession, onSaveSession,
  memorySettings, onMemorySettingsChange,
}) {
  const [showAgents, setShowAgents] = useState(true);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--gray-100)' }}>
      {/* ── Top bar ── */}
      <header
        className="flex h-12 shrink-0 items-center justify-between border-b px-5"
        style={{ borderColor: 'var(--gray-200)', background: 'var(--white)' }}
      >
        <div className="flex items-center gap-4">
          <img src={bainLogo} alt="Bain & Company" className="h-5 sm:h-6" />
          <div className="hidden h-5 w-px sm:block" style={{ background: 'var(--gray-200)' }} />
          <div className="hidden sm:block">
            <span className="text-[12px] font-bold tracking-wide" style={{ color: 'var(--gray-800)' }}>
              Data Analytics
            </span>
            <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
              AI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAgents(!showAgents)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
            style={{
              background: showAgents ? 'var(--dark)' : 'var(--gray-100)',
              color: showAgents ? '#fff' : 'var(--gray-500)',
            }}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Agents
          </button>
        </div>
      </header>

      {/* ── Red accent line ── */}
      <div className="h-[2px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, var(--red) 0%, var(--red-dark) 100%)' }} />

      {/* ── Main area ── */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionIdx={activeSessionIdx}
          onSelectSession={onSelectSession}
          onSaveSession={onSaveSession}
          memorySettings={memorySettings}
          onMemorySettingsChange={onMemorySettingsChange}
          fileManager={fileManager}
        />

        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatPanel
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            onSend={chat.sendMessage}
            onStop={chat.stopStreaming}
            hasFiles={fileManager.files.length > 0}
            generatedCode={chat.generatedCode}
            files={fileManager.files}
            relationships={fileManager.relationships}
            thoughts={chat.thoughts}
          />
        </div>

        {/* Right panel - Agent Flow */}
        {showAgents && (
          <div className="hidden w-[260px] shrink-0 border-l lg:block" style={{ borderColor: 'var(--gray-200)' }}>
            <AgentFlowPanel thoughts={chat.thoughts} isStreaming={chat.isStreaming} />
          </div>
        )}
      </div>
    </div>
  );
}
