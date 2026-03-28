"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Target, Rss, TerminalSquare, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { StatusDot } from "@/components/ui/StatusDot";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function Sidebar() {
  const pathname = usePathname() || "";
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/", label: t('nav.feed'), icon: Activity },
    { href: "/freebies", label: t('nav.freebies'), icon: Target },
    { href: "/sources", label: t('nav.sources'), icon: Rss },
    { href: "/logs", label: t('nav.logs'), icon: TerminalSquare },
    { href: "/settings", label: t('nav.config'), icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] transition-all duration-300 z-40 ${
        collapsed ? "w-[80px]" : "w-[220px]"
      }`}
    >
      {/* Header / Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[var(--border-subtle)]">
        <div className="flex-1 overflow-hidden transition-opacity duration-300 whitespace-nowrap">
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="text-[var(--accent-green)] font-bold text-lg tracking-wider">🎯 CLV</span>
              <span className="text-[var(--text-muted)] text-[10px] tracking-widest uppercase font-mono terminal-cursor">Freebie Hunter</span>
            </div>
          ) : (
            <span className="text-[var(--accent-green)] font-bold text-lg">🎯</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center px-4 py-3 mx-2 rounded-sm transition-all duration-200 border-l-2 ${
                isActive
                  ? "border-[var(--accent-green)] bg-[rgba(0,255,136,0.05)] text-[var(--accent-green)] glow-active"
                  : "border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              }`}
            >
              <item.icon size={18} className={`shrink-0 ${isActive ? "text-[var(--accent-green)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"}`} />
              {!collapsed && (
                <span className="ml-3 font-mono text-sm tracking-wide whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <div className={`flex items-center p-2 rounded terminal-card ${collapsed ? "justify-center" : "gap-3"}`}>
          <StatusDot status="online" className="shrink-0" />
          {!collapsed && (
            <span className="text-[10px] font-mono tracking-widest text-[var(--accent-green)] uppercase whitespace-nowrap">
              {t('nav.active')}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
