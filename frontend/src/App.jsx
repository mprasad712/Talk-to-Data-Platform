import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import { useFileManager } from './hooks/useFileManager';
import { useChat } from './hooks/useChat';

export default function App() {
  const fileManager = useFileManager();
  const chat = useChat(fileManager.sessionId, fileManager.setRelationships);

  // Chat sessions (frontend-only for now)
  const [sessions, setSessions] = useState([]);
  const [activeSessionIdx, setActiveSessionIdx] = useState(null);

  // Memory settings
  const [memorySettings, setMemorySettings] = useState({
    shortTerm: true,    // remember context within session
    longTerm: false,    // persist across sessions
    autoSummarize: true, // auto-summarize long conversations
  });

  // Save current chat as a session
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
  );
}
