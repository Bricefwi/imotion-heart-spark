/**
 * Chart wrapper utilisé par les pages marketing (Méthodologie ROI, blog data).
 * Rapatrié depuis lovelib — utilise les couleurs sémantiques Clarivi (gradient flame).
 */
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface ChartBlockProps {
  title?: string;
  type: "line" | "bar" | "area";
  data: any[];
  xKey: string;
  yKeys: string[];
}

// Palette Clarivi flame (Coral → Amber)
const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#F08A00", "#D63B1A", "#FFA61F"];

export const ChartBlock = ({ title, type, data, xKey, yKeys }: ChartBlockProps) => {
  const renderChart = () => {
    const common = { data, margin: { top: 5, right: 30, left: 20, bottom: 5 } };
    switch (type) {
      case "line":
        return (
          <LineChart {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Legend />
            {yKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} activeDot={{ r: 8 }} />
            ))}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Legend />
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Legend />
            {yKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.5} />
            ))}
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="my-8 p-4 border border-border rounded-xl bg-card">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
