/**
 * Celda vacía para columnas de la tabla de facturas.
 * Muestra un guión estilizado cuando no hay datos.
 */
export function EmptyCell() {
  return <span className="text-muted-foreground text-xs italic">—</span>;
}
