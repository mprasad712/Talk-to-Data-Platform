import React, { useState } from 'react';
import { useToast } from './Toast';

export default function MessageFeedback({ messageIndex }) {
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null
  const { addToast } = useToast();

  const handleFeedback = (type) => {
    if (feedback === type) {
      setFeedback(null);
      return;
    }
    setFeedback(type);
    addToast(type === 'up' ? 'Thanks for the feedback!' : 'We\'ll improve this response', 'info');
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleFeedback('up')}
        className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 hover:scale-110"
        style={{
          background: feedback === 'up' ? 'var(--green-tint)' : 'transparent',
          border: feedback === 'up' ? '1px solid var(--green)' : '1px solid transparent',
        }}
        title="Good response"
      >
        <svg
          className="h-3 w-3"
          style={{ color: feedback === 'up' ? 'var(--green)' : 'var(--text-faint)' }}
          fill={feedback === 'up' ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
        </svg>
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 hover:scale-110"
        style={{
          background: feedback === 'down' ? 'var(--red-tint)' : 'transparent',
          border: feedback === 'down' ? '1px solid var(--red)' : '1px solid transparent',
        }}
        title="Poor response"
      >
        <svg
          className="h-3 w-3"
          style={{ color: feedback === 'down' ? 'var(--red)' : 'var(--text-faint)' }}
          fill={feedback === 'down' ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-1.302 4.665c-.245.404.028.96.5.96h1.053c.832 0 1.612-.453 1.918-1.227.306-.774.543-1.59.696-2.434.152-.843.228-1.714.228-2.601 0-1.553-.295-3.036-.831-4.398C20.613 3.453 19.832 3 19 3h-1.053c-.472 0-.745.556-.5.96a8.958 8.958 0 011.302 4.665c0 1.194-.232 2.333-.654 3.375" />
        </svg>
      </button>
    </div>
  );
}
