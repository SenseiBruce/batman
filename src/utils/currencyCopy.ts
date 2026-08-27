import { CURRENCIES, type CurrencyCode } from '../contexts/CurrencyContext';

export function formatSelectedCurrency(code: CurrencyCode): string {
  const meta = CURRENCIES[code];
  if (!meta) {
    return `Currency: ${code}`;
  }
  return `Currency: ${meta.symbol} ${meta.name} (${code})`;
}
