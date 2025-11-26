import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface TopMerchantsProps {
    transactions: Transaction[];
    selectedMonth: string; // YYYY-MM
}

const TopMerchants: React.FC<TopMerchantsProps> = ({ transactions, selectedMonth }) => {
    const topMerchants = useMemo(() => {
        const merchantMap = new Map<string, number>();

        transactions.forEach(t => {
            const tMonth = new Date(t.date).toISOString().slice(0, 7);
            if (tMonth === selectedMonth && t.type === 'debit') {
                const current = merchantMap.get(t.merchant) || 0;
                merchantMap.set(t.merchant, current + t.amount);
            }
        });

        return Array.from(merchantMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }));
    }, [transactions, selectedMonth]);

    if (topMerchants.length === 0) return null;

    return (
        <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Top Merchants</h3>
            <div className="space-y-4">
                {topMerchants.map((m, index) => (
                    <div key={m.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                        index === 2 ? 'bg-orange-500/20 text-orange-500' :
                                            'bg-gray-700 text-gray-400'
                                }`}>
                                {index + 1}
                            </div>
                            <p className="text-gray-200 font-medium truncate max-w-[150px]">{m.name}</p>
                        </div>
                        <p className="text-white font-semibold">₹{m.amount.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopMerchants;
