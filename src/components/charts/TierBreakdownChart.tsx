'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export function TierBreakdownChart({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  return (
    <div className="w-full mt-4 font-mono text-xs relative" style={{ height: 192 }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col" style={{ zIndex: 1 }}>
        <span className="text-xl font-light text-[var(--text-primary)] leading-none">
          {data.reduce((acc, curr) => acc + curr.value, 0)}
        </span>
        <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mt-1">
          TOTAL
        </span>
      </div>

      <ResponsiveContainer width="100%" height={192}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                className="hover:opacity-80 transition-opacity outline-none"
                style={{ filter: `drop-shadow(0 0 5px ${entry.fill}40)` }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'black',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
            }}
            itemStyle={{ color: 'white' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
