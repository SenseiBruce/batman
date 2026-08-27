export const TX_SEARCH_QUERY_KEY = 'jarvis_tx_search_query';

export function loadTxSearchQuery(storage: Pick<Storage, 'getItem'> = localStorage): string {
  try {
    return storage.getItem(TX_SEARCH_QUERY_KEY) ?? '';
  } catch {
    return '';
  }
}

export function persistTxSearchQuery(
  query: string,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(TX_SEARCH_QUERY_KEY, query);
  } catch {
    // ignore quota / private mode
  }
}
