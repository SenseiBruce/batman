const STORAGE_KEY = 'jarvis_tx_date_range';

export type StoredDateRange = {
  dateFrom: string;
  dateTo: string;
};

export function loadTxDateRange(): StoredDateRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { dateFrom: '', dateTo: '' };
    }
    const parsed = JSON.parse(raw) as Partial<StoredDateRange>;
    return {
      dateFrom: typeof parsed.dateFrom === 'string' ? parsed.dateFrom : '',
      dateTo: typeof parsed.dateTo === 'string' ? parsed.dateTo : '',
    };
  } catch {
    return { dateFrom: '', dateTo: '' };
  }
}

export function saveTxDateRange(range: StoredDateRange): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
  } catch {
    // Ignore quota / private-mode failures.
  }
}
