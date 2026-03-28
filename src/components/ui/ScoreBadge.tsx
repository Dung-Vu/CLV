"use client";

import { useEffect, useState } from "react";

export function ScoreBadge({ score, className = "" }: { score: number; className?: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 50);
    return () => clearTimeout(timer);
  }, [score]);

  let color = "var(--accent-red)";
  if (score >= 40) color = "var(--accent-yellow)";
  if (score >= 70) color = "var(--accent-green)";

  return (
    <div className={`relative flex flex-col justify-center border rounded-sm overflow-hidden bg-black/40 ${className}`} style={{ borderColor: color }}>
      <div className="px-2 py-0.5 font-mono text-xs font-bold tracking-tight z-10 text-center" style={{ color }}>
        [{score}]
      </div>
      <div 
        className="absolute bottom-0 left-0 h-[3px] opacity-40 transition-all duration-[1500ms] ease-out" 
        style={{ width: `${width}%`, backgroundColor: color }}
      ></div>
    </div>
  );
}
