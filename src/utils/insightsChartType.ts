export const INSIGHTS_CHART_TYPE_KEY = 'jarvis_insights_chart_type';

export type InsightsChartType = 'pie' | 'bar';

export function parseInsightsChartType(
  value: string | null | undefined,
): InsightsChartType | null {
  if (value === 'pie' || value === 'bar') {
    return value;
  }
  return null;
}

export function loadInsightsChartType(
  storage: Pick<Storage, 'getItem'> = localStorage,
): InsightsChartType {
  try {
    return parseInsightsChartType(storage.getItem(INSIGHTS_CHART_TYPE_KEY)) ?? 'pie';
  } catch {
    return 'pie';
  }
}

export function persistInsightsChartType(
  type: InsightsChartType,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(INSIGHTS_CHART_TYPE_KEY, type);
  } catch {
    // ignore quota / private mode
  }
}
