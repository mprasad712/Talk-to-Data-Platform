import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../api/client';

export function useChat(sessionId, onRelationshipsDetected) {
  const [messages, setMessages] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const controllerRef = useRef(null);
  const pendingTableRef = useRef(null);

  const sendMessage = useCallback(
    (query) => {
      if (!sessionId || !query.trim() || isStreaming) return;

      // Add user message and a placeholder assistant message
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: query, timestamp: Date.now() },
        { role: 'assistant', content: '', isPlaceholder: true, timestamp: Date.now() },
      ]);
      setThoughts([]);
      setGeneratedCode(null);
      setIsStreaming(true);
      pendingTableRef.current = null;

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
        // onAnswer — update the placeholder assistant message (never add a new one)
        (data) => {
          setMessages((prev) => {
            const updated = [...prev];
            // Find the last assistant placeholder or assistant message
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
            // Fallback: add new message
            return [...prev, { role: 'assistant', content: data.content, csv: data.csv || null, citations: data.citations || null, timestamp: Date.now() }];
          });
        },
        // onError
        (data) => {
          setMessages((prev) => {
            // Replace placeholder with error
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
          // Remove placeholder if still empty
          setMessages((prev) => prev.filter((m) => !m.isPlaceholder));
          setIsStreaming(false);
        },
        // onRelationships
        (data) => {
          if (onRelationshipsDetected) onRelationshipsDetected(data);
        }
      );
    },
    [sessionId, isStreaming, onRelationshipsDetected]
  );

  const stopStreaming = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setMessages((prev) => prev.filter((m) => !m.isPlaceholder));
      setIsStreaming(false);
    }
  }, []);

  return {
    messages,
    thoughts,
    generatedCode,
    isStreaming,
    sendMessage,
    stopStreaming,
  };
}
