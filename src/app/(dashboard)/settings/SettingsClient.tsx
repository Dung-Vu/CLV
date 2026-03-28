"use client";

import { useState } from "react";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { toast } from "@/hooks/useToast";
import { AlertTriangle, Loader2, Save, ShieldAlert } from "lucide-react";

const ALL_CATEGORIES = ["ai-tool", "saas", "cloud", "voucher", "other"];

import { useI18n } from "@/lib/i18n/I18nProvider";

export function SettingsClient({ initialPrefs }: { initialPrefs: any }) {
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    minValueUsd: initialPrefs.minValueUsd || 0,
    allowedCategories: initialPrefs.allowedCategories?.length ? initialPrefs.allowedCategories : ALL_CATEGORIES,
    maxRiskLevel: initialPrefs.maxRiskLevel || "medium",
    autoClaimEnabled: initialPrefs.autoClaimEnabled || false,
    autoClaimMinScore: initialPrefs.autoClaimMinScore || 80,
    mode: initialPrefs.mode || "clean",
    language: initialPrefs.language || "vi",
  });
  const [saving, setSaving] = useState(false);

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      allowedCategories: prev.allowedCategories.includes(cat)
        ? prev.allowedCategories.filter((c: string) => c !== cat)
        : [...prev.allowedCategories, cat]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast({ type: 'SUCCESS', title: 'SYSTEM', message: t('settings.saveChanges') + ' ✓' });
        // Request a hard refresh to propagate language changes globally across Server Components if language changed
        if (initialPrefs.language !== formData.language) {
          window.location.reload();
        }
      } else {
        toast({ type: 'ERROR', message: 'FAILED TO SAVE CONFIG' });
      }
    } catch(err: any) {
      toast({ type: 'ERROR', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-widest text-[var(--accent-yellow)]">{t('settings.title')}</h1>
          <p className="text-[var(--text-muted)] font-mono text-xs mt-1">Global logic settings for claim engine and UI bounds.</p>
        </div>
        <ActionButton variant="primary" onClick={handleSave} disabled={saving} className="px-6 py-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {t('settings.saveChanges')}
        </ActionButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* GENERAL METRICS */}
        <TerminalCard title={t('settings.general')} borderColor="var(--border-subtle)">
          <div className="flex flex-col gap-6 font-mono text-sm">
            
            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-dim)] uppercase tracking-widest text-xs">&gt; {t('settings.language')}</label>
              <select 
                value={formData.language}
                onChange={e => setFormData({ ...formData, language: e.target.value })}
                className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-2 rounded text-[var(--accent-green)] font-bold focus:border-[var(--border-active)] outline-none w-full"
              >
                <option value="vi">Tiếng Việt (Mặc định)</option>
                <option value="en">English (Developer Mode)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-dim)] uppercase tracking-widest text-xs">&gt; {t('settings.minValue')}</label>
              <input 
                type="number" 
                value={formData.minValueUsd}
                onChange={e => setFormData({ ...formData, minValueUsd: Number(e.target.value) })}
                className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-2 rounded font-bold text-[var(--accent-green)] focus:border-[var(--accent-green)] outline-none w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-dim)] uppercase tracking-widest text-xs">&gt; {t('settings.maxRisk')}</label>
              <select 
                value={formData.maxRiskLevel}
                onChange={e => setFormData({ ...formData, maxRiskLevel: e.target.value })}
                className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-2 rounded text-[var(--text-primary)] focus:border-[var(--border-active)] outline-none w-full"
              >
                <option value="low">{t('settings.riskLow')}</option>
                <option value="medium">{t('settings.riskMedium')}</option>
                <option value="high">{t('settings.riskHigh')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[var(--text-dim)] uppercase tracking-widest text-xs">&gt; ALLOWED CATEGORIES</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(cat => {
                  const isActive = formData.allowedCategories.includes(cat);
                  return (
                    <div 
                      key={cat}
                      className={`px-3 py-1.5 rounded cursor-pointer border text-xs transition-colors ${isActive ? 'bg-[rgba(14,165,233,0.1)] border-[var(--accent-blue)] text-[var(--accent-blue)]' : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat.toUpperCase()}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </TerminalCard>

        {/* CORE ENGINE */}
        <TerminalCard title="CORE ENGINE" borderColor="var(--accent-yellow)">
          <div className="flex flex-col gap-6 font-mono text-sm">

            <div className="flex flex-col gap-2 p-3 border border-[var(--border-subtle)] rounded-lg bg-black/20">
              <div className="flex items-center justify-between">
                <label className="text-[var(--text-primary)] uppercase tracking-widest text-xs font-bold">&gt; {t('settings.systemMode')}</label>
                <div 
                  className={`relative w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.mode === 'grey' ? 'bg-[var(--accent-red)]' : 'bg-[var(--border-subtle)]'}`}
                  onClick={() => setFormData({ ...formData, mode: formData.mode === 'clean' ? 'grey' : 'clean' })}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formData.mode === 'grey' ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex items-center text-[10px] uppercase font-bold mt-1 gap-2">
                <span className={formData.mode === 'clean' ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'}>CLEAN</span>
                <span className="text-[var(--text-dim)]">/</span>
                <span className={formData.mode === 'grey' ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}>GREY</span>
              </div>
              
              {formData.mode === 'grey' && (
                <div className="mt-2 p-2 bg-[rgba(255,68,68,0.1)] border border-[var(--accent-red)] rounded text-[var(--accent-red)] text-xs flex gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>GREY mode strips identifying data payloads. Highly dangerous if crawler bounds are not strictly defined.</span>
                </div>
              )}
            </div>

            <div className={`flex flex-col gap-4 p-3 border ${formData.autoClaimEnabled ? 'border-[var(--accent-green)] bg-[rgba(0,255,136,0.02)]' : 'border-[var(--border-subtle)] bg-black/20'} rounded-lg transition-colors`}>
              <div className="flex items-center justify-between">
                <label className={`uppercase tracking-widest text-xs font-bold ${formData.autoClaimEnabled ? 'text-[var(--accent-green)]' : 'text-[var(--text-primary)]'}`}>&gt; {t('settings.autoClaim')}</label>
                <div 
                  className={`relative w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.autoClaimEnabled ? 'bg-[var(--accent-green)]' : 'bg-[var(--border-subtle)]'}`}
                  onClick={() => setFormData({ ...formData, autoClaimEnabled: !formData.autoClaimEnabled })}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formData.autoClaimEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
              
              {formData.autoClaimEnabled && (
                <div className="mt-1 p-2 bg-[rgba(245,158,11,0.1)] border border-[var(--accent-yellow)] rounded text-[var(--accent-yellow)] text-xs flex gap-2 animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">{t('settings.autoClaimWarn')}</span>
                </div>
              )}

              <div className={`flex flex-col gap-2 mt-2 transition-opacity ${!formData.autoClaimEnabled ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                <div className="flex justify-between items-center text-[10px] text-[var(--text-dim)] uppercase">
                  <span>Activation Threshold</span>
                  <span className="text-[var(--accent-green)] font-bold text-sm">{formData.autoClaimMinScore} / 100</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  step="5"
                  value={formData.autoClaimMinScore}
                  onChange={e => setFormData({ ...formData, autoClaimMinScore: Number(e.target.value) })}
                  className="w-full accent-[var(--accent-green)] cursor-grab"
                />
              </div>
            </div>

          </div>
        </TerminalCard>

      </div>
    </div>
  );
}
