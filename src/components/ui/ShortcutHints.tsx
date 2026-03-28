"use client";

import { useEffect, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function ShortcutHints() {
  const { t } = useI18n();
  const [showHelp, setShowHelp] = useState(false);

  // Expose global hook directly within Root Layout via this component
  useKeyboardShortcuts({});

  useEffect(() => {
    const handleOpen = () => setShowHelp(true);
    const handleClose = () => setShowHelp(false);
    window.addEventListener('open-help-modal', handleOpen);
    window.addEventListener('close-overlays', handleClose);
    return () => {
      window.removeEventListener('open-help-modal', handleOpen);
      window.removeEventListener('close-overlays', handleClose);
    };
  }, []);

  return (
    <>
      {showHelp && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-black/40">
              <span className="font-mono text-sm font-bold text-[var(--accent-green)] tracking-widest uppercase">&gt; SYSTEM SHORTCUTS</span>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                ✕
              </button>
            </div>
            
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-[11px] uppercase">
               <div className="flex flex-col gap-4">
                 <h4 className="text-[var(--text-dim)] tracking-[0.2em] mb-2 border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]"></span> {t('shortcuts.global')}
                 </h4>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.cmdPalette')}</span><kbd className="bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.3)] px-2 py-0.5 rounded text-[var(--accent-blue)] font-sans">⌘K</kbd></div>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.goFreebies')}</span><kbd className="bg-black border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-primary)] font-sans">G + F</kbd></div>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.goDash')}</span><kbd className="bg-black border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-primary)] font-sans">G + D</kbd></div>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.search')}</span><kbd className="bg-black border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-primary)] font-sans">/</kbd></div>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.help')}</span><kbd className="bg-black border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-primary)] font-sans">?</kbd></div>
               </div>

               <div className="flex flex-col gap-4">
                 <h4 className="text-[var(--text-dim)] tracking-[0.2em] mb-2 border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]"></span> FREEBIES LIST
                 </h4>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.navUp')}</span><kbd className="bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.3)] px-2 py-0.5 rounded text-[var(--accent-green)] font-sans">J / K</kbd></div>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.viewDetail')}</span><kbd className="bg-black border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-primary)] font-sans">Enter</kbd></div>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.markClaim')}</span><kbd className="bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.3)] px-2 py-0.5 rounded text-[var(--accent-green)] font-sans">C</kbd></div>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.markIgnore')}</span><kbd className="bg-[rgba(255,68,68,0.05)] border border-[rgba(255,68,68,0.3)] px-2 py-0.5 rounded text-[var(--accent-red)] font-sans">X</kbd></div>
                 <div className="flex justify-between items-center"><span className="text-[var(--text-muted)]">{t('shortcuts.runIngest')}</span><kbd className="bg-[rgba(14,165,233,0.05)] border border-[rgba(14,165,233,0.3)] px-2 py-0.5 rounded text-[var(--accent-blue)] font-sans">R</kbd></div>
               </div>
            </div>
            
            <div className="p-3 bg-black/20 border-t border-[var(--border-subtle)] text-center text-[10px] text-[var(--text-dim)] font-mono tracking-widest">
              PRESS ESC TO CLOSE
            </div>
          </div>
        </div>
      )}
    </>
  );
}
