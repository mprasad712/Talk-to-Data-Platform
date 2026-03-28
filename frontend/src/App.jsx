import React, { useState, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import { useFileManager } from './hooks/useFileManager';
import { useChat } from './hooks/useChat';

export default function App() {
  const fileManager = useFileManager();
  const chat = useChat(fileManager.sessionId, fileManager.setRelationships);

  const [sessions, setSessions] = useState([]);
  const [activeSessionIdx, setActiveSessionIdx] = useState(null);

  const [memorySettings, setMemorySettings] = useState({
    shortTerm: true,
    longTerm: false,
    autoSummarize: true,
  });

  const saveSession = useCallback(() => {
    if (chat.messages.length === 0) return;
    const name = chat.messages[0]?.content?.slice(0, 40) || 'New session';
    const newSession = {
      id: Date.now(),
      name,
      messages: [...chat.messages],
      thoughts: [...chat.thoughts],
      timestamp: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionIdx(sessions.length);
  }, [chat.messages, chat.thoughts, sessions.length]);

  return (
    <ThemeProvider>
      <ToastProvider>
        <Layout
          fileManager={fileManager}
          chat={chat}
          sessions={sessions}
          activeSessionIdx={activeSessionIdx}
          onSelectSession={setActiveSessionIdx}
          onSaveSession={saveSession}
          memorySettings={memorySettings}
          onMemorySettingsChange={setMemorySettings}
        />
      </ToastProvider>
    </ThemeProvider>
  );
}
