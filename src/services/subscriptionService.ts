import { Transaction } from '../types';

export interface Subscription {
    id: string; // generated id
    merchant: string;
    amount: number;
    lastPaymentDate: string; // ISO string
    nextDueDate: string; // ISO string
    frequencyDays: number; // e.g., 30
}

/**
 * Detect recurring subscriptions from a list of transactions.
 * Simple heuristic: same merchant, same amount (±10%), and dates roughly spaced by a given frequency (default 30 days).
 * Returns an array of Subscription objects.
 */
export const detectSubscriptions = (
    transactions: Transaction[],
    frequencyDays = 30,
    amountTolerance = 0.1
): Subscription[] => {
    // Filter only debit transactions (expenses) that are not manual corrections
    const expenseTx = transactions.filter(t => t.type === 'debit' && !t.isManual);

    // Group by merchant (case‑insensitive)
    const groups: Record<string, Transaction[]> = {};
    expenseTx.forEach(t => {
        const key = t.merchant.toLowerCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
    });

    const subs: Subscription[] = [];
    let subId = 0;

    Object.entries(groups).forEach(([merchantKey, txs]) => {
        if (txs.length < 3) return; // need at least 3 payments to consider recurring
        // Sort by date descending
        const sorted = txs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // Check if amounts are consistent
        const amounts = sorted.map(t => t.amount);
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const withinTolerance = amounts.every(a => Math.abs(a - avg) / avg <= amountTolerance);
        if (!withinTolerance) return;

        // Check intervals between consecutive payments
        const dates = sorted.map(t => new Date(t.date));
        const intervals = [];
        for (let i = 0; i < dates.length - 1; i++) {
            intervals.push((dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24)); // days
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (Math.abs(avgInterval - frequencyDays) > 5) return; // allow ±5 days variance

        const lastPayment = sorted[0];
        const nextDue = new Date(lastPayment.date);
        nextDue.setDate(nextDue.getDate() + Math.round(avgInterval));

        subs.push({
            id: `sub-${subId++}`,
            merchant: lastPayment.merchant,
            amount: Math.round(avg),
            lastPaymentDate: lastPayment.date,
            nextDueDate: nextDue.toISOString().split('T')[0],
            frequencyDays: Math.round(avgInterval)
        });
    });

    return subs;
};
