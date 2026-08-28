export const CUSTOM_REPORTS_DATE_RANGE_KEY = 'jarvis_custom_reports_range';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type CustomReportsDateRange = {
  startDate: string;
  endDate: string;
};

export function isValidReportDate(value: string | null | undefined): value is string {
  return typeof value === 'string' && DATE_RE.test(value);
}

export function defaultCustomReportsRange(now: Date = new Date()): CustomReportsDateRange {
  const end = new Date(now);
  const start = new Date(now);
  start.setMonth(start.getMonth() - 1);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export function loadCustomReportsDateRange(
  storage: Pick<Storage, 'getItem'> = localStorage,
  now: Date = new Date(),
): CustomReportsDateRange {
  const fallback = defaultCustomReportsRange(now);
  try {
    const raw = storage.getItem(CUSTOM_REPORTS_DATE_RANGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<CustomReportsDateRange>;
    if (isValidReportDate(parsed.startDate) && isValidReportDate(parsed.endDate)) {
      return { startDate: parsed.startDate, endDate: parsed.endDate };
    }
  } catch {
    // ignore quota / private mode / malformed JSON
  }
  return fallback;
}

export function persistCustomReportsDateRange(
  range: CustomReportsDateRange,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  if (!isValidReportDate(range.startDate) || !isValidReportDate(range.endDate)) {
    return;
  }
  try {
    storage.setItem(CUSTOM_REPORTS_DATE_RANGE_KEY, JSON.stringify(range));
  } catch {
    // ignore quota / private mode
  }
}
