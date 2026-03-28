import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="slide-up glass-heavy flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-xl"
            style={{ border: '1px solid var(--border-color)', minWidth: 220 }}
          >
            {toast.type === 'success' && (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--green-tint)' }}>
                <svg className="h-3 w-3" style={{ color: 'var(--green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {toast.type === 'info' && (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--blue-tint)' }}>
                <svg className="h-3 w-3" style={{ color: 'var(--blue)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
            )}
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
