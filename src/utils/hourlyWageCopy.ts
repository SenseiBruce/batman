export function formatHourlyWage(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'Hourly wage: unset';
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Hourly wage: unset';
  }
  return `Hourly wage: ${trimmed}`;
}
