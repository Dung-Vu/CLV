"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DailyIngestionChart({ data }: { data: { name: string, count: number }[] }) {
  return (
    <div className="w-full h-48 mt-4 font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip 
            cursor={{ stroke: 'var(--border-active)', strokeWidth: 1, strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: 'black', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--accent-blue)' }}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="var(--accent-blue)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCount)" 
            activeDot={{ r: 4, fill: "var(--accent-blue)", stroke: "black", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
