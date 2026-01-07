"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Props = {
  yesTraders: number;
  noTraders: number;
};

const COLORS = {
  YES: "#16a34a",
  NO: "#dc2626",
};

export default function YesNoDonutChart({ yesTraders, noTraders }: Props) {
  const data = [
    { name: "YES", value: yesTraders },
    { name: "NO", value: noTraders },
  ];

  const total = yesTraders + noTraders;

  return (
    <div className="relative w-full h-[260px] flex items-center justify-center">
      <ResponsiveContainer width={260} height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={80}
            outerRadius={110}
            paddingAngle={4}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as "YES" | "NO"]}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #334155",
              borderRadius: 6,
            }}
            itemStyle={{
              color: "#ffffff",
            }}
            labelStyle={{
              color: "#e5e7eb",
            }}
            formatter={(value: number, name: string) => [
              `${value} ${value > 1 ? 'traders' : 'trader'}`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
        <p className="text-2xl font-semibold text-black">{total}</p>
      </div>
    </div>
  );
}
