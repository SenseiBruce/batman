export function formatBudgetAlerts(
  alerts: Array<{ name: string; percentage: number }>,
): string {
  if (alerts.length === 0) {
    return 'Budget alerts: none';
  }
  const lines = [
    `Budget alerts (${alerts.length}):`,
    ...alerts.map((a) => `- ${a.name}: ${Math.round(a.percentage)}% used`),
  ];
  return lines.join('\n');
}
