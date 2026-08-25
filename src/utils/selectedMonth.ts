const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export const SELECTED_MONTH_STORAGE_KEY = 'jarvis_selected_month';

export function currentMonthIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

export function isValidSelectedMonth(value: string | null | undefined): value is string {
  return typeof value === 'string' && MONTH_RE.test(value);
}

export function loadSelectedMonth(storage: Pick<Storage, 'getItem'> = localStorage): string {
  try {
    const stored = storage.getItem(SELECTED_MONTH_STORAGE_KEY);
    if (isValidSelectedMonth(stored)) {
      return stored;
    }
  } catch {
    // jsdom / private mode may throw
  }
  return currentMonthIso();
}

export function persistSelectedMonth(
  month: string,
  storage: Pick<Storage, 'setItem'> = localStorage
): void {
  if (!isValidSelectedMonth(month)) {
    return;
  }
  try {
    storage.setItem(SELECTED_MONTH_STORAGE_KEY, month);
  } catch {
    // ignore quota / private-mode failures
  }
}
