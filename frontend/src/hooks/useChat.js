import { useState, useCallback, useRef } from 'react';
import { streamChat, createChatSession } from '../api/client';

export function useChat(sessionId, onRelationshipsDetected) {
  const [messages, setMessages] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const controllerRef = useRef(null);
  const chatSessionIdRef = useRef(null);

  // Keep ref in sync with state
  const updateChatSessionId = useCallback((id) => {
    chatSessionIdRef.current = id;
    setChatSessionId(id);
  }, []);

  const loadMessages = useCallback((msgs) => {
    setMessages(msgs);
  }, []);

  const sendMessage = useCallback(
    async (query) => {
      if (!sessionId || !query.trim() || isStreaming) return;

      // Create chat session in DB if we don't have one yet
      let csId = chatSessionIdRef.current;
      if (!csId) {
        try {
          const session = await createChatSession(query.slice(0, 60), sessionId);
          csId = session.session_id;
          updateChatSessionId(csId);
        } catch (e) {
          console.error('Failed to create chat session:', e);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: query, timestamp: Date.now() },
        { role: 'assistant', content: '', isPlaceholder: true, timestamp: Date.now() },
      ]);
      setThoughts([]);
      setGeneratedCode(null);
      setIsStreaming(true);

      controllerRef.current = streamChat(
        sessionId,
        query,
        // onThought
        (data) => {
          setThoughts((prev) => [...prev, data]);
        },
        // onCode
        (data) => {
          setGeneratedCode(data.code);
        },
        // onAnswer
        (data) => {
          setMessages((prev) => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant' && !updated[i].isError) {
                updated[i] = {
                  role: 'assistant',
                  content: data.content,
                  csv: data.csv || null,
                  citations: data.citations || null,
                  isPlaceholder: false,
                  timestamp: Date.now(),
                };
                return updated;
              }
            }
            return [...prev, { role: 'assistant', content: data.content, csv: data.csv || null, citations: data.citations || null, timestamp: Date.now() }];
          });
        },
        // onError
        (data) => {
          setMessages((prev) => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant' && updated[i].isPlaceholder) {
                updated[i] = {
                  role: 'assistant',
                  content: `Error: ${data.message}`,
                  isError: true,
                  timestamp: Date.now(),
                };
                return updated;
              }
            }
            return [
              ...prev,
              { role: 'assistant', content: `Error: ${data.message}`, isError: true, timestamp: Date.now() },
            ];
          });
          setIsStreaming(false);
        },
        // onDone
        () => {
          setMessages((prev) => prev.filter((m) => !m.isPlaceholder));
          setIsStreaming(false);
        },
        // onRelationships
        (data) => {
          if (onRelationshipsDetected) onRelationshipsDetected(data);
        },
        // chatSessionId for DB persistence
        csId
      );
    },
    [sessionId, isStreaming, onRelationshipsDetected, updateChatSessionId]
  );

  const stopStreaming = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setMessages((prev) => prev.filter((m) => !m.isPlaceholder));
      setIsStreaming(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setThoughts([]);
    setGeneratedCode(null);
    updateChatSessionId(null);
  }, [updateChatSessionId]);

  return {
    messages,
    thoughts,
    generatedCode,
    isStreaming,
    chatSessionId,
    setChatSessionId: updateChatSessionId,
    sendMessage,
    stopStreaming,
    loadMessages,
    clearMessages,
  };
}
