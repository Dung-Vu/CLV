"use client";

import { useState } from "react";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { Badge } from "@/components/ui/Badge";
import { ActionButton } from "@/components/ui/ActionButton";
import { toast } from "@/hooks/useToast";
import { Play, Loader2, Power } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function SourcesClient({ initialSources }: { initialSources: any[] }) {
  const { t } = useI18n();
  const [sources, setSources] = useState(initialSources);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      if (res.ok) {
        setSources(sources.map(s => s.id === id ? { ...s, enabled: !currentStatus } : s));
        toast({ type: 'SUCCESS', message: `SOURCE ${!currentStatus ? 'ENABLED' : 'DISABLED'} ✓` });
      } else {
        toast({ type: 'ERROR', message: `FAILED TO UPDATE SOURCE` });
      }
    } catch(err) {
      toast({ type: 'ERROR', message: `NETWORK ERROR` });
    } finally {
      setTogglingId(null);
    }
  };

  const handleTest = async (id: string, name: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/sources/${id}/test`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast({ type: 'SUCCESS', title: `[${name}] TEST OK`, message: `${data.itemsFound} items found. Sample: ${data.sampleTitle}` });
      } else {
        toast({ type: 'ERROR', message: `TEST FAILED FOR ${name}` });
      }
    } catch(err) {
      toast({ type: 'ERROR', message: `NETWORK ERROR` });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-widest text-[var(--accent-green)]">{t('sources.title')}</h1>
          <p className="text-[var(--text-muted)] font-mono text-xs mt-1">Manage active ingestion pipelines and crawlers.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {sources.map(source => (
          <TerminalCard key={source.id} borderColor={source.enabled ? "var(--accent-blue)" : "var(--border-subtle)"} className={`transition-all ${!source.enabled ? 'opacity-70 grayscale-[50%]' : ''}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-[var(--text-primary)] leading-none truncate">{source.name}</h3>
                  <div className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-[var(--accent-green)] animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.6)]' : 'bg-[var(--text-dim)]'}`} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="category">{source.kind.toUpperCase()}</Badge>
                  <Badge variant={source.priority === 'high' ? 'tier-a' as any : source.priority === 'medium' ? 'tier-b' as any : 'default' as any}>{source.priority.toUpperCase()} PRIORITY</Badge>
                  <Badge variant={source.trustLevel === 'high' ? 'success' as any : 'status' as any}>{source.trustLevel.toUpperCase()} TRUST</Badge>
                </div>
                <div className="font-mono text-xs text-[var(--text-muted)] truncate max-w-xl">{source.url}</div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 border-l-0 md:border-l border-[var(--border-t)] border-[var(--border-subtle)] pt-4 md:pt-0 pl-0 md:pl-4 w-full md:w-auto mt-2 md:mt-0">
                <div className="flex w-full sm:w-auto flex-col items-center justify-center p-3 bg-black/20 rounded border border-[var(--border-subtle)] min-w-[120px]">
                  <span className="font-mono text-[10px] text-[var(--text-dim)] uppercase">Ingested Deals</span>
                  <span className="font-mono text-xl text-[var(--accent-blue)] mt-1 tracking-tight">{source.ingestCount}</span>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <ActionButton 
                    variant={source.enabled ? "danger" as any : "primary" as any} 
                    className={`w-full sm:w-32 justify-center py-2 text-xs h-[36px] ${source.enabled ? 'bg-transparent border-[var(--accent-red)] text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-black' : ''}`}
                    onClick={() => handleToggle(source.id, source.enabled)}
                    disabled={togglingId === source.id}
                  >
                    {togglingId === source.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Power className="w-3 h-3 mr-2" /> {source.enabled ? 'DISABLE' : 'ENABLE'}</>}
                  </ActionButton>
                  <ActionButton 
                    variant="secondary" 
                    className="w-full sm:w-32 justify-center py-2 text-xs h-[36px]"
                    onClick={() => handleTest(source.id, source.name)}
                    disabled={testingId === source.id || !source.enabled}
                  >
                    {testingId === source.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-3 h-3 mr-2" /> TEST SOURCE</>}
                  </ActionButton>
                </div>
              </div>
            </div>
          </TerminalCard>
        ))}
      </div>
    </div>
  );
}
