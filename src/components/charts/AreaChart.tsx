import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface AreaChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  gradientId?: string;
}

export function AreaChart({
  data,
  xKey,
  yKey,
  height = 300,
  color = "hsl(var(--chart-series-1))",
  gradientId = "areaGradient",
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
