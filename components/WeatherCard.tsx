"use client";

import { Droplets, Wind, Gauge, Eye, Sun } from "lucide-react";
import { WeatherData } from "@/lib/weather";
import { cn } from "@/lib/utils";

interface WeatherCardProps {
  data: WeatherData;
}

export function WeatherCard({ data }: WeatherCardProps) {
  const getWeatherIcon = (icon: string) => {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {data.city}
          </h2>
          <p className="text-muted-foreground capitalize">{data.description}</p>
        </div>
        <div className="flex items-center justify-center w-20 h-20">
          <img
            src={getWeatherIcon(data.icon)}
            alt={data.description}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Temperatura Principal */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2">
          <span className="text-6xl md:text-7xl font-bold text-foreground">
            {data.temperature}°
          </span>
          <span className="text-xl text-muted-foreground">
            Sensação {data.feelsLike}°
          </span>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Humidade */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Umidade</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.humidity}%</p>
        </div>

        {/* Vento */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="h-5 w-5 text-cyan-500" />
            <span className="text-sm text-muted-foreground">Vento</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.windSpeed} km/h
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getWindDirection(data.windDirection)}
          </p>
        </div>

        {/* UV Index */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">UV Index</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.uvIndex}
          </p>
        </div>

        {/* Pressão */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Pressão</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.pressure} hPa
          </p>
        </div>

        {/* Visibilidade */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Visibilidade</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.visibility} km
          </p>
        </div>
      </div>
    </div>
  );
}

