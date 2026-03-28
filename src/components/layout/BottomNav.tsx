"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Target, TerminalSquare, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function BottomNav() {
  const pathname = usePathname() || "";
  const { t } = useI18n();
  
  const navItems = [
    { href: "/", label: t('nav.feed'), icon: Activity },
    { href: "/freebies", label: t('nav.freebies'), icon: Target },
    { href: "/logs", label: t('nav.logs'), icon: TerminalSquare },
    { href: "/settings", label: t('nav.config'), icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full h-[65px] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] z-[100] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
      {navItems.map(item => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors relative ${isActive ? "text-[var(--accent-green)]" : "text-[var(--text-muted)]"}`}
          >
            {isActive && <div className="absolute top-0 w-8 h-[2px] bg-[var(--accent-green)] shadow-[0_0_10px_var(--accent-green)]" />}
            <item.icon size={20} className={isActive ? "animate-pulse" : ""} />
            <span className="text-[9px] font-mono tracking-widest">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
