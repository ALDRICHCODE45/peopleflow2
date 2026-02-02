/**
 * Calcula el ancho mínimo de una columna basándose en su tamaño relativo (%).
 * Usa una escala proporcional más natural: minWidth ≈ size × 7px
 *
 * @param size - Tamaño de la columna en porcentaje (ej: 8, 10, 30)
 * @returns Ancho mínimo en píxeles
 */
export const getColumnMinWidth = (size: number): number => {
  // Para columnas compactas (checkbox, acciones pequeñas)
  // Checkbox (16px) + padding reducido (16px) = 32px
  if (size < 3) return 32;

  // Para columnas pequeñas (acciones, IDs)
  if (size <= 5) return 50;

  // Fórmula proporcional: cada 1% ≈ 7px de ancho mínimo
  // Esto da un balance natural entre tamaño declarado y espacio real
  return Math.max(size * 7, 60);
};
