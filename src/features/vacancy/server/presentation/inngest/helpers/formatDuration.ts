export function formatDuration(value: number, unit: string): string {
  return unit === "HOURS" ? `${value}h` : `${value}d`;
}
