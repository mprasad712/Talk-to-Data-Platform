import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../api/client';

export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const controllerRef = useRef(null);

  const sendMessage = useCallback(
    (query) => {
      if (!sessionId || !query.trim() || isStreaming) return;

      // Add user message
      setMessages((prev) => [...prev, { role: 'user', content: query }]);
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
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.content },
          ]);
        },
        // onError
        (data) => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `Error: ${data.message}`,
              isError: true,
            },
          ]);
          setIsStreaming(false);
        },
        // onDone
        () => {
          setIsStreaming(false);
        }
      );
    },
    [sessionId, isStreaming]
  );

  const stopStreaming = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
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
