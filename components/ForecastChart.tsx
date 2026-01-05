"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ForecastData } from "@/lib/weather";
import { cn } from "@/lib/utils";

interface ForecastChartProps {
  data: ForecastData[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  const chartData = data.map((item) => ({
    time: item.time,
    temperatura: item.temperature,
    sensacao: item.feelsLike,
  }));

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      dataKey: string;
      payload: {
        time: string;
        temperatura: number;
        sensacao: number;
      };
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-foreground mb-2">{data.time}</p>
        <p className="text-sm text-muted-foreground">
          Temp: <span className="font-semibold text-foreground">{data.temperatura}°</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Sensação: <span className="font-semibold text-foreground">{data.sensacao}°</span>
        </p>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-foreground mb-6">
        Previsão para as próximas 24h
      </h3>
      <div className="w-full h-64 md:h-80 text-foreground">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey="time"
              className="text-xs text-foreground"
              tick={{ fill: "hsl(var(--foreground))" }}
              stroke="hsl(var(--foreground))"
            />
            <YAxis
              className="text-xs text-foreground"
              tick={{ fill: "hsl(var(--foreground))" }}
              stroke="hsl(var(--foreground))"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="temperatura"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
              name="Temperatura"
            />
            <Line
              type="monotone"
              dataKey="sensacao"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--muted-foreground))", r: 4 }}
              activeDot={{ r: 6 }}
              name="Sensação"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

