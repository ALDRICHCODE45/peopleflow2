/**
 * Componente reutilizable para mostrar pares label/value en el detalle de factura.
 */

interface InfoItemProps {
  label: string;
  value: string | null | undefined;
}

export function InfoItem({ label, value }: InfoItemProps) {
  if (!value) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm mt-0.5 italic">No ingresado</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}
