export const TX_CATEGORY_FILTER_KEY = 'jarvis_tx_category_filter';

export function loadTxCategoryFilter(storage: Pick<Storage, 'getItem'> = localStorage): string {
  try {
    return storage.getItem(TX_CATEGORY_FILTER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function persistTxCategoryFilter(
  category: string,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(TX_CATEGORY_FILTER_KEY, category);
  } catch {
    // ignore quota / private mode
  }
}
