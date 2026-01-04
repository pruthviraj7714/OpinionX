"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type YesNoBucket = {
  timestamp: string;
  yes: number;
  no: number;
};

interface Props {
  data: YesNoBucket[];
}

export default function ProbabilityChart({ data }: Props) {
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) =>
              new Date(value).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }
          />

          <YAxis allowDecimals={false} />

          <Tooltip
            labelFormatter={(label) =>
              new Date(label).toLocaleString()
            }
          />
          <Line
            type="monotone"
            dataKey="yes"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            name="YES"
          />

          <Line
            type="monotone"
            dataKey="no"
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
            name="NO"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
