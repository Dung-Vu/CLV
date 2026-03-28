"use client";

import { useState, useEffect } from 'react';

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message?: string;
}

type ToastListener = (toast: ToastMessage) => void;
let listeners: ToastListener[] = [];

export const toast = (options: Omit<ToastMessage, 'id'>) => {
  const newToast = { ...options, id: Math.random().toString(36).substring(2, 9) };
  listeners.forEach(l => l(newToast));
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (newToast: ToastMessage) => {
      setToasts(prev => {
        const next = [...prev, newToast];
        if (next.length > 3) return next.slice(next.length - 3);
        return next;
      });
    };
    listeners.push(handleToast);
    return () => {
      listeners = listeners.filter(l => l !== handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, removeToast };
};
