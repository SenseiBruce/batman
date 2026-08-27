export function formatDaysLeft(daysLeft: number, daysInMonth: number): string {
  const displayed = daysLeft > 0 ? daysLeft : daysInMonth;
  return `Days left: ${displayed}`;
}
