const STORAGE_KEY = 'jarvis_tx_amount_range';

export type StoredAmountRange = {
  amountMin: string;
  amountMax: string;
};

export function loadTxAmountRange(): StoredAmountRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { amountMin: '', amountMax: '' };
    }
    const parsed = JSON.parse(raw) as Partial<StoredAmountRange>;
    return {
      amountMin: typeof parsed.amountMin === 'string' ? parsed.amountMin : '',
      amountMax: typeof parsed.amountMax === 'string' ? parsed.amountMax : '',
    };
  } catch {
    return { amountMin: '', amountMax: '' };
  }
}

export function saveTxAmountRange(range: StoredAmountRange): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
  } catch {
    // Ignore quota / private-mode failures.
  }
}
