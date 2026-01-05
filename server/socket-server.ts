import { Server } from "socket.io";
import { createServer } from "http";
import { fetchWeatherData, WeatherResponse } from "../lib/weather";

const hostname = process.env.WS_HOST || "localhost";
const port = parseInt(process.env.WS_PORT || "3001", 10);

// Cache para dados climáticos
interface CacheEntry {
  data: WeatherResponse;
  timestamp: number;
}

const weatherCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

// Cidades sendo monitoradas
const monitoredCities = new Map<string, Set<string>>(); // city -> Set<socketId>

// Criar servidor HTTP
const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket Server Running");
});

// Criar servidor Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? process.env.NEXT_PUBLIC_APP_URL || "*"
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

  // Função para buscar dados climáticos
  async function fetchAndCacheWeather(city: string): Promise<WeatherResponse | null> {
    const apiKey = process.env.TOMORROW_IO_API_KEY;
    if (!apiKey) {
      console.error("TOMORROW_IO_API_KEY não configurada no servidor WebSocket");
      throw new Error("Chave de API não configurada no servidor WebSocket");
    }

    // Verificar cache
    const cached = weatherCache.get(city.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Dados de ${city} retornados do cache`);
      return cached.data;
    }

    try {
      console.log(`Buscando dados climáticos para: ${city}`);
      const data = await fetchWeatherData(city, apiKey);
      weatherCache.set(city.toLowerCase(), {
        data,
        timestamp: Date.now(),
      });
      console.log(`Dados climáticos obtidos com sucesso para: ${city}`);
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`Erro ao buscar dados para ${city}:`, errorMsg);
      throw error; // Re-throw para que o chamador possa tratar
    }
  }

  // Função para atualizar e enviar dados para clientes
  async function updateAndBroadcast(city: string) {
    const data = await fetchAndCacheWeather(city);
    if (data) {
      const socketIds = monitoredCities.get(city.toLowerCase());
      if (socketIds && socketIds.size > 0) {
        socketIds.forEach((socketId) => {
          io.to(socketId).emit("weather:update", {
            city: city.toLowerCase(),
            data,
          });
        });
      }
    }
  }

  // Intervalo para atualizar dados (a cada 5 minutos)
  setInterval(() => {
    monitoredCities.forEach((_, city) => {
      updateAndBroadcast(city);
    });
  }, 5 * 60 * 1000);

  io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Cliente solicita atualizações de uma cidade
    socket.on("weather:subscribe", async (data: { city: string }) => {
      if (!data.city) {
        socket.emit("weather:error", { message: "Cidade não fornecida" });
        return;
      }

      const city = data.city.toLowerCase();
      
      // Adicionar socket à lista de monitoramento
      if (!monitoredCities.has(city)) {
        monitoredCities.set(city, new Set());
      }
      monitoredCities.get(city)!.add(socket.id);

      // Enviar dados imediatamente (do cache ou buscar)
      try {
        const weatherData = await fetchAndCacheWeather(data.city);
        if (weatherData) {
          socket.emit("weather:update", {
            city,
            data: weatherData,
          });
        } else {
          const errorMsg = "Não foi possível obter dados climáticos. Verifique se a chave de API está configurada.";
          console.error(`Erro ao buscar dados para ${data.city}:`, errorMsg);
          socket.emit("weather:error", {
            message: errorMsg,
            code: "WEATHER_FETCH_ERROR",
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao buscar dados climáticos";
        console.error(`Erro ao buscar dados para ${data.city}:`, error);
        socket.emit("weather:error", {
          message: errorMsg,
          code: "WEATHER_FETCH_ERROR",
        });
      }

      console.log(`Cliente ${socket.id} inscrito para ${city}`);
    });

    // Cliente cancela inscrição de uma cidade
    socket.on("weather:unsubscribe", (data: { city: string }) => {
      if (!data.city) return;

      const city = data.city.toLowerCase();
      const socketIds = monitoredCities.get(city);
      if (socketIds) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          monitoredCities.delete(city);
        }
      }

      console.log(`Cliente ${socket.id} cancelou inscrição de ${city}`);
    });

    // Cliente solicita atualização manual
    socket.on("weather:refresh", async (data: { city: string }) => {
      if (!data.city) {
        socket.emit("weather:error", { message: "Cidade não fornecida" });
        return;
      }

      // Forçar atualização (ignorar cache)
      const city = data.city.toLowerCase();
      weatherCache.delete(city);
      await updateAndBroadcast(data.city);
    });

    // Cliente desconecta
    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
      
      // Remover de todas as cidades monitoradas
      monitoredCities.forEach((socketIds, city) => {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          monitoredCities.delete(city);
        }
      });
    });
  });

httpServer.listen(port, () => {
  console.log(`> WebSocket Server rodando em http://${hostname}:${port}`);
  console.log(`> WebSocket disponível em ws://${hostname}:${port}/socket.io`);
});

