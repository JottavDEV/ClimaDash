import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherData, WeatherAPIError } from "@/lib/weather";

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

// Cache simples em memória
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos em milissegundos

function getCacheKey(city: string): string {
  return city.toLowerCase().trim();
}

function getCachedData(city: string): unknown | null {
  const key = getCacheKey(city);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCachedData(city: string, data: unknown): void {
  const key = getCacheKey(city);
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city");

    if (!city || city.trim().length === 0) {
      return NextResponse.json(
        { error: "Parâmetro 'city' é obrigatório" },
        { status: 400 }
      );
    }

    // Se for coordenadas (formato lat,lon), usar diretamente
    // Se for "Localização Atual", retornar erro (deve usar coordenadas)
    if (city === "Localização Atual") {
      return NextResponse.json(
        { error: "Coordenadas não fornecidas. Use o formato 'lat,lon'." },
        { status: 400 }
      );
    }

    // Verificar cache (usar coordenadas normalizadas para cache)
    const cacheKey = city.toLowerCase().trim();
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Buscar API key: priorizar header do cliente, depois variável de ambiente
    const clientApiKey = request.headers.get("X-API-Key");
    const serverApiKey = process.env.TOMORROW_IO_API_KEY;
    const apiKey = clientApiKey || serverApiKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Chave de API não configurada. Configure uma chave no menu lateral.",
          code: "API_KEY_MISSING",
        },
        { status: 500 }
      );
    }

    // Buscar dados (aceita nome de cidade ou coordenadas "lat,lon")
    const weatherData = await fetchWeatherData(city, apiKey);

    // Salvar no cache
    setCachedData(cacheKey, weatherData);

    return NextResponse.json(weatherData);
  } catch (error) {
    if (error instanceof WeatherAPIError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Erro interno do servidor",
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro desconhecido" },
      { status: 500 }
    );
  }
}

