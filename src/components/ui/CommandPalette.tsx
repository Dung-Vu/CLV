'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TerminalSquare, Activity, Target, Zap, Settings, Filter } from 'lucide-react';
import { toast } from '@/hooks/useToast';

const COMMANDS = [
  {
    id: 'run-ingestion',
    label: 'Run System Ingestion',
    sub: 'Fetch deals from all active sources',
    icon: Zap,
    section: 'ACTIONS',
  },
  {
    id: 'run-analyzer',
    label: 'Run AI Analyzer',
    sub: 'Score and classify raw deals',
    icon: Activity,
    section: 'ACTIONS',
  },
  {
    id: 'filter-tiera',
    label: 'Filter Tier A Deals',
    sub: 'Show highly recommended freebies',
    icon: Filter,
    section: 'ACTIONS',
    href: '/freebies?tier=A',
  },
  {
    id: 'go-dashboard',
    label: 'Open Command Center',
    sub: 'go to /',
    icon: TerminalSquare,
    section: 'NAVIGATION',
    href: '/',
  },
  {
    id: 'go-freebies',
    label: 'Open Freebies',
    sub: 'go to /freebies',
    icon: Target,
    section: 'NAVIGATION',
    href: '/freebies',
  },
  {
    id: 'go-logs',
    label: 'Open Logs',
    sub: 'go to /logs',
    icon: TerminalSquare,
    section: 'NAVIGATION',
    href: '/logs',
  },
  {
    id: 'go-config',
    label: 'Open Config',
    sub: 'go to /settings',
    icon: Settings,
    section: 'NAVIGATION',
    href: '/settings',
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    const handleClose = () => setOpen(false);

    window.addEventListener('open-command-palette', handleOpen);
    window.addEventListener('close-overlays', handleClose);

    return () => {
      window.removeEventListener('open-command-palette', handleOpen);
      window.removeEventListener('close-overlays', handleClose);
    };
  }, []);

  const results = COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.sub.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = (cmd: (typeof COMMANDS)[0]) => {
    setOpen(false);
    setQuery('');

    if (cmd.href) {
      router.push(cmd.href);
      toast({
        type: 'INFO',
        title: 'NAVIGATING',
        message: `Sourced to ${cmd.label.toUpperCase()}`,
      });
    } else if (cmd.id === 'run-ingestion') {
      toast({ type: 'SUCCESS', title: 'SYSTEM', message: 'INGESTION MANUALLY TRIGGERED' });
    } else if (cmd.id === 'run-analyzer') {
      toast({ type: 'SUCCESS', title: 'SYSTEM', message: 'ANALYZER MANUALLY TRIGGERED' });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : i));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      executeCommand(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div
        className="w-full max-w-xl mx-4 bg-[var(--bg-surface)] border border-[var(--border-active)] rounded-md shadow-[0_0_50px_rgba(14,165,233,0.15)] flex flex-col overflow-hidden animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-subtle)] bg-[rgba(14,165,233,0.05)]">
          <span className="text-[var(--accent-blue)] mr-3 font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] terminal-cursor"
          />
          <span className="text-[9px] font-mono text-[var(--text-dim)] bg-black/40 px-2 py-0.5 rounded border border-[var(--border-subtle)] uppercase">
            ESC TO CLOSE
          </span>
        </div>

        <div className="flex flex-col max-h-[45vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((cmd, idx) => {
              const active = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  className={`flex items-center gap-4 px-3 py-2.5 rounded cursor-pointer transition-colors font-mono text-xs ${
                    active
                      ? 'bg-[rgba(14,165,233,0.1)] text-[var(--accent-blue)] border border-[rgba(14,165,233,0.3)] shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                      : 'text-[var(--text-muted)] border border-transparent hover:bg-[var(--bg-elevated)]'
                  }`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => executeCommand(cmd)}
                >
                  <cmd.icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-[var(--accent-blue)]' : 'text-[var(--text-dim)]'}`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      className={
                        active
                          ? 'text-[var(--text-primary)] font-bold tracking-wide'
                          : 'text-[var(--text-primary)]'
                      }
                    >
                      {cmd.label}
                    </span>
                    <span
                      className={`text-[10px] truncate ${active ? 'text-[var(--accent-blue)] opacity-80' : 'text-[var(--text-dim)]'}`}
                    >
                      {cmd.sub}
                    </span>
                  </div>
                  {active && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-black/20 rounded border border-[rgba(14,165,233,0.3)] shrink-0">
                      ↵ ENTER
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-10 flex flex-col items-center justify-center gap-3 text-center font-mono">
              <Search className="w-8 h-8 text-[var(--text-dim)]" />
              <div className="text-xs text-[var(--text-dim)] uppercase tracking-widest">
                &gt; NO COMMANDS MATCH QUERY_
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
