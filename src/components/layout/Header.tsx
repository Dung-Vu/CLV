"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { StatusDot } from "@/components/ui/StatusDot";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function Header() {
  const pathname = usePathname() || "";
  const { t } = useI18n();
  const paths = pathname.split("/").filter(Boolean);
  
  const [stats, setStats] = useState({ 
    total: 0, 
    new: 0, 
    tierA: 0, 
    pipeline: { raw: 0, analyzed: 0, ignored: 0, claimed: 0, error: 0 } 
  });

  useEffect(() => {
    fetch('/api/stats/header')
      .then(res => res.json())
      .then(data => {
        if (data.total !== undefined) setStats(data);
      })
      .catch(err => console.error("Error fetching header stats:", err));
  }, [pathname]);

  return (
    <header className="h-16 px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] flex flex-wrap items-center justify-between sticky top-0 z-30">
      {/* Breadcrumbs - Terminal Style */}
      <div className="flex items-center text-sm font-mono text-[var(--text-muted)]">
        <span className="text-[var(--accent-blue)]">CLV</span>
        {paths.length > 0 ? (
          paths.map((path, idx) => (
            <span key={idx} className="flex items-center">
              <span className="mx-2 text-[var(--text-dim)]">/</span>
              <span className={idx === paths.length - 1 ? "text-[var(--text-primary)] terminal-cursor" : "text-[var(--text-muted)]"}>
                {path}
              </span>
            </span>
          ))
        ) : (
          <>
            <span className="mx-2 text-[var(--text-dim)]">/</span>
            <span className="text-[var(--text-primary)] terminal-cursor">dashboard</span>
          </>
        )}
      </div>

      {/* Stats & Active Indicator */}
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase mr-4">
          <span className="text-[var(--text-primary)]">{stats.total} {t('header.deals')}</span>
          <span className="text-[var(--text-dim)]">·</span>
          <span className="text-[var(--accent-green)]">{stats.new} {t('header.new')}</span>
          <span className="text-[var(--text-dim)]">·</span>
          <span className="text-[var(--accent-red)]">{stats.tierA} {t('header.tierA')}</span>
          
          {(stats.pipeline?.raw > 0) && (
            <>
              <span className="text-[var(--text-dim)]">·</span>
              <span className="bg-[var(--accent-yellow)] text-black px-1.5 py-0.5 rounded-sm font-bold animate-pulse">
                {stats.pipeline.raw} CHỜ XỬ LÝ
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)] font-mono transition-colors overflow-hidden"
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
          >
            <span className="tracking-widest hidden lg:block">{t('header.command')}</span>
            <kbd className="bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.3)] px-1.5 rounded text-[var(--accent-blue)] font-sans">⌘K</kbd>
          </button>
          
          <button 
            className="flex items-center justify-center w-7 h-7 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)] font-mono transition-colors"
            onClick={() => window.dispatchEvent(new Event('open-help-modal'))}
            title="Shortcuts Help"
          >
            ?
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <StatusDot status="online" className="w-2 h-2 mr-0.5" />
            <span className="text-[10px] font-mono tracking-widest text-[var(--accent-green)] uppercase">{t('nav.active')}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
