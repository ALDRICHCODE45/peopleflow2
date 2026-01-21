import { useState, useEffect } from "react";

/**
 * Hook que devuelve un valor con debounce
 * Útil para búsquedas server-side para evitar requests excesivos
 *
 * @param value - El valor a debouncear
 * @param delay - Tiempo de espera en milisegundos (default: 300ms)
 * @returns El valor después del delay
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebouncedValue(search, 300);
 *
 * // El query solo se ejecuta cuando debouncedSearch cambia
 * useQuery({
 *   queryKey: ["items", debouncedSearch],
 *   queryFn: () => fetchItems(debouncedSearch),
 * });
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
