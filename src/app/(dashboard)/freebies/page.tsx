"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, LayoutGrid, List, ChevronDown, Check, X as XIcon, Loader2 } from "lucide-react";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyNoResults } from "@/components/ui/EmptyState";
import { toast } from "@/hooks/useToast";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useI18n } from "@/lib/i18n/I18nProvider";

const tiers = ["ALL", "A", "B", "C"];
const categories = ["ALL", "AI-TOOL", "SAAS", "CLOUD", "VOUCHER"];
const statuses = ["ALL", "RAW", "ANALYZED", "CLAIMED", "IGNORED"];

function FreebiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { t } = useI18n();

  const urlTier = searchParams.get('tier') || "ALL";
  const urlCategory = searchParams.get('category') || "ALL";
  const urlStatus = searchParams.get('status') || "ALL";
  const urlSearch = searchParams.get('search') || "";
  const urlSort = searchParams.get('sort') || "score";
  const urlPage = parseInt(searchParams.get('page') || "1", 10);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const [activeTier, setActiveTier] = useState(urlTier);
  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [activeStatus, setActiveStatus] = useState(urlStatus);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [activeSort, setActiveSort] = useState(urlSort);
  const [page, setPage] = useState(urlPage);

  const [deals, setDeals] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [swipeState, setSwipeState] = useState({ id: '', offset: 0, isDragging: false });
  const touchStartRef = useRef<{ x: number, y: number, id: string } | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (activeTier !== 'ALL') queryParams.set('tier', activeTier);
        if (activeCategory !== 'ALL') queryParams.set('category', activeCategory);
        if (activeStatus !== 'ALL') queryParams.set('status', activeStatus.toLowerCase());
        if (searchQuery) queryParams.set('search', searchQuery);
        queryParams.set('sort', activeSort);
        queryParams.set('page', page.toString());
        queryParams.set('pageSize', '20');

        // Sync URL locally
        const urlParams = new URLSearchParams();
        if (activeTier !== 'ALL') urlParams.set('tier', activeTier);
        if (activeCategory !== 'ALL') urlParams.set('category', activeCategory);
        if (activeStatus !== 'ALL') urlParams.set('status', activeStatus);
        if (searchQuery) urlParams.set('search', searchQuery);
        if (activeSort !== 'score') urlParams.set('sort', activeSort);
        if (page > 1) urlParams.set('page', page.toString());
        
        router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false });

        const res = await fetch(`/api/freebies?${queryParams.toString()}`);
        const data = await res.json();
        
        const fetchedDeals = Array.isArray(data) ? data : (data.items || data.data || []);
        setDeals(fetchedDeals);
        setTotalPages(Math.max(1, Math.ceil((data.total || 0) / 20)));
      } catch(err) {
        toast({ type: 'ERROR', message: "FETCH FAILED", title: "API CONNECTION ERROR" });
      } finally {
        setLoading(false);
      }
    }
    
    // Quick debounce for smooth Search Inputs scaling
    const timer = setTimeout(fetchDeals, 300);
    return () => clearTimeout(timer);
  }, [activeTier, activeCategory, activeStatus, searchQuery, activeSort, page, pathname, router]);

  const getTierBadge = (tier: string) => {
    switch(tier?.toUpperCase()) {
      case "A": return "tier-a";
      case "B": return "tier-b";
      case "C": return "tier-c";
      default: return "default";
    }
  };
  
  const getTierColor = (tier: string) => {
    switch(tier?.toUpperCase()) {
      case "A": return "var(--accent-green)";
      case "B": return "var(--accent-yellow)";
      case "C": return "var(--accent-red)";
      default: return "var(--border-subtle)";
    }
  };

  const handleClaim = (deal: any) => {
    toast({ type: 'SUCCESS', title: 'CLAIM INITIATED', message: `Executing claim flow for ${deal.title.substring(0,25)}...` });
  };

  useKeyboardShortcuts({
    onJ: () => {
      setFocusedIndex(prev => {
        const next = Math.min(prev + 1, deals.length - 1);
        document.getElementById(`deal-card-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return next;
      });
    },
    onK: () => {
      setFocusedIndex(prev => {
        const next = Math.max(prev - 1, 0);
        document.getElementById(`deal-card-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return next;
      });
    },
    onC: () => {
      if (focusedIndex >= 0 && focusedIndex < deals.length) {
        handleClaim(deals[focusedIndex]);
      }
    },
    onX: () => {
      if (focusedIndex >= 0 && focusedIndex < deals.length) {
        toast({ type: 'INFO', message: `Deal [${deals[focusedIndex].title.substring(0, 15)}...] ignored.` });
      }
    },
    onEnter: () => {
      if (focusedIndex >= 0 && focusedIndex < deals.length) {
        router.push(`/freebies/${deals[focusedIndex].id}`);
      }
    },
    onR: () => toast({ type: 'SUCCESS', title: 'SYSTEM', message: 'INGESTION INITIATED' }),
    onA: () => toast({ type: 'SUCCESS', title: 'SYSTEM', message: 'ANALYZER INITIATED' }),
  });

  const handleTouchStart = (e: React.TouchEvent, dealId: string) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, id: dealId };
    setSwipeState({ id: dealId, offset: 0, isDragging: true });
  };

  const handleTouchMove = (e: React.TouchEvent, deal: any) => {
    if (!touchStartRef.current || touchStartRef.current.id !== deal.id) return;
    
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;
    
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
      setSwipeState(s => ({ ...s, offset: 0, isDragging: false }));
      touchStartRef.current = null;
      return;
    }

    if (deltaX > 0 && deal.tier !== 'A') {
      setSwipeState(s => ({ ...s, offset: 0 }));
      return;
    }

    setSwipeState(s => ({ ...s, offset: Math.max(Math.min(deltaX, 150), -150) }));
  };

  const handleTouchEnd = (e: React.TouchEvent, deal: any) => {
    if (!touchStartRef.current || touchStartRef.current.id !== deal.id) return;
    
    const threshold = 80;
    
    if (swipeState.offset > threshold && deal.tier === 'A') {
      handleClaim(deal);
    } else if (swipeState.offset < -threshold) {
      toast({ type: 'INFO', message: 'DEAL IGNORED (QUICK ACTION)' });
    }
    
    setSwipeState(s => ({ ...s, offset: 0, isDragging: false }));
    touchStartRef.current = null;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300 pb-20">
      
      <div className="flex flex-col gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent-green)]" />
            <input 
              type="text" 
              placeholder={`> ${t('freebies.search')}`} 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--accent-green)] rounded font-mono text-sm pl-10 pr-4 py-2 outline-none transition-colors terminal-cursor text-[var(--text-primary)]"
            />
          </div>
          
          <div className="hidden sm:flex items-center gap-2 self-end sm:self-auto">
            <ActionButton 
              variant={viewMode === 'grid' ? 'primary' : 'secondary'} 
              className="px-3"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </ActionButton>
            <ActionButton 
              variant={viewMode === 'table' ? 'primary' : 'secondary'} 
              className="px-3"
              onClick={() => setViewMode('table')}
            >
              <List size={16} />
            </ActionButton>
          </div>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-3 w-full scrollbar-thin scrollbar-thumb-[var(--border-subtle)]">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-[var(--text-dim)] uppercase">{t('freebies.tiers')}</span>
            <div className="flex gap-1 bg-[var(--bg-surface)] p-1 rounded border border-[var(--border-subtle)]">
              {tiers.map(t => (
                <button
                  key={t}
                  onClick={() => { setActiveTier(t); setPage(1); }}
                  className={`px-3 py-1 font-mono text-[10px] rounded transition-colors ${
                    activeTier === t 
                      ? "bg-[rgba(0,255,136,0.1)] text-[var(--accent-green)] border border-[rgba(0,255,136,0.3)] shadow-[0_0_10px_rgba(0,255,136,0.1)]" 
                      : "text-[var(--text-muted)] border border-transparent hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t === "ALL" ? "ALL" : `TIER ${t}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-[var(--text-dim)] uppercase">{t('freebies.type')}</span>
            <div className="flex gap-1 bg-[var(--bg-surface)] p-1 rounded border border-[var(--border-subtle)]">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => { setActiveCategory(c); setPage(1); }}
                  className={`px-3 py-1 font-mono text-[10px] rounded transition-colors ${
                    activeCategory === c 
                      ? "bg-[rgba(14,165,233,0.1)] text-[var(--accent-blue)] border border-[rgba(14,165,233,0.3)]" 
                      : "text-[var(--text-muted)] border border-transparent hover:text-[var(--text-primary)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 border-l border-[var(--border-subtle)] pl-4">
            <span className="text-xs font-mono text-[var(--text-dim)] uppercase">{t('freebies.sort')}</span>
            <div className="relative">
              <select 
                value={activeSort}
                onChange={(e) => { setActiveSort(e.target.value); setPage(1); }}
                className="appearance-none bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent-green)] font-mono text-[10px] px-3 py-1.5 pr-8 rounded focus:outline-none focus:border-[var(--border-active)] hover:border-[var(--text-dim)] transition-colors cursor-pointer"
              >
                <option value="score">{t('freebies.sortScoreDesc')}</option>
                <option value="createdAt">{t('freebies.sortLatest')}</option>
                <option value="valueUsd">{t('freebies.sortValueDesc')}</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--accent-green)] pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mr-4">
            <span className="text-xs font-mono text-[var(--text-dim)] uppercase">{t('freebies.status')}</span>
            <div className="relative">
              <select 
                value={activeStatus}
                onChange={(e) => { setActiveStatus(e.target.value); setPage(1); }}
                className="appearance-none bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-[10px] px-3 py-1.5 pr-8 rounded focus:outline-none focus:border-[var(--border-active)] hover:border-[var(--text-dim)] transition-colors cursor-pointer"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className={`relative min-h-[50vh] ${loading ? "opacity-50 pointer-events-none grayscale-[50%]" : "opacity-100"} transition-all duration-300`}>
        {loading && deals.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none pb-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-green)] mb-4" />
            <div className="font-mono text-[var(--text-dim)] text-sm terminal-cursor mb-4">&gt; {t('freebies.fetching')}</div>
          </div>
        )}

        {deals.length === 0 && !loading ? (
          <EmptyNoResults onClearFilters={() => {
            setActiveTier("ALL");
            setActiveCategory("ALL");
            setActiveStatus("ALL");
            setSearchQuery("");
            setActiveSort("score");
            setPage(1);
          }} />
        ) : (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${viewMode === 'table' ? 'hidden md:hidden max-md:grid' : ''}`}>
              {deals.map((deal, idx) => {
                const isFocused = idx === focusedIndex;
                return (
                  <div 
                    key={deal.id}
                    className="relative overflow-hidden rounded-sm h-full"
                    onTouchStart={e => handleTouchStart(e, deal.id)}
                    onTouchMove={e => handleTouchMove(e, deal)}
                    onTouchEnd={e => handleTouchEnd(e, deal)}
                  >
                    <div className={`absolute inset-0 flex items-center font-mono text-sm tracking-widest font-bold ${swipeState.id === deal.id && swipeState.offset > 0 ? 'bg-[var(--accent-green)] text-black justify-start pl-6' : 'bg-[var(--accent-red)] text-white justify-end pr-6'} transition-opacity duration-200 ${(swipeState.id === deal.id && swipeState.offset !== 0) ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}>
                      {swipeState.id === deal.id && swipeState.offset > 0 ? (
                        <span className="flex items-center gap-2 animate-pulse"><Check className="w-5 h-5"/> CLAIM TIER A</span>
                      ) : (
                        <span className="flex items-center gap-2 animate-pulse">IGNORE DELETED <XIcon className="w-5 h-5"/></span>
                      )}
                    </div>
                    
                    <div 
                      style={{ 
                        transform: swipeState.id === deal.id ? `translateX(${swipeState.offset}px)` : 'translateX(0)',
                        transition: swipeState.id === deal.id && !swipeState.isDragging ? 'transform 0.2s ease-out' : 'none'
                      }}
                      className="relative z-10 h-full"
                    >
                      <TerminalCard
                        id={`deal-card-${idx}`}
                        borderColor={isFocused ? 'var(--accent-green)' : getTierColor(deal.tier)}
                        glowOnHover
                        className={`h-full group transition-all duration-200 ${
                          isFocused ? 'scale-[1.03] shadow-[0_0_20px_rgba(0,255,136,0.15)] z-10 !border-[var(--accent-green)] border-l-[3px]' : ''
                        }`}
                      >
                        {isFocused && (
                          <div className="absolute top-[-1px] left-[-3px] bottom-[-1px] w-[3px] bg-[var(--accent-green)] opacity-100 rounded-l-sm z-30" />
                        )}
                        {isFocused && (
                          <div className="absolute top-2 right-3 text-[var(--accent-green)] text-[10px] font-mono animate-[blink_1s_step-end_infinite] font-bold pointer-events-none z-30">&lt;FOCUSED&gt;</div>
                        )}
                        <div className="flex flex-col h-full gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-[var(--text-primary)] leading-tight flex-1 group-hover:text-white transition-colors cursor-pointer" onClick={() => router.push(`/freebies/${deal.id}`)}>
                              {deal.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <ScoreBadge score={deal.score || 0} />
                            {deal.tier ? (
                              <Badge variant={getTierBadge(deal.tier) as BadgeVariant}>TIER {deal.tier}</Badge>
                            ) : (
                              <Badge variant="default">{t('freebies.unranked')}</Badge>
                            )}
                            <Badge variant="category">{deal.category || t('freebies.unknown')}</Badge>
                            {deal.status === 'claimed' && <Badge variant="success">CLAIMED</Badge>}
                          </div>

                          <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed flex-1 mt-1">
                            {deal.summaryVi || deal.description || 'Chưa cung cấp dữ liệu phân tích cụ thể.'}
                          </p>

                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-[var(--text-dim)] border-t border-[var(--border-subtle)] pt-3 mt-1">
                            <span className="flex items-center gap-1 group-hover:text-[var(--accent-green)] transition-colors">
                              <span className="text-[var(--text-muted)]">$</span>{deal.valueUsd || '0'}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-[var(--text-muted)]">EXP:</span>{deal.expiry ? new Date(deal.expiry).toISOString().split('T')[0] : 'N/A'}
                            </span>
                            <span className={`flex items-center gap-1 ${deal.riskLevel?.toLowerCase() === 'low' ? 'text-[var(--accent-blue)]' : deal.riskLevel?.toLowerCase() === 'high' ? 'text-[var(--accent-red)]' : 'text-[var(--accent-yellow)]'}`}>
                              <span className="text-[var(--text-muted)]">RSK:</span>{deal.riskLevel ? deal.riskLevel.toUpperCase() : 'UNK'}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 w-full">
                            <ActionButton variant="secondary" className="w-full sm:flex-1" onClick={() => router.push(`/freebies/${deal.id}`)}>
                              VIEW
                            </ActionButton>
                            {deal.tier === 'A' && deal.status !== 'claimed' && (
                              <ActionButton variant="primary" className="w-full sm:flex-1" onClick={() => handleClaim(deal)}>
                                CLAIM ✓
                              </ActionButton>
                            )}
                          </div>
                        </div>
                      </TerminalCard>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TABLE VIEW */}
            <div className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg overflow-x-auto hidden ${viewMode === 'table' ? 'md:block' : ''}`}>
              <table className="w-full text-left font-mono text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-black/20 text-[var(--text-dim)]">
                    <th className="px-4 py-3 font-normal">Score</th>
                    <th className="px-4 py-3 font-normal">Tier</th>
                    <th className="px-4 py-3 font-normal w-full">Title</th>
                    <th className="px-4 py-3 font-normal">Category</th>
                    <th className="px-4 py-3 font-normal">Value</th>
                    <th className="px-4 py-3 font-normal">Status</th>
                    <th className="px-4 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal, idx) => {
                    const isFocused = idx === focusedIndex;
                    return (
                    <tr key={deal.id} id={`deal-card-${idx}`} className={`border-b border-[var(--border-subtle)] cursor-pointer transition-colors ${
                      isFocused ? 'bg-[rgba(0,255,136,0.05)] text-[var(--accent-green)] border-l-[3px] border-l-[var(--accent-green)]' : 'hover:bg-[rgba(255,255,255,0.02)] text-[var(--text-primary)] border-l-[3px] border-l-transparent'
                    }`} onClick={() => router.push(`/freebies/${deal.id}`)}>
                      <td className="px-4 py-3 relative">
                        {isFocused && <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[var(--accent-green)] animate-[blink_1s_step-end_infinite] font-bold">&gt;</span>}
                        <ScoreBadge score={deal.score || 0} />
                      </td>
                      <td className="px-4 py-3">
                        {deal.tier ? (
                          <Badge variant={getTierBadge(deal.tier) as BadgeVariant}>TIER {deal.tier}</Badge>
                        ) : (
                          <Badge variant="default">UNRANKED</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[300px] whitespace-normal line-clamp-1">{deal.title}</td>
                      <td className="px-4 py-3"><Badge variant="category">{deal.category || 'UNKNOWN'}</Badge></td>
                      <td className="px-4 py-3 font-bold text-[var(--accent-green)]">${deal.valueUsd || '0'}</td>
                      <td className="px-4 py-3"><Badge variant={deal.status === 'claimed' ? 'success' : deal.status === 'raw' ? 'default' : 'status'}>{deal.status?.toUpperCase() || 'RAW'}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <ActionButton variant="secondary" className="px-3 py-1 text-[10px]" onClick={(e) => { e.stopPropagation(); router.push(`/freebies/${deal.id}`)}}>
                          VIEW
                        </ActionButton>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BLOCK */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-subtle)]">
                <div className="font-mono text-xs text-[var(--text-dim)] pl-2">
                  PAGE <span className="text-[var(--accent-green)]">{page}</span> / {totalPages}
                </div>
                <div className="flex gap-2">
                  <ActionButton 
                    variant="secondary" 
                    disabled={page <= 1} 
                    onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="px-3"
                  >
                    ← PREV
                  </ActionButton>
                  <ActionButton 
                    variant="secondary" 
                    disabled={page >= totalPages} 
                    onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="px-3"
                  >
                    NEXT →
                  </ActionButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function FreebiesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-green)]" />
        <div className="font-mono text-[var(--text-dim)] text-sm terminal-cursor">&gt; INITIALIZING FREEBIES UI...</div>
      </div>
    }>
      <FreebiesContent />
    </Suspense>
  )
}
