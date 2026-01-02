import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface BarChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
}

export function BarChart({
  data,
  xKey,
  yKey,
  height = 300,
  color = "hsl(var(--chart-series-1))",
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
        <XAxis
          dataKey={xKey}
          stroke="hsl(var(--chart-axis))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--chart-axis))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value;
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--chart-tooltip-bg))",
            border: "1px solid hsl(var(--chart-tooltip-border))",
            borderRadius: "6px",
            color: "hsl(var(--chart-tooltip-text))",
          }}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

