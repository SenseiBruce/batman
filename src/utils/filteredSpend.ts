import { Transaction } from '../types';

export function summarizeFilteredSpend(transactions: Transaction[]): {
  debit: number;
  credit: number;
  count: number;
} {
  let debit = 0;
  let credit = 0;
  for (const tx of transactions) {
    if (tx.type === 'debit') {
      debit += tx.amount;
    } else if (tx.type === 'credit') {
      credit += tx.amount;
    }
  }
  return { debit, credit, count: transactions.length };
}

export function formatFilteredSpend(
  transactions: Transaction[],
  monthLabel: string,
  formatAmount: (amount: number) => string,
): string {
  const { debit, credit, count } = summarizeFilteredSpend(transactions);
  return `Filtered spend (${monthLabel}): ${formatAmount(debit)} debits · ${formatAmount(credit)} credits · ${count} transactions`;
}
