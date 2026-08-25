const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export const TX_SELECTED_MONTH_KEY = 'jarvis_tx_selected_month';

export function currentMonthIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

export function isValidMonth(value: string | null | undefined): value is string {
  return typeof value === 'string' && MONTH_RE.test(value);
}

export function loadTxSelectedMonth(storage: Pick<Storage, 'getItem'> = localStorage): string {
  try {
    const stored = storage.getItem(TX_SELECTED_MONTH_KEY);
    if (isValidMonth(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return currentMonthIso();
}

export function persistTxSelectedMonth(
  month: string,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  if (!isValidMonth(month)) {
    return;
  }
  try {
    storage.setItem(TX_SELECTED_MONTH_KEY, month);
  } catch {
    // ignore
  }
}
