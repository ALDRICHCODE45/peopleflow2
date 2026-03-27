"use client";

import { useMemo } from "react";
import { useAvailableAnticipos } from "../hooks/useAvailableAnticipos";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";
import { Spinner } from "@shadcn/spinner";
import { Badge } from "@shadcn/badge";

interface AnticipoSelectorProps {
  clientId: string | undefined;
  value: string | undefined;
  onChange: (anticipoId: string, anticipoTotal: number) => void;
  disabled?: boolean;
}

function formatCurrency(amount: number, currency: string): string {
  const prefix = currency === "USD" ? "USD $" : "$";
  return `${prefix}${amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Selector de anticipos disponibles (no consumidos) para un cliente.
 * Usado en el formulario de LIQUIDACIÓN.
 */
export function AnticipoSelector({
  clientId,
  value,
  onChange,
  disabled = false,
}: AnticipoSelectorProps) {
  const { data: anticipos, isLoading } = useAvailableAnticipos(clientId);

  const options = useMemo(
    () =>
      (anticipos ?? []).map((a) => ({
        value: a.id,
        label: `${a.folio} — ${formatCurrency(a.total, a.currency)}`,
        folio: a.folio,
        total: a.total,
        currency: a.currency,
        issuedAt: a.issuedAt,
      })),
    [anticipos],
  );

  if (!clientId) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
        Selecciona un cliente primero
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
        <Spinner className="size-4" />
        Cargando anticipos...
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 p-3 text-center text-sm text-orange-700 dark:text-orange-300">
        No hay anticipos disponibles para este cliente
      </div>
    );
  }

  const selectedAnticipo = anticipos?.find((a) => a.id === value);

  return (
    <div className="space-y-2">
      <SearchableSelect
        options={options}
        value={value}
        onChange={(id) => {
          const anticipo = anticipos?.find((a) => a.id === id);
          if (anticipo) {
            onChange(id, anticipo.total);
          }
        }}
        placeholder="Seleccionar anticipo..."
        searchPlaceholder="Buscar por folio..."
        disabled={disabled}
        emptyMessage="No hay anticipos disponibles"
        renderOption={(opt) => (
          <div className="flex items-center justify-between w-full gap-2">
            <span className="font-medium">{opt.folio}</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {formatCurrency(opt.total, opt.currency)}
            </Badge>
          </div>
        )}
      />

      {selectedAnticipo && (
        <div className="rounded-md border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Folio:</span>
            <span className="font-medium">{selectedAnticipo.folio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monto a deducir:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(selectedAnticipo.total, selectedAnticipo.currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
