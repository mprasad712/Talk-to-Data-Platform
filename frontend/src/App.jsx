import React from 'react';
import Layout from './components/Layout';
import FilePanel from './components/FilePanel';
import ChatPanel from './components/ChatPanel';
import ThoughtTrace from './components/ThoughtTrace';
import { useFileManager } from './hooks/useFileManager';
import { useChat } from './hooks/useChat';

export default function App() {
  const fileManager = useFileManager();
  const chat = useChat(fileManager.sessionId);

  return (
    <Layout
      filePanel={
        <FilePanel
          files={fileManager.files}
          uploading={fileManager.uploading}
          error={fileManager.error}
          onUpload={fileManager.upload}
          onRemove={fileManager.removeFile}
          sessionId={fileManager.sessionId}
        />
      }
      chatPanel={
        <ChatPanel
          messages={chat.messages}
          isStreaming={chat.isStreaming}
          onSend={chat.sendMessage}
          onStop={chat.stopStreaming}
          hasFiles={fileManager.files.length > 0}
          generatedCode={chat.generatedCode}
        />
      }
      thoughtTrace={
        <ThoughtTrace
          thoughts={chat.thoughts}
          isStreaming={chat.isStreaming}
        />
      }
    />
  );
}
