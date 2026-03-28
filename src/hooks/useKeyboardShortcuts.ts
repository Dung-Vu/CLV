"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/useToast";

export interface ShortcutHandlers {
  onSlash?: () => void;
  onEscape?: () => void;
  onJ?: () => void;
  onK?: () => void;
  onC?: () => void;
  onX?: () => void;
  onR?: () => void;
  onA?: () => void;
  onEnter?: () => void;
  onQuestion?: () => void;
  onCmdK?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const router = useRouter();
  const sequenceBuffer = useRef<string[]>([]);
  const sequenceTimer = useRef<NodeJS.Timeout | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current;
      const target = e.target as HTMLElement;

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') {
          if (h.onEscape) h.onEscape();
          window.dispatchEvent(new Event('close-overlays'));
        }
        return;
      }

      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        sequenceBuffer.current = ['g'];
        if (sequenceTimer.current) clearTimeout(sequenceTimer.current);
        sequenceTimer.current = setTimeout(() => {
          sequenceBuffer.current = [];
        }, 1000);
        return;
      }

      if (sequenceBuffer.current[0] === 'g') {
        const key = e.key.toLowerCase();
        if (key === 'f') {
          router.push('/freebies');
          toast({ type: 'INFO', title: 'NAVIGATING', message: 'Sourced to Freebies Data' });
          sequenceBuffer.current = [];
          return;
        } else if (key === 'd') {
          router.push('/dashboard');
          toast({ type: 'INFO', title: 'NAVIGATING', message: 'Sourced to Command Center' });
          sequenceBuffer.current = [];
          return;
        } else if (key === 'l') {
          router.push('/logs');
          toast({ type: 'INFO', title: 'NAVIGATING', message: 'Sourced to System Logs' });
          sequenceBuffer.current = [];
          return;
        } else {
          sequenceBuffer.current = [];
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (h.onCmdK) h.onCmdK();
        window.dispatchEvent(new Event('open-command-palette'));
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          if (h.onSlash) h.onSlash();
          else {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }
          break;
        case 'Escape':
          if (h.onEscape) h.onEscape();
          window.dispatchEvent(new Event('close-overlays'));
          break;
        case 'j':
        case 'J':
          if (h.onJ) h.onJ();
          break;
        case 'k':
        case 'K':
          if (h.onK) h.onK();
          break;
        case 'c':
        case 'C':
          if (h.onC) h.onC();
          break;
        case 'x':
        case 'X':
          if (h.onX) h.onX();
          break;
        case 'r':
        case 'R':
          if (h.onR) h.onR();
          break;
        case 'a':
        case 'A':
          if (h.onA) h.onA();
          break;
        case 'Enter':
          if (h.onEnter) h.onEnter();
          break;
        case '?':
          if (h.onQuestion) h.onQuestion();
          window.dispatchEvent(new Event('open-help-modal'));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
