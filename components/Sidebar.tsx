"use client";

import { useState } from "react";
import { Menu, X, Cloud, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Sidebar({ isOpen, onToggle, darkMode, onToggleDarkMode }: SidebarProps) {
  return (
    <>
      {/* Overlay para mobile */}
      {isOpen ? (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50",
          "w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg",
          "border-r border-gray-200 dark:border-gray-800",
          "transition-transform duration-300 ease-in-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">ClimaDash</h1>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-foreground"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Navegação
            </div>
            <a
              href="#"
              className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium"
            >
              Dashboard
            </a>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-foreground"
            aria-label="Alternar tema"
          >
            {darkMode ? (
              <>
                <Sun className="h-5 w-5" />
                <span className="text-foreground">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5" />
                <span className="text-foreground">Modo Escuro</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 text-foreground"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

