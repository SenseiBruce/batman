import type { Account } from '../types';

export function formatAccountsSummary(accounts: Account[], netWorth: number): string {
  const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  if (accounts.length === 0) {
    return `Accounts — Net worth: ${rupees(netWorth)}\n(none)`;
  }
  const lines = accounts.map((acc) => {
    const type = acc.type.replace('_', ' ');
    return `• ${acc.name} (${type}): ${rupees(acc.balance)}`;
  });
  return [`Accounts — Net worth: ${rupees(netWorth)}`, ...lines].join('\n');
}
