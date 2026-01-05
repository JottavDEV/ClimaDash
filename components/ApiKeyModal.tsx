"use client";

import { useState, useEffect } from "react";
import { X, Key, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Carregar chave salva do localStorage
      const savedKey = localStorage.getItem("tomorrow_io_api_key") || "";
      setApiKey(savedKey);
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    // Validar formato básico (não vazio)
    if (!apiKey.trim()) {
      setError("A chave de API não pode estar vazia");
      setSaving(false);
      return;
    }

    // Testar a chave fazendo uma requisição simples
    try {
      const testUrl = `https://api.tomorrow.io/v4/weather/realtime?location=São Paulo&units=metric&apikey=${apiKey.trim()}`;
      const response = await fetch(testUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        setError("Chave de API inválida. Verifique se a chave está correta.");
        setSaving(false);
        return;
      }

      if (!response.ok) {
        setError("Erro ao validar chave de API. Tente novamente.");
        setSaving(false);
        return;
      }

      // Salvar no localStorage
      localStorage.setItem("tomorrow_io_api_key", apiKey.trim());
      onSave(apiKey.trim());
      onClose();
    } catch (err) {
      setError("Erro ao validar chave de API. Verifique sua conexão.");
      console.error("Erro ao validar API key:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem("tomorrow_io_api_key");
    setApiKey("");
    onSave("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Key className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Configurar Chave de API
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Chave de API Tomorrow.io
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder="Cole sua chave de API aqui"
              className={cn(
                "w-full px-4 py-3 rounded-xl",
                "bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg",
                "border border-gray-200 dark:border-gray-700",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "transition-all",
                error && "border-red-500 focus:ring-red-500"
              )}
              disabled={saving}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Sua chave será armazenada apenas no seu navegador e nunca será
              compartilhada.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 transition-colors",
                "font-medium",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Salvar e Validar
                </>
              )}
            </button>
            {apiKey && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className={cn(
                  "px-6 py-3 rounded-xl",
                  "bg-gray-100 dark:bg-gray-800 text-foreground",
                  "hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                  "font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Remover
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Como obter uma chave:</strong>
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                Acesse{" "}
                <a
                  href="https://www.tomorrow.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  tomorrow.io
                </a>
              </li>
              <li>Crie uma conta gratuita</li>
              <li>Gere uma chave de API no painel</li>
              <li>Cole a chave acima</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

