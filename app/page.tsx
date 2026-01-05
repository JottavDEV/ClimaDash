"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar, SidebarToggle } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { WeatherCard } from "@/components/WeatherCard";
import { ForecastChart } from "@/components/ForecastChart";
import { DailyForecast } from "@/components/DailyForecast";
import { WeatherResponse, WeatherAPIError } from "@/lib/weather";
import { Loader2, AlertCircle, Wifi, WifiOff, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ApiKeyModal } from "@/components/ApiKeyModal";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState("São Paulo");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  // Inicializar wsEnabled como true (será ajustado após montar)
  const [wsEnabled, setWsEnabled] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  // Geolocalização hook
  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
    permission: geoPermission,
    isAvailable: geoAvailable,
    requestLocation,
    clearPermission,
  } = useGeolocation({
    enabled: false, // Não solicitar automaticamente
    onSuccess: async (coords) => {
      setLocationLoading(true);
      try {
        // Primeiro, tentar buscar o nome da cidade via reverse geocoding
        // Enviar chave de API via header se disponível
        const headers: HeadersInit = {};
        const clientApiKey = localStorage.getItem("tomorrow_io_api_key");
        if (clientApiKey) {
          headers["X-API-Key"] = clientApiKey;
        }
        
        const geocodeResponse = await fetch(
          `/api/weather/geocode?lat=${coords.latitude}&lon=${coords.longitude}`,
          { headers }
        );
        
        let cityName: string | null = null;
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.city && geocodeData.city !== "Localização Atual") {
            cityName = geocodeData.city;
          }
        }
        
        // Usar coordenadas para buscar clima (a API pode retornar o nome na resposta)
        const locationStr = `${coords.latitude},${coords.longitude}`;
        setCurrentLocation({ lat: coords.latitude, lon: coords.longitude });
        
        // Se conseguiu nome da cidade via geocoding, usar o nome
        // Caso contrário, usar coordenadas (a API de clima pode retornar o nome)
        if (cityName) {
          setCurrentCity(cityName);
          // Tentar buscar com nome primeiro, mas se falhar, usar coordenadas
          try {
            await fetchWeather(cityName);
          } catch {
            // Se falhar com nome, usar coordenadas
            setCurrentCity("Localização Atual");
            await fetchWeather(locationStr);
          }
        } else {
          // Se não conseguiu nome via geocoding, usar coordenadas
          // A API de clima pode retornar o nome na resposta, que será atualizado em fetchWeather
          setCurrentCity("Localização Atual");
          await fetchWeather(locationStr);
        }
      } catch (err) {
        console.error("Erro ao buscar localização:", err);
        // Fallback: usar coordenadas diretamente
        const locationStr = `${coords.latitude},${coords.longitude}`;
        setCurrentCity("Localização Atual");
        setCurrentLocation({ lat: coords.latitude, lon: coords.longitude });
        await fetchWeather(locationStr);
      } finally {
        setLocationLoading(false);
      }
    },
    onError: (error) => {
      console.error("Erro de geolocalização:", error);
      setLocationLoading(false);
    },
  });

  // WebSocket hook
  const {
    connected: wsConnected,
    connecting: wsConnecting,
    error: wsError,
    refresh: wsRefresh,
    resetAndConnect: wsResetAndConnect,
  } = useWebSocket({
    enabled: wsEnabled,
    city: currentLocation ? `${currentLocation.lat},${currentLocation.lon}` : currentCity,
    onUpdate: useCallback((data: WeatherResponse) => {
      console.log("Atualização recebida via WebSocket");
      setWeatherData(data);
      setError(null);
      setLoading(false); // Garantir que loading seja false quando receber dados
    }, []),
    onError: useCallback((errorMessage: string) => {
      // Se servidor não disponível, desabilitar WebSocket silenciosamente
      if (errorMessage.includes("não disponível")) {
        console.warn("WebSocket desabilitado: servidor não disponível. Usando API REST.");
        setWsEnabled(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("ws_disabled", "true");
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("ws_disabled", "true");
        }
      } else {
        // Outros erros apenas logar (não poluir console)
        console.debug("Erro WebSocket:", errorMessage);
      }
      // Sistema sempre usa API REST como fallback, então não mostrar erro ao usuário
    }, []),
  });

  useEffect(() => {
    // Marcar como montado no cliente
    setMounted(true);
    
    // Verificar preferência de tema salva
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Verificar se WebSocket foi desabilitado anteriormente
    const wsDisabled = localStorage.getItem("ws_disabled") === "true";
    if (wsDisabled) {
      setWsEnabled(false);
    }
  }, []);

  useEffect(() => {
    // Aplicar tema
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    // Só verificar após montar no cliente
    if (!mounted) return;
    
    // Verificar se deve mostrar prompt de localização
    const savedPermission = localStorage.getItem("geolocation_permission");
    if (!savedPermission && geoAvailable) {
      // Mostrar prompt após um pequeno delay
      const timer = setTimeout(() => {
        setShowLocationPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [mounted, geoAvailable]);

  useEffect(() => {
    // Carregar dados iniciais apenas se não tiver localização
    const savedPermission = localStorage.getItem("geolocation_permission");
    if (savedPermission !== "granted") {
      fetchWeather(currentCity);
    }
  }, []);

  const fetchWeather = async (cityOrLocation: string) => {
    setLoading(true);
    setError(null);

    try {
      // Se for coordenadas (contém vírgula e números), usar diretamente
      // Se for nome de cidade, usar normalmente
      const isCoordinates = /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(cityOrLocation.trim());
      const locationParam = isCoordinates
        ? cityOrLocation.trim()
        : encodeURIComponent(cityOrLocation);
      
      console.debug("Buscando clima para:", isCoordinates ? "coordenadas" : "cidade", locationParam);
      
      // Enviar chave de API via header se disponível
      const headers: HeadersInit = {};
      const clientApiKey = localStorage.getItem("tomorrow_io_api_key");
      if (clientApiKey) {
        headers["X-API-Key"] = clientApiKey;
      }
      
      const response = await fetch(`/api/weather?city=${locationParam}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new WeatherAPIError(
          errorData.error || "Erro ao buscar dados climáticos",
          response.status,
          errorData.code
        );
      }

      const data: WeatherResponse = await response.json();
      
      console.log("[fetchWeather] Dados recebidos:", { 
        cityFromData: data.current?.city, 
        cityOrLocation,
        hasLocation: !!currentLocation 
      });
      
      // Reutilizar isCoordinates já definido acima
      // Verificar se passamos coordenadas ou nome de cidade
      let cityNameToUse: string;
      
      if (isCoordinates) {
        // Passamos coordenadas: usar o nome que vem da API (extraído de location.name)
        if (data.current?.city && data.current.city !== "Localização Atual") {
          const isCityNameCoordinates = /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(data.current.city);
          
          if (!isCityNameCoordinates) {
            // Nome válido encontrado na resposta da API
            cityNameToUse = data.current.city;
            console.log(`[fetchWeather] Coordenadas passadas, usando nome da API: "${cityNameToUse}"`);
            setCurrentCity(cityNameToUse);
            // Limpar coordenadas (agora temos nome)
            if (currentLocation) {
              setCurrentLocation(null);
            }
          } else {
            // API retornou coordenadas como nome, manter "Localização Atual"
            cityNameToUse = "Localização Atual";
            console.log(`[fetchWeather] Coordenadas passadas, API não retornou nome válido`);
          }
        } else {
          // API não retornou nome, manter "Localização Atual" e coordenadas
          cityNameToUse = "Localização Atual";
          console.log(`[fetchWeather] Coordenadas passadas, API não retornou nome`);
        }
      } else {
        // Passamos nome de cidade: SEMPRE usar o nome que o usuário digitou/buscou
        cityNameToUse = cityOrLocation;
        console.log(`[fetchWeather] Nome de cidade passado, usando: "${cityNameToUse}"`);
        setCurrentCity(cityNameToUse);
        setCurrentLocation(null);
      }
      
      // Atualizar o nome da cidade nos dados climáticos para exibir corretamente
      setWeatherData({
        ...data,
        current: {
          ...data.current,
          city: cityNameToUse,
        },
      });
    } catch (err) {
      console.error("Erro ao buscar clima:", err);
      if (err instanceof WeatherAPIError) {
        if (err.code === "CITY_NOT_FOUND") {
          setError("Cidade não encontrada. Tente buscar por outro nome.");
        } else if (err.code === "RATE_LIMIT") {
          setError("Limite de requisições excedido. Tente novamente mais tarde.");
        } else if (err.code === "NETWORK_ERROR") {
          setError("Erro de conexão. Verifique sua internet.");
        } else {
          setError(err.message);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setError(`Erro ao buscar dados climáticos: ${errorMessage}`);
      }
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (city: string) => {
    setCurrentLocation(null); // Limpar coordenadas quando buscar cidade manualmente
    fetchWeather(city);
    // WebSocket vai atualizar automaticamente quando a cidade mudar
  };

  // Função helper para obter localização correta (coordenadas ou nome da cidade)
  const getLocationString = useCallback(() => {
    if (currentLocation) {
      return `${currentLocation.lat},${currentLocation.lon}`;
    }
    return currentCity;
  }, [currentCity, currentLocation]);

  const handleRefresh = () => {
    const locationToUse = getLocationString();
    if (wsConnected) {
      wsRefresh(locationToUse);
    } else {
      fetchWeather(locationToUse);
    }
  };

  const handleRequestLocation = () => {
    setLocationLoading(true);
    setShowLocationPrompt(false);
    requestLocation();
  };

  const handleDismissLocationPrompt = () => {
    setShowLocationPrompt(false);
    localStorage.setItem("geolocation_permission", "dismissed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <SidebarToggle onClick={() => setSidebarOpen(true)} />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
      />

      <main
        className={cn(
          "lg:ml-64 min-h-screen transition-all duration-300",
          "p-4 md:p-6 lg:p-8"
        )}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header com busca */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Dashboard Climático
                </h1>
                {mounted && wsEnabled && (
                  <div className="flex items-center gap-2">
                    {wsConnected ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Wifi className="h-5 w-5" />
                        <span className="text-xs font-medium">Tempo Real</span>
                      </div>
                    ) : wsConnecting ? (
                      <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-medium">Conectando...</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setWsEnabled(true);
                          if (typeof window !== "undefined") {
                            localStorage.removeItem("ws_disabled");
                          }
                          wsResetAndConnect();
                        }}
                        className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                        title="Clique para tentar reconectar"
                      >
                        <WifiOff className="h-5 w-5" />
                        <span className="text-xs font-medium">Desconectado</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">
                Visualize dados climáticos em tempo real
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SearchBar onSearch={handleSearch} isLoading={loading} />
              {mounted && geoAvailable && (
                <button
                  onClick={handleRequestLocation}
                  disabled={locationLoading || geoLoading || geoPermission === "denied"}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    geoPermission === "granted"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                      : "bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                  title={
                    geoPermission === "granted"
                      ? "Usando localização atual"
                      : geoPermission === "denied"
                      ? "Permissão de localização negada"
                      : "Usar minha localização"
                  }
                >
                  {locationLoading || geoLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <MapPin className="h-5 w-5" />
                  )}
                </button>
              )}
              {weatherData && (
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Atualizar dados"
                >
                  <Loader2
                    className={cn(
                      "h-5 w-5",
                      loading && "animate-spin"
                    )}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Location Prompt */}
          {mounted && showLocationPrompt && (
            <div className="glass-card rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-5">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">
                  Usar sua localização atual?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Podemos usar sua localização para mostrar o clima da sua região automaticamente.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestLocation}
                    disabled={locationLoading || geoLoading}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {locationLoading || geoLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 inline-block animate-spin mr-2" />
                        Obtendo localização...
                      </>
                    ) : (
                      "Permitir"
                    )}
                  </button>
                  <button
                    onClick={handleDismissLocationPrompt}
                    disabled={locationLoading || geoLoading}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Agora não
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissLocationPrompt}
                className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Fechar"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Weather Data */}
          {weatherData && !loading && (
            <div className="space-y-6">
              {/* Card Principal */}
              <WeatherCard data={weatherData.current} />

              {/* Gráfico de 24h */}
              <ForecastChart data={weatherData.hourly} />

              {/* Previsão de 7 dias */}
              <DailyForecast forecasts={weatherData.daily} />
            </div>
          )}

          {/* Empty State */}
          {!weatherData && !loading && !error && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="text-muted-foreground text-lg">
                Busque por uma cidade para ver os dados climáticos
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Chave de API */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={(key) => {
          setApiKey(key);
          // Recarregar dados se já tiver uma cidade selecionada
          if (weatherData) {
            fetchWeather(getLocationString());
          }
        }}
      />
    </div>
  );
}

