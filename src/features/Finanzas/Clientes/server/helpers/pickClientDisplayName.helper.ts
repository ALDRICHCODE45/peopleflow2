/**
 * Devuelve el nombre a mostrar de un cliente.
 *
 * Regla: si existe `nombreComercial` (y no es string vacío), usar ese;
 * de lo contrario, caer al `nombre` (razón social, campo obligatorio).
 *
 * Usar este helper en TODA la UI/listados/emails para mantener consistencia.
 */
export function pickClientDisplayName(client: {
  nombre: string;
  nombreComercial?: string | null;
}): string {
  const comercial = client.nombreComercial?.trim();
  if (comercial) return comercial;
  return client.nombre;
}
