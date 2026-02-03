/**
 * Calcula el ancho mínimo de una columna basándose en su tamaño relativo (%)
 * y su tipo (por id) para casos especiales.
 *
 * @param size - Tamaño de la columna en porcentaje (ej: 8, 10, 30)
 * @param columnId - Id de la columna (para reglas específicas)
 * @returns Ancho mínimo en píxeles
 */
export const getColumnMinWidth = (size: number, columnId?: string): number => {
  // Columnas compactas (checkbox y acciones)
  if (columnId === "select") return 36;
  if (columnId === "actions") return 80;

  // Estado necesita más espacio para badges largos
  if (columnId === "status") return 260;

  // Para columnas compactas genéricas (checkbox, acciones pequeñas)
  // Checkbox (16px) + padding reducido (16px) = 32px
  if (size < 3) return 32;

  // Para columnas pequeñas (acciones, IDs)
  if (size <= 5) return 50;

  // Fórmula proporcional: cada 1% ≈ 7px de ancho mínimo
  // Esto da un balance natural entre tamaño declarado y espacio real
  return Math.max(size * 7, 60);
};
