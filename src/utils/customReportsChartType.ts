export const CUSTOM_REPORTS_CHART_TYPE_KEY = 'jarvis_custom_reports_chart_type';

export type CustomReportsChartType = 'line' | 'bar' | 'pie';

export function parseCustomReportsChartType(
  value: string | null | undefined,
): CustomReportsChartType | null {
  if (value === 'line' || value === 'bar' || value === 'pie') {
    return value;
  }
  return null;
}

export function loadCustomReportsChartType(
  storage: Pick<Storage, 'getItem'> = localStorage,
): CustomReportsChartType {
  try {
    return parseCustomReportsChartType(storage.getItem(CUSTOM_REPORTS_CHART_TYPE_KEY)) ?? 'bar';
  } catch {
    return 'bar';
  }
}

export function persistCustomReportsChartType(
  type: CustomReportsChartType,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(CUSTOM_REPORTS_CHART_TYPE_KEY, type);
  } catch {
    // ignore quota / private mode
  }
}
