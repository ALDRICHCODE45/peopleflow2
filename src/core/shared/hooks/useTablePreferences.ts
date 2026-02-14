"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ColumnPinningState, ColumnOrderState, VisibilityState } from "@tanstack/react-table";

interface TablePreferences {
  columnPinning?: ColumnPinningState;
  columnOrder?: ColumnOrderState;
  columnVisibility?: VisibilityState;
}

interface UseTablePreferencesOptions {
  /** Key único para identificar la tabla en localStorage */
  persistKey?: string;
  /** Estado inicial de columnas fijadas */
  defaultPinning?: ColumnPinningState;
  /** Orden inicial de columnas */
  defaultOrder?: ColumnOrderState;
  /** Estado inicial de visibilidad de columnas */
  defaultVisibility?: VisibilityState;
}

interface UseTablePreferencesReturn {
  /** Estado actual de columnas fijadas */
  columnPinning: ColumnPinningState;
  /** Orden actual de columnas */
  columnOrder: ColumnOrderState;
  /** Estado actual de visibilidad de columnas */
  columnVisibility: VisibilityState;
  /** Actualizar estado de columnas fijadas */
  setColumnPinning: (state: ColumnPinningState | ((prev: ColumnPinningState) => ColumnPinningState)) => void;
  /** Actualizar orden de columnas */
  setColumnOrder: (state: ColumnOrderState | ((prev: ColumnOrderState) => ColumnOrderState)) => void;
  /** Actualizar visibilidad de columnas */
  setColumnVisibility: (state: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => void;
  /** Resetear preferencias a valores por defecto */
  resetPreferences: () => void;
}

const STORAGE_PREFIX = "table-preferences-";

/**
 * Safely get initial preferences from localStorage.
 * Returns null if not in browser or no stored value.
 */
function getStoredPreferences(persistKey: string | undefined): TablePreferences | null {
  if (typeof window === "undefined" || !persistKey) return null;

  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${persistKey}`);
    if (stored) {
      return JSON.parse(stored) as TablePreferences;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

/**
 * Hook para persistir preferencias de columnas (pinning y orden) en localStorage.
 * SSR-safe: usa lazy initializer para cargar desde localStorage solo en cliente.
 */
export function useTablePreferences({
  persistKey,
  defaultPinning = { left: [], right: [] },
  defaultOrder = [],
  defaultVisibility = {},
}: UseTablePreferencesOptions = {}): UseTablePreferencesReturn {
  // Use lazy initializer to load from localStorage on first render (client-side only)
  const [columnPinning, setColumnPinningState] = useState<ColumnPinningState>(() => {
    const stored = getStoredPreferences(persistKey);
    return stored?.columnPinning ?? defaultPinning;
  });

  const [columnOrder, setColumnOrderState] = useState<ColumnOrderState>(() => {
    const stored = getStoredPreferences(persistKey);
    return stored?.columnOrder ?? defaultOrder;
  });

  const [columnVisibility, setColumnVisibilityState] = useState<VisibilityState>(() => {
    const stored = getStoredPreferences(persistKey);
    return stored?.columnVisibility ?? defaultVisibility;
  });

  // Track if we've done the initial hydration
  const isInitialMount = useRef(true);

  // Guardar preferencias en localStorage cuando cambien (skip first render)
  useEffect(() => {
    // Skip on initial mount to avoid unnecessary writes
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!persistKey) return;

    try {
      const preferences: TablePreferences = {
        columnPinning,
        columnOrder,
        columnVisibility,
      };
      localStorage.setItem(`${STORAGE_PREFIX}${persistKey}`, JSON.stringify(preferences));
    } catch (error) {
      console.warn("Error saving table preferences to localStorage:", error);
    }
  }, [persistKey, columnPinning, columnOrder, columnVisibility]);

  // Wrapper para setColumnPinning que maneja funciones updater
  const setColumnPinning = useCallback(
    (stateOrUpdater: ColumnPinningState | ((prev: ColumnPinningState) => ColumnPinningState)) => {
      setColumnPinningState(stateOrUpdater);
    },
    []
  );

  // Wrapper para setColumnOrder que maneja funciones updater
  const setColumnOrder = useCallback(
    (stateOrUpdater: ColumnOrderState | ((prev: ColumnOrderState) => ColumnOrderState)) => {
      setColumnOrderState(stateOrUpdater);
    },
    []
  );

  // Wrapper para setColumnVisibility que maneja funciones updater
  const setColumnVisibility = useCallback(
    (stateOrUpdater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => {
      setColumnVisibilityState(stateOrUpdater);
    },
    []
  );

  // Resetear preferencias a valores por defecto
  const resetPreferences = useCallback(() => {
    setColumnPinningState(defaultPinning);
    setColumnOrderState(defaultOrder);
    setColumnVisibilityState(defaultVisibility);

    if (persistKey) {
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${persistKey}`);
      } catch (error) {
        console.warn("Error removing table preferences from localStorage:", error);
      }
    }
  }, [defaultPinning, defaultOrder, defaultVisibility, persistKey]);

  return {
    columnPinning,
    columnOrder,
    columnVisibility,
    setColumnPinning,
    setColumnOrder,
    setColumnVisibility,
    resetPreferences,
  };
}
