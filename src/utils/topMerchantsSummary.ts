export type MerchantSpend = {
  name: string;
  amount: number;
};

export function formatTopMerchantsSummary(
  month: string,
  merchants: MerchantSpend[],
  formatAmount: (n: number) => string
): string {
  if (merchants.length === 0) {
    return `Top merchants (${month}): none`;
  }
  const lines = merchants.map((m, i) => `${i + 1}. ${m.name} — ${formatAmount(m.amount)}`);
  return [`Top merchants (${month})`, ...lines].join('\n');
}
