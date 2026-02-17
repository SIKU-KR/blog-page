'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearToastTimer = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    toastTimersRef.current.delete(id);
  }, []);

  const removeToast = useCallback(
    (id: string) => {
      clearToastTimer(id);
      setToasts(prev => prev.filter(toast => toast.id !== id));
    },
    [clearToastTimer]
  );

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      // 서버사이드 렌더링 안전한 ID 생성
      const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setToasts(prev => [...prev, { id, message, type }]);

      // Auto-remove after 5 seconds
      const timer = setTimeout(() => {
        removeToast(id);
      }, 5000);

      toastTimersRef.current.set(id, timer);
    },
    [removeToast]
  );

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach(timer => {
        clearTimeout(timer);
      });
      toastTimersRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            rounded-md px-4 py-3 shadow-md min-w-[250px] max-w-sm
            flex items-center justify-between
            ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-800 border-l-4 border-green-600'
                : toast.type === 'error'
                  ? 'bg-red-50 text-red-800 border-l-4 border-red-600'
                  : toast.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-600'
                    : 'bg-blue-50 text-blue-800 border-l-4 border-blue-600'
            }
          `}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-gray-500 hover:text-gray-700"
            aria-label="Close toast"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
