"use client";

import { useEffect, useState } from "react";
import { Check, X, Info, AlertTriangle } from "lucide-react";
import { useToast, ToastMessage } from "@/hooks/useToast";

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Defer progress transition strictly after active mount cycle
    const frame = requestAnimationFrame(() => setProgress(0));
    
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(onClose, 300);
    }, 4000);
    
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const getConfig = () => {
    switch (toast.type) {
      case 'SUCCESS': return { 
        borderColor: 'border-[var(--accent-green)]', 
        iconColor: 'bg-[var(--accent-green)] text-black',
        progressColor: 'bg-[var(--accent-green)]',
        colorRef: 'text-[var(--accent-green)]',
        icon: <Check className="w-3.5 h-3.5 stroke-[3]" />,
        defaultTitle: 'OPERATION COMPLETE'
      };
      case 'ERROR': return { 
        borderColor: 'border-[var(--accent-red)]', 
        iconColor: 'bg-[var(--accent-red)] text-black',
        progressColor: 'bg-[var(--accent-red)]',
        colorRef: 'text-[var(--accent-red)]',
        icon: <X className="w-3.5 h-3.5 stroke-[3]" />,
        defaultTitle: 'OPERATION FAILED'
      };
      case 'INFO': return { 
        borderColor: 'border-[var(--accent-blue)]', 
        iconColor: 'bg-[var(--accent-blue)] text-black',
        progressColor: 'bg-[var(--accent-blue)]',
        colorRef: 'text-[var(--accent-blue)]',
        icon: <Info className="w-3.5 h-3.5 stroke-[3]" />,
        defaultTitle: 'SYSTEM INFO'
      };
      case 'WARNING': return { 
        borderColor: 'border-[var(--accent-yellow)]', 
        iconColor: 'bg-[var(--accent-yellow)] text-black',
        progressColor: 'bg-[var(--accent-yellow)]',
        colorRef: 'text-[var(--accent-yellow)]',
        icon: <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />,
        defaultTitle: 'SYSTEM WARNING'
      };
    }
  };

  const c = getConfig();
  
  const transformClass = isClosing 
    ? "translate-x-12 opacity-0" 
    : mounted 
      ? "translate-x-0 opacity-100" 
      : "translate-x-12 opacity-0";

  return (
    <div 
      className={`relative overflow-hidden w-80 max-w-[calc(100vw-2rem)] border ${c.borderColor} bg-[rgba(15,17,23,0.95)] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded pointer-events-auto cursor-pointer transition-all duration-300 ease-out flex flex-col ${transformClass}`}
      onClick={handleClose}
    >
      <div className="p-4 flex gap-3.5 items-start">
        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-sm flex items-center justify-center ${c.iconColor}`}>
          {c.icon}
        </div>
        <div className="flex flex-col gap-1 w-full min-w-0 pr-4">
          <span className={`font-mono text-[11px] uppercase tracking-widest font-bold ${c.colorRef}`}>
            {toast.title || c.defaultTitle}
          </span>
          {toast.message && (
            <p className="font-mono text-[10px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap mt-1">
              {toast.message}
            </p>
          )}
        </div>
      </div>
      
      <button className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100 transition-opacity focus:outline-none">
        <X className={`w-3.5 h-3.5 ${c.colorRef}`} />
      </button>

      {/* Progress Bar */}
      <div className="w-full h-0.5 bg-[var(--border-subtle)] absolute bottom-0 left-0">
        <div 
          className={`h-full ${c.progressColor} transition-all ease-linear`} 
          style={{ width: `${progress}%`, transitionDuration: progress === 100 ? '0ms' : '4000ms' }}
        />
      </div>
    </div>
  );
}
