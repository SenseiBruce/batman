export const TX_VIEW_MODE_KEY = 'jarvis_tx_view_mode';

export type TxViewMode = 'list' | 'calendar';

export function parseTxViewMode(value: string | null | undefined): TxViewMode | null {
  if (value === 'list' || value === 'calendar') {
    return value;
  }
  return null;
}

export function loadTxViewMode(storage: Pick<Storage, 'getItem'> = localStorage): TxViewMode {
  try {
    return parseTxViewMode(storage.getItem(TX_VIEW_MODE_KEY)) ?? 'list';
  } catch {
    return 'list';
  }
}

export function persistTxViewMode(
  mode: TxViewMode,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(TX_VIEW_MODE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}
