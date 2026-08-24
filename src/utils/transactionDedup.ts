import { Transaction } from '../types';

export type BulkAddResult = { added: number; skipped: number };

export function coalesceBulkAddResult(
  result: BulkAddResult | void,
  fallbackAdded: number,
): BulkAddResult {
  if (typeof result === 'object' && result !== null) {
    return result;
  }
  return { added: fallbackAdded, skipped: 0 };
}

export function transactionFingerprint(tx: Pick<Transaction, 'date' | 'merchant' | 'amount' | 'type'>): string {
  const day = tx.date.slice(0, 10);
  const merchant = tx.merchant.trim().toLowerCase();
  return `${day}|${merchant}|${tx.amount}|${tx.type}`;
}

export function dedupeTransactions(existing: Transaction[], incoming: Transaction[]): {
  unique: Transaction[];
  skipped: number;
} {
  const seen = new Set(existing.map(transactionFingerprint));
  const unique: Transaction[] = [];
  let skipped = 0;

  for (const tx of incoming) {
    const fp = transactionFingerprint(tx);
    if (seen.has(fp)) {
      skipped += 1;
      continue;
    }
    seen.add(fp);
    unique.push(tx);
  }

  return { unique, skipped };
}
