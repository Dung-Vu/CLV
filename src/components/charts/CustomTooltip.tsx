export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 rounded-sm shadow-xl font-mono text-xs z-50">
        <p className="text-[var(--text-muted)] mb-2 font-bold uppercase tracking-widest">{label}</p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color || entry.fill }}></span>
              <span className="text-[var(--text-primary)]">
                {entry.name}: <span className="font-bold" style={{ color: entry.color || entry.fill }}>{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
