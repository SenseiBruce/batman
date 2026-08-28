export const INSIGHTS_SELECTED_CATEGORY_KEY = 'jarvis_insights_selected_category';

export function loadInsightsSelectedCategory(
  storage: Pick<Storage, 'getItem'> = localStorage,
): string | null {
  try {
    const raw = storage.getItem(INSIGHTS_SELECTED_CATEGORY_KEY);
    if (!raw) return null;
    return raw;
  } catch {
    return null;
  }
}

export function persistInsightsSelectedCategory(
  category: string | null,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(INSIGHTS_SELECTED_CATEGORY_KEY, category ?? '');
  } catch {
    // ignore quota / private mode
  }
}
