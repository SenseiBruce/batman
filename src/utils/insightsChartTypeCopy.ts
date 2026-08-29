import type { InsightsChartType } from './insightsChartType';

export function formatInsightsChartType(chartType: InsightsChartType | null | undefined): string {
  if (chartType === 'pie' || chartType === 'bar') {
    return `Insights chart: ${chartType}`;
  }
  return 'Insights chart: unknown';
}
