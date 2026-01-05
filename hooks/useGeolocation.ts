"use client";

import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permission: "granted" | "denied" | "prompt" | null;
}

interface UseGeolocationOptions {
  enabled?: boolean;
  onSuccess?: (coords: { latitude: number; longitude: number }) => void;
  onError?: (error: string) => void;
}

export function useGeolocation({
  enabled = true,
  onSuccess,
  onError,
}: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permission: null,
  });

  // Verificar permissão salva
  useEffect(() => {
    const savedPermission = localStorage.getItem("geolocation_permission");
    if (savedPermission === "granted" || savedPermission === "denied") {
      setState((prev) => ({
        ...prev,
        permission: savedPermission as "granted" | "denied",
      }));
    }
  }, []);

  // Verificar se geolocalização está disponível (só no cliente)
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(typeof window !== "undefined" && "geolocation" in navigator);
  }, []);

  const requestLocation = useCallback(async () => {
    if (!isAvailable) {
      const errorMsg = "Geolocalização não está disponível no seu navegador";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        loading: false,
      }));
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar permissão via Permissions API (se disponível)
      if ("permissions" in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({
            name: "geolocation" as PermissionName,
          });

          setState((prev) => ({
            ...prev,
            permission: permissionStatus.state as "granted" | "denied" | "prompt",
          }));

          if (permissionStatus.state === "denied") {
            localStorage.setItem("geolocation_permission", "denied");
            const errorMsg = "Permissão de localização negada";
            setState((prev) => ({
              ...prev,
              error: errorMsg,
              loading: false,
            }));
            if (onError) {
              onError(errorMsg);
            }
            return;
          }

          // Listener para mudanças de permissão
          permissionStatus.onchange = () => {
            setState((prev) => ({
              ...prev,
              permission: permissionStatus.state as "granted" | "denied" | "prompt",
            }));
            if (permissionStatus.state === "denied") {
              localStorage.setItem("geolocation_permission", "denied");
            } else if (permissionStatus.state === "granted") {
              localStorage.setItem("geolocation_permission", "granted");
            }
          };
        } catch {
          // Permissions API não disponível, continuar normalmente
        }
      }

      // Solicitar localização
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setState({
            latitude,
            longitude,
            error: null,
            loading: false,
            permission: "granted",
          });
          localStorage.setItem("geolocation_permission", "granted");
          if (onSuccess) {
            onSuccess({ latitude, longitude });
          }
        },
        (error) => {
          let errorMsg = "Erro ao obter localização";
          let permission: "granted" | "denied" | "prompt" = "prompt";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Permissão de localização negada pelo usuário";
              permission = "denied";
              localStorage.setItem("geolocation_permission", "denied");
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Informações de localização não disponíveis";
              break;
            case error.TIMEOUT:
              errorMsg = "Tempo limite excedido ao obter localização";
              break;
            default:
              errorMsg = "Erro desconhecido ao obter localização";
              break;
          }

          setState((prev) => ({
            ...prev,
            error: errorMsg,
            loading: false,
            permission,
          }));

          if (onError) {
            onError(errorMsg);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutos
        }
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro ao solicitar localização";
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        loading: false,
      }));
      if (onError) {
        onError(errorMsg);
      }
    }
  }, [isAvailable, onSuccess, onError]);

  useEffect(() => {
    if (enabled && isAvailable) {
      const savedPermission = localStorage.getItem("geolocation_permission");
      // Só solicitar automaticamente se já tiver permissão concedida
      if (savedPermission === "granted") {
        requestLocation();
      }
    }
  }, [enabled, isAvailable, requestLocation]);

  const clearPermission = useCallback(() => {
    localStorage.removeItem("geolocation_permission");
    setState((prev) => ({
      ...prev,
      permission: null,
      latitude: null,
      longitude: null,
      error: null,
    }));
  }, []);

  return {
    latitude: state.latitude,
    longitude: state.longitude,
    error: state.error,
    loading: state.loading,
    permission: state.permission,
    isAvailable,
    requestLocation,
    clearPermission,
  };
}

