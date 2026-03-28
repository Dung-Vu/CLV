'use client';

import { useEffect, useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartSkeleton } from './ChartSkeleton';

export function ScoreDistributionChart({ data }: { data: { range: string; count: number }[] }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      // Recharts needs > 0 dimensions to prevent the width(-1)/height(-1) warning
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const getFillColor = (range: string) => {
    switch (range) {
      case '0-30':
        return 'var(--accent-red)';
      case '31-50':
        return 'var(--accent-yellow)';
      case '51-70':
        return 'var(--accent-blue)';
      case '71-90':
        return 'var(--accent-green)';
      case '91-100':
        return '#00e67a'; // brighter green
      default:
        return 'var(--accent-green)';
    }
  };

  return (
    <div className="w-full mt-4 font-mono text-xs">
      <ResponsiveContainer width="100%" height={192}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--text-dim)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="range"
            type="category"
            stroke="var(--text-dim)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              backgroundColor: 'black',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
            }}
            itemStyle={{ color: 'var(--accent-green)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getFillColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
