import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import { useFileManager } from './hooks/useFileManager';
import { useChat } from './hooks/useChat';
import { listChatSessions, getChatSession, deleteChatSession, getMe } from './api/client';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const fileManager = useFileManager();
  const chat = useChat(fileManager.sessionId, fileManager.setRelationships);

  const [sessions, setSessions] = useState([]);
  const [activeSessionIdx, setActiveSessionIdx] = useState(null);

  // Check existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('bcn_token');
    if (token) {
      getMe()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('bcn_token');
          localStorage.removeItem('bcn_user');
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Load sessions from DB on mount and auto-restore the most recent one
  useEffect(() => {
    if (!user) return;
    listChatSessions().then(async (loaded) => {
      setSessions(loaded);
      if (loaded.length > 0) {
        const session = loaded[0];
        try {
          const full = await getChatSession(session.session_id);
          chat.setChatSessionId(session.session_id);
          chat.loadMessages(full.messages || []);
          setActiveSessionIdx(0);
          if (full.file_session_id) {
            await fileManager.restoreSession(full.file_session_id);
          }
        } catch (e) {
          console.error('Failed to auto-restore session:', e);
        }
      }
    }).catch(() => {});
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh sessions list whenever streaming finishes
  useEffect(() => {
    if (!chat.isStreaming && chat.chatSessionId && user) {
      listChatSessions().then(setSessions).catch(() => {});
    }
  }, [chat.isStreaming, chat.chatSessionId, user]);

  const selectSession = useCallback(async (idx) => {
    if (idx === null || idx === undefined || !sessions[idx]) return;
    const session = sessions[idx];
    try {
      const full = await getChatSession(session.session_id);
      chat.setChatSessionId(session.session_id);
      chat.loadMessages(full.messages || []);
      setActiveSessionIdx(idx);
      if (full.file_session_id) {
        await fileManager.restoreSession(full.file_session_id);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }, [sessions, chat, fileManager]);

  const handleDeleteSession = useCallback(async (sessionId) => {
    try {
      await deleteChatSession(sessionId);
      const updated = await listChatSessions();
      setSessions(updated);
      if (chat.chatSessionId === sessionId) {
        chat.clearMessages();
        setActiveSessionIdx(null);
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  }, [chat]);

  const startNewSession = useCallback(() => {
    chat.clearMessages();
    fileManager.clearFiles();
    setActiveSessionIdx(null);
  }, [chat, fileManager]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('bcn_token');
    localStorage.removeItem('bcn_user');
    setUser(null);
    chat.clearMessages();
    fileManager.clearFiles();
    setSessions([]);
    setActiveSessionIdx(null);
  }, [chat, fileManager]);

  // Don't render anything until auth check completes
  if (!authChecked) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        {user ? (
          <Layout
            fileManager={fileManager}
            chat={chat}
            sessions={sessions}
            activeSessionIdx={activeSessionIdx}
            onSelectSession={selectSession}
            onDeleteSession={handleDeleteSession}
            onNewSession={startNewSession}
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          <AuthPage onAuth={setUser} />
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}
