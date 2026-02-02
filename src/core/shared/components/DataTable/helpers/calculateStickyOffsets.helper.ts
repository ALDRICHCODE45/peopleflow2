import { Table } from "@tanstack/react-table";
import { getColumnMinWidth } from "./getColumnMinWidth.helper";

export interface StickyOffset {
  left?: number;
  right?: number;
  isPinnedLeft: boolean;
  isPinnedRight: boolean;
}

/**
 * Calcula los offsets sticky para columnas fijadas a izquierda/derecha.
 *
 * @param table - Instancia de la tabla de TanStack
 * @returns Map con los offsets por columnId
 */
export function calculateStickyOffsets<TData>(
  table: Table<TData>
): Map<string, StickyOffset> {
  const offsets = new Map<string, StickyOffset>();
  const pinningState = table.getState().columnPinning;

  const leftPinned = pinningState.left ?? [];
  const rightPinned = pinningState.right ?? [];

  // Calcular offsets para columnas fijadas a la izquierda
  let leftOffset = 0;
  for (const columnId of leftPinned) {
    const column = table.getColumn(columnId);
    if (column) {
      offsets.set(columnId, {
        left: leftOffset,
        isPinnedLeft: true,
        isPinnedRight: false,
      });
      // Acumular el ancho de la columna para la siguiente
      const size = column.getSize();
      leftOffset += getColumnMinWidth(size, column.id);
    }
  }

  // Calcular offsets para columnas fijadas a la derecha (en orden inverso)
  let rightOffset = 0;
  // Recorrer en orden inverso para acumular desde la derecha
  for (let i = rightPinned.length - 1; i >= 0; i--) {
    const columnId = rightPinned[i];
    const column = table.getColumn(columnId);
    if (column) {
      offsets.set(columnId, {
        right: rightOffset,
        isPinnedLeft: false,
        isPinnedRight: true,
      });
      // Acumular el ancho de la columna para la siguiente
      const size = column.getSize();
      rightOffset += getColumnMinWidth(size, column.id);
    }
  }

  // Marcar columnas no fijadas
  for (const column of table.getAllColumns()) {
    if (!offsets.has(column.id)) {
      offsets.set(column.id, {
        isPinnedLeft: false,
        isPinnedRight: false,
      });
    }
  }

  return offsets;
}

/**
 * Obtiene los estilos CSS para una columna fijada.
 *
 * @param offset - Offset de la columna
 * @returns Objeto con estilos CSS inline
 */
export function getStickyStyles(
  offset: StickyOffset | undefined
): React.CSSProperties {
  if (!offset || (!offset.isPinnedLeft && !offset.isPinnedRight)) {
    return {};
  }

  const styles: React.CSSProperties = {
    position: "sticky",
    backgroundColor: "var(--background)",
  };

  if (offset.isPinnedLeft && offset.left !== undefined) {
    styles.left = offset.left;
    styles.zIndex = 2;
    // Sombra sutil para separación visual
    styles.boxShadow = "2px 0 4px -2px rgba(0, 0, 0, 0.1)";
  }

  if (offset.isPinnedRight && offset.right !== undefined) {
    styles.right = offset.right;
    styles.zIndex = 1;
    // Sombra sutil para separación visual
    styles.boxShadow = "-2px 0 4px -2px rgba(0, 0, 0, 0.1)";
  }

  return styles;
}
