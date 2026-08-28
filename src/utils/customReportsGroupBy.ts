export const CUSTOM_REPORTS_GROUP_BY_KEY = 'jarvis_custom_reports_group_by';

export type CustomReportsGroupBy = 'day' | 'week' | 'month';

export function parseCustomReportsGroupBy(
  value: string | null | undefined,
): CustomReportsGroupBy | null {
  if (value === 'day' || value === 'week' || value === 'month') {
    return value;
  }
  return null;
}

export function loadCustomReportsGroupBy(
  storage: Pick<Storage, 'getItem'> = localStorage,
): CustomReportsGroupBy {
  try {
    return parseCustomReportsGroupBy(storage.getItem(CUSTOM_REPORTS_GROUP_BY_KEY)) ?? 'day';
  } catch {
    return 'day';
  }
}

export function persistCustomReportsGroupBy(
  groupBy: CustomReportsGroupBy,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(CUSTOM_REPORTS_GROUP_BY_KEY, groupBy);
  } catch {
    // ignore quota / private mode
  }
}
