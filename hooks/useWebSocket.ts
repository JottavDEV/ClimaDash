"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WeatherResponse } from "@/lib/weather";

interface UseWebSocketOptions {
  enabled?: boolean;
  city?: string;
  onUpdate?: (data: WeatherResponse) => void;
  onError?: (error: string) => void;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useWebSocket({
  enabled = true,
  city,
  onUpdate,
  onError,
}: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
  });

  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  }, [onUpdate, onError]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    // Se excedeu tentativas, não tentar mais
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setState((prev) => ({
        ...prev,
        connecting: false,
        error: "Servidor WebSocket não disponível",
      }));
      if (onErrorRef.current) {
        onErrorRef.current("Servidor WebSocket não disponível");
      }
      return;
    }

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

    const socket = io(wsUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 3000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("WebSocket conectado");
      reconnectAttemptsRef.current = 0; // Reset contador
      setState({
        connected: true,
        connecting: false,
        error: null,
      });

      // Se há uma cidade, inscrever automaticamente
      if (city) {
        socket.emit("weather:subscribe", { city });
      }
    });

    socket.on("disconnect", () => {
      console.log("WebSocket desconectado");
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
      }));
    });

    socket.on("connect_error", (error) => {
      reconnectAttemptsRef.current += 1;
      
      // Só logar após algumas tentativas para não poluir o console
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.warn("Servidor WebSocket não disponível. Sistema continuará usando API REST.");
        setState((prev) => ({
          ...prev,
          connecting: false,
          error: "Servidor WebSocket não disponível",
        }));
        if (onErrorRef.current) {
          onErrorRef.current("Servidor WebSocket não disponível");
        }
        // Desabilitar reconexão após exceder tentativas
        socket.io.opts.reconnection = false;
        socket.disconnect();
        // Marcar como desabilitado permanentemente nesta sessão
        socketRef.current = null;
      } else {
        // Log silencioso durante tentativas (não poluir console)
        setState((prev) => ({
          ...prev,
          connecting: reconnectAttemptsRef.current < maxReconnectAttempts,
          error: null,
        }));
      }
    });

    socket.on("weather:update", (data: { city: string; data: WeatherResponse }) => {
      console.log("Atualização recebida:", data.city);
      if (onUpdateRef.current) {
        onUpdateRef.current(data.data);
      }
    });

    socket.on("weather:error", (data: { message: string; code?: string }) => {
      console.error("Erro do servidor WebSocket:", data.message, data.code);
      setState((prev) => ({
        ...prev,
        error: data.message,
      }));
      if (onErrorRef.current) {
        onErrorRef.current(data.message);
      }
    });

    socketRef.current = socket;
  }, [city]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (city) {
        socketRef.current.emit("weather:unsubscribe", { city });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        connected: false,
        connecting: false,
        error: null,
      });
    }
  }, [city]);

  const subscribe = useCallback(
    (cityName: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("weather:subscribe", { city: cityName });
      }
    },
    []
  );

  const unsubscribe = useCallback(
    (cityName: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("weather:unsubscribe", { city: cityName });
      }
    },
    []
  );

  const refresh = useCallback(
    (cityName: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("weather:refresh", { city: cityName });
      }
    },
    []
  );

  useEffect(() => {
    // Não tentar conectar se já excedeu tentativas
    if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
      connect();
    } else if (!enabled) {
      disconnect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Atualizar inscrição quando a cidade mudar
  useEffect(() => {
    if (!socketRef.current?.connected || !city) {
      return;
    }

    // Cancelar inscrição anterior e inscrever na nova cidade
    socketRef.current.emit("weather:subscribe", { city });

    return () => {
      if (socketRef.current?.connected && city) {
        socketRef.current.emit("weather:unsubscribe", { city });
      }
    };
  }, [city]);

  const resetAndConnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (socketRef.current) {
      if (city) {
        socketRef.current.emit("weather:unsubscribe", { city });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState({
      connected: false,
      connecting: false,
      error: null,
    });
    // Reconectar após um pequeno delay
    setTimeout(() => {
      if (!socketRef.current?.connected) {
        connect();
      }
    }, 100);
  }, [city, connect]);

  return {
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    subscribe,
    unsubscribe,
    refresh,
    connect,
    disconnect,
    resetAndConnect,
  };
}

