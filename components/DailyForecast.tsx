"use client";

import { DailyForecast as DailyForecastType } from "@/lib/weather";
import { cn } from "@/lib/utils";

interface DailyForecastProps {
  forecasts: DailyForecastType[];
}

export function DailyForecast({ forecasts }: DailyForecastProps) {
  const getWeatherIcon = (icon: string) => {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Amanhã";
    }

    return date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-foreground mb-6">
        Previsão para os próximos 7 dias
      </h3>
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-4 min-w-max pb-4">
          {forecasts.map((forecast, index) => (
            <div
              key={`${forecast.date}-${index}`}
              className={cn(
                "flex-shrink-0 w-32 md:w-40",
                "glass rounded-xl p-4",
                "text-center"
              )}
            >
              <div className="text-sm font-medium text-muted-foreground mb-2">
                {formatDate(forecast.date)}
              </div>
              <div className="flex justify-center mb-3">
                <img
                  src={getWeatherIcon(forecast.icon)}
                  alt={forecast.description}
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="text-xs text-muted-foreground capitalize mb-2">
                {forecast.description}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xl font-bold text-foreground">
                  {forecast.maxTemp}°
                </span>
                <span className="text-lg text-muted-foreground">
                  {forecast.minTemp}°
                </span>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-3">
                <div>
                  <span className="block">💧 {forecast.humidity}%</span>
                </div>
                <div>
                  <span className="block">💨 {forecast.windSpeed} km/h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

