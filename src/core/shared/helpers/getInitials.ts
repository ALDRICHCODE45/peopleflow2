/**
 * Obtiene las iniciales de un nombre completo.
 * Toma las iniciales de las primeras dos palabras del nombre.
 *
 * @param name - El nombre completo (ej: "jonatan alonso flores")
 * @returns Las iniciales en mayúsculas (ej: "JA")
 *
 * @example
 * getInitials("jonatan alonso flores") // "JA"
 * getInitials("maria") // "M"
 * getInitials("juan carlos perez") // "JC"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return "";
  }

  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }

  // Tomar las iniciales de las primeras dos palabras
  return (words[0][0] + words[1][0]).toUpperCase();
}
