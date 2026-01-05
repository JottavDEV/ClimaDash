"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GeocodingResult } from "@/lib/weather";

interface SearchBarProps {
  onSearch: (city: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      // Enviar chave de API via header se disponível
      const headers: HeadersInit = {};
      const clientApiKey = localStorage.getItem("tomorrow_io_api_key");
      if (clientApiKey) {
        headers["X-API-Key"] = clientApiKey;
      }
      
      const response = await fetch(
        `/api/weather/search?q=${encodeURIComponent(searchQuery)}`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: GeocodingResult) => {
    const cityName = suggestion.state
      ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`;
    setQuery(cityName);
    setShowSuggestions(false);
    onSearch(suggestion.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Buscar cidade..."
            className={cn(
              "w-full pl-12 pr-12 py-3 rounded-xl",
              "bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg",
              "border border-gray-200 dark:border-gray-700",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-all"
            )}
            disabled={isLoading}
          />
          {(isSearching || isLoading) && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border border-gray-200 dark:border-gray-700 shadow-xl z-50 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${suggestion.country}-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "w-full px-4 py-3 text-left",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-colors",
                "flex items-center gap-3",
                index === 0 && "rounded-t-xl",
                index === suggestions.length - 1 && "rounded-b-xl"
              )}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {suggestion.name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {suggestion.state
                    ? `${suggestion.state}, ${suggestion.country}`
                    : suggestion.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

