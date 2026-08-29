export function formatInsightsMonth(isoMonth: string | null | undefined): string {
  const raw = isoMonth?.trim() ?? '';
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) {
    return 'Insights month: unknown';
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  if (!label || label === 'Invalid Date') {
    return 'Insights month: unknown';
  }
  return `Insights month: ${label}`;
}
