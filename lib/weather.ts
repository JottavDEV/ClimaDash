export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  description: string;
  icon: string;
  pressure: number;
  visibility: number;
  timestamp: number;
}

export interface ForecastData {
  date: string;
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

export interface DailyForecast {
  date: string;
  day: string;
  maxTemp: number;
  minTemp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface WeatherResponse {
  current: WeatherData;
  hourly: ForecastData[];
  daily: DailyForecast[];
}

export interface GeocodingResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export class WeatherAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "WeatherAPIError";
  }
}

// Mapear weatherCode do Tomorrow.io para descrição e ícone
function getWeatherInfo(weatherCode: number): { description: string; icon: string } {
  // Códigos do Tomorrow.io: https://docs.tomorrow.io/reference/data-layers-weather-codes
  const weatherMap: Record<number, { description: string; icon: string }> = {
    1000: { description: "Céu limpo", icon: "01d" },
    1100: { description: "Principalmente limpo", icon: "02d" },
    1101: { description: "Parcialmente nublado", icon: "03d" },
    1102: { description: "Principalmente nublado", icon: "04d" },
    1001: { description: "Nublado", icon: "04d" },
    2000: { description: "Neblina", icon: "50d" },
    2100: { description: "Neblina leve", icon: "50d" },
    4000: { description: "Chuva", icon: "09d" },
    4001: { description: "Chuva", icon: "10d" },
    4200: { description: "Chuva leve", icon: "09d" },
    4201: { description: "Chuva forte", icon: "11d" },
    5000: { description: "Neve", icon: "13d" },
    5001: { description: "Flocos de neve", icon: "13d" },
    5100: { description: "Neve leve", icon: "13d" },
    5101: { description: "Neve forte", icon: "13d" },
    6000: { description: "Chuva congelante", icon: "09d" },
    6001: { description: "Chuva congelante leve", icon: "09d" },
    6200: { description: "Chuva congelante forte", icon: "09d" },
    7000: { description: "Granizo", icon: "11d" },
    7101: { description: "Granizo leve", icon: "11d" },
    7102: { description: "Granizo forte", icon: "11d" },
    8000: { description: "Tempestade", icon: "11d" },
  };

  return weatherMap[weatherCode] || { description: "Condições desconhecidas", icon: "01d" };
}

// Função auxiliar para extrair o nome da cidade do formato completo
// Exemplo: "Old Toronto, Toronto, Golden Horseshoe, Ontario, Canada" -> "Toronto"
function extractCityName(fullName: string): string {
  if (!fullName || !fullName.trim()) {
    return "";
  }
  
  const trimmed = fullName.trim();
  
  // Se não tiver vírgulas, retornar como está
  if (!trimmed.includes(",")) {
    return trimmed;
  }
  
  // Dividir por vírgulas e limpar espaços
  const parts = trimmed.split(",").map((p: string) => p.trim()).filter((p: string) => p.length > 0);
  
  // O formato geralmente é: [Bairro/Área], [Cidade], [Região], [Estado], [País]
  // A cidade geralmente está na segunda posição (índice 1)
  if (parts.length >= 2) {
    // Retornar a segunda parte (geralmente é a cidade)
    return parts[1];
  } else if (parts.length === 1) {
    // Se só tiver uma parte, usar ela
    return parts[0];
  }
  
  return trimmed;
}

export async function fetchWeatherData(
  city: string,
  apiKey: string
): Promise<WeatherResponse> {
  try {
    // Buscar dados em tempo real e previsão
    // Se for coordenadas (formato "lat,lon"), usar diretamente sem encode
    // Se for nome de cidade, fazer encode
    const isCoordinates = /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(city.trim());
    const location = isCoordinates ? city.trim() : encodeURIComponent(city);
    const baseUrl = "https://api.tomorrow.io/v4/weather";
    
    // Buscar dados em tempo real
    const realtimeUrl = `${baseUrl}/realtime?location=${location}&units=metric&apikey=${apiKey}`;
    
    const realtimeResponse = await fetch(realtimeUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!realtimeResponse.ok) {
      const errorText = await realtimeResponse.text().catch(() => "");
      let errorData: { message?: string; code?: string } = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // Se não for JSON, usar texto como mensagem
      }
      
      console.error(`Erro na API Tomorrow.io (${realtimeResponse.status}):`, errorData.message || errorText);
      
      if (realtimeResponse.status === 401 || realtimeResponse.status === 403) {
        throw new WeatherAPIError(
          "Chave de API inválida",
          401,
          "INVALID_API_KEY"
        );
      }
      if (realtimeResponse.status === 429) {
        throw new WeatherAPIError(
          "Limite de requisições excedido",
          429,
          "RATE_LIMIT"
        );
      }
      if (realtimeResponse.status === 400) {
        const errorMsg = errorData.message || errorText || "Localização inválida";
        if (errorMsg.toLowerCase().includes("location") || errorMsg.toLowerCase().includes("invalid")) {
          throw new WeatherAPIError(
            `Localização não encontrada: ${errorMsg}`,
            404,
            "CITY_NOT_FOUND"
          );
        }
        throw new WeatherAPIError(
          `Erro na requisição: ${errorMsg}`,
          400,
          "INVALID_REQUEST"
        );
      }
      throw new WeatherAPIError(
        errorData.message || `Erro ao buscar dados climáticos (${realtimeResponse.status})`,
        realtimeResponse.status
      );
    }

    const realtimeData = await realtimeResponse.json();

    // Buscar previsão (hourly e daily)
    const forecastUrl = `${baseUrl}/forecast?location=${location}&units=metric&timesteps=1h,1d&apikey=${apiKey}`;
    
    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!forecastResponse.ok) {
      // Se a previsão falhar, usar apenas dados em tempo real
      console.warn("Erro ao buscar previsão, usando apenas dados em tempo real");
    }

    const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;

    // Processar dados atuais
    // A API do Tomorrow.io retorna: { data: { timelines: [{ values: {...} }] } }
    const currentValues = 
      realtimeData.data?.timelines?.[0]?.values || 
      realtimeData.data?.values ||
      realtimeData.timelines?.[0]?.values ||
      realtimeData.values;
      
    if (!currentValues) {
      throw new WeatherAPIError(
        "Dados climáticos não disponíveis",
        500,
        "DATA_UNAVAILABLE"
      );
    }

    // Extrair informações de localização da resposta
    // A API Tomorrow.io retorna: { location: { name: "...", lat: ..., lon: ..., ... } }
    const locationData = realtimeData.location || realtimeData.data?.location || {};
    
    console.log(`[fetchWeatherData] Location data da resposta:`, locationData);
    console.log(`[fetchWeatherData] Parâmetro recebido (cityOrLocation): "${city}"`);
    
    // Extrair nome da cidade da resposta da API
    const country = locationData.country || "";
    
    let cityName: string;
    
    // SEMPRE tentar extrair o nome da cidade da resposta da API primeiro
    // Isso é especialmente importante quando passamos coordenadas
    if (locationData.name && locationData.name.trim()) {
      // A API retornou um nome, extrair a cidade do formato completo
      cityName = extractCityName(locationData.name);
      console.log(`[fetchWeatherData] Nome extraído da API: "${locationData.name}" -> "${cityName}"`);
    } else {
      // Se a API não retornou nome, verificar se o parâmetro é coordenadas
      const isCoordinates = /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(city);
      
      if (isCoordinates) {
        // Passamos coordenadas mas a API não retornou nome
        // Manter coordenadas como fallback (será atualizado depois via geocoding)
        cityName = city;
        console.log(`[fetchWeatherData] Coordenadas passadas mas API não retornou nome, mantendo: "${city}"`);
      } else {
        // Passamos um nome de cidade, usar ele
        cityName = city;
        console.log(`[fetchWeatherData] Usando parâmetro original (nome de cidade): "${city}"`);
      }
    }

    const weatherInfo = getWeatherInfo(currentValues.weatherCode || 1000);

    const currentWeather: WeatherData = {
      city: cityName,
      country,
      temperature: Math.round(currentValues.temperature || 0),
      feelsLike: Math.round(currentValues.temperatureApparent || currentValues.temperature || 0),
      humidity: Math.round(currentValues.humidity || 0),
      windSpeed: Math.round((currentValues.windSpeed || 0) * 3.6), // m/s para km/h
      windDirection: Math.round(currentValues.windDirection || 0),
      uvIndex: Math.round(currentValues.uvIndex || 0),
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      pressure: Math.round(currentValues.pressureSurfaceLevel || currentValues.pressureSeaLevel || 0),
      visibility: Math.round((currentValues.visibility || 0) * 10) / 10, // já vem em km
      timestamp: Date.now(),
    };

    // Processar previsão horária (próximas 24h)
    let hourly: ForecastData[] = [];
    const hourlyTimeline = forecastData?.timelines?.hourly || forecastData?.data?.timelines?.hourly;
    if (hourlyTimeline) {
      hourly = hourlyTimeline
        .slice(0, 24)
        .map((item: { time: string; values: typeof currentValues }) => {
          const date = new Date(item.time);
          const weatherInfo = getWeatherInfo(item.values.weatherCode || 1000);
          return {
            date: date.toISOString().split("T")[0],
            time: date.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            temperature: Math.round(item.values.temperature || 0),
            feelsLike: Math.round(item.values.temperatureApparent || item.values.temperature || 0),
            humidity: Math.round(item.values.humidity || 0),
            windSpeed: Math.round((item.values.windSpeed || 0) * 3.6),
            description: weatherInfo.description,
            icon: weatherInfo.icon,
          };
        });
    }

    // Processar previsão diária (próximos 7 dias)
    let daily: DailyForecast[] = [];
    const dailyTimeline = forecastData?.timelines?.daily || forecastData?.data?.timelines?.daily;
    if (dailyTimeline) {
      daily = dailyTimeline
        .slice(0, 7)
        .map((item: { time: string; values: typeof currentValues }) => {
          const date = new Date(item.time);
          const weatherInfo = getWeatherInfo(item.values.weatherCode || 1000);
          return {
            date: date.toISOString().split("T")[0],
            day: date.toLocaleDateString("pt-BR", { weekday: "long" }),
            maxTemp: Math.round(item.values.temperatureMax || item.values.temperature || 0),
            minTemp: Math.round(item.values.temperatureMin || item.values.temperature || 0),
            description: weatherInfo.description,
            icon: weatherInfo.icon,
            humidity: Math.round(item.values.humidityAvg || item.values.humidity || 0),
            windSpeed: Math.round((item.values.windSpeedAvg || item.values.windSpeed || 0) * 3.6),
          };
        });
    }

    return {
      current: currentWeather,
      hourly,
      daily,
    };
  } catch (error) {
    if (error instanceof WeatherAPIError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        throw new WeatherAPIError(
          "Erro de conexão com a API",
          503,
          "NETWORK_ERROR"
        );
      }
      throw new WeatherAPIError(error.message, 500);
    }
    throw new WeatherAPIError("Erro desconhecido", 500);
  }
}

export async function searchCities(
  query: string,
  apiKey: string
): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Tomorrow.io não tem endpoint de geocoding direto, usar busca por localização
    // Vamos tentar buscar dados para verificar se a cidade existe
    const url = `https://api.tomorrow.io/v4/weather/realtime?location=${encodeURIComponent(query)}&units=metric&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    // Se encontrou, retornar a localização
    if (data.location) {
      return [
        {
          name: data.location.name || query,
          country: data.location.country || "",
          state: data.location.state,
          lat: data.location.lat || 0,
          lon: data.location.lon || 0,
        },
      ];
    }

    return [];
  } catch {
    return [];
  }
}

export async function getCityFromCoordinates(
  latitude: number,
  longitude: number,
  apiKey: string // Mantido para compatibilidade, mas não usado mais
): Promise<{ city: string; country: string } | null> {
  try {
    // Usar OpenStreetMap Nominatim para reverse geocoding (buscar nome da cidade por coordenadas)
    // Nominatim é gratuito e especializado em geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=pt-BR,pt,en`;
    
    console.log(`[getCityFromCoordinates] Buscando cidade para coordenadas: ${latitude}, ${longitude}`);
    
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ClimaDash/1.0 (Weather Dashboard)", // Obrigatório para Nominatim
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getCityFromCoordinates] Erro na API Nominatim: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log(`[getCityFromCoordinates] Resposta da API Nominatim:`, JSON.stringify(data, null, 2));
    
    // A estrutura da resposta do Nominatim:
    // {
    //   "address": {
    //     "city": "...",
    //     "town": "...",
    //     "village": "...",
    //     "municipality": "...",
    //     "county": "...",
    //     "state": "...",
    //     "country": "...",
    //     ...
    //   },
    //   "display_name": "..."
    // }
    
    if (data.address) {
      const address = data.address;
      
      // Prioridade: city > town > village > municipality > county
      const cityName = 
        address.city || 
        address.town || 
        address.village || 
        address.municipality || 
        address.county || 
        null;
      
      const countryName = address.country || "";
      
      if (cityName && cityName.trim()) {
        console.log(`[getCityFromCoordinates] Cidade encontrada: "${cityName}", País: "${countryName}"`);
        return {
          city: cityName.trim(),
          country: countryName,
        };
      } else {
        // Se não encontrou cidade específica, tentar usar display_name
        if (data.display_name) {
          // Extrair a primeira parte do display_name (geralmente é a cidade/localidade)
          const displayParts = data.display_name.split(",").map((p: string) => p.trim());
          if (displayParts.length > 0) {
            const extractedCity = displayParts[0];
            console.log(`[getCityFromCoordinates] Usando display_name: "${extractedCity}"`);
            return {
              city: extractedCity,
              country: countryName,
            };
          }
        }
      }
    }

    // Se não encontrou dados válidos, retornar null para usar fallback
    console.warn(`[getCityFromCoordinates] Não foi possível obter nome da cidade das coordenadas:`, { latitude, longitude });
    return null;
  } catch (error) {
    console.error("[getCityFromCoordinates] Erro ao buscar cidade das coordenadas:", error);
    return null;
  }
}
