import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, onStop, isStreaming, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t px-5 py-3" style={{ borderColor: 'var(--bain-border)', background: '#fff' }}>
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Upload CSV files to start...' : 'Ask a question about your data...'}
            disabled={disabled}
            rows={1}
            className="min-h-[40px] w-full resize-none border px-3 py-2.5 text-[13px] leading-relaxed placeholder:text-gray-400 focus:border-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
            style={{ borderColor: 'var(--bain-border)', color: 'var(--text-primary)' }}
          />
        </div>
        {isStreaming ? (
          <button onClick={onStop} className="btn-dark h-[40px] shrink-0">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
            STOP
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={!text.trim() || disabled} className="btn-red h-[40px] shrink-0">
            SEND
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
