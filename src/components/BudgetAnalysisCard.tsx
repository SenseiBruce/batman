import React from 'react';
import { Category, Transaction } from '../types';
import { BudgetService } from '../services/budgetService';
import { motion } from 'framer-motion';
import { useCurrency } from '../contexts/CurrencyContext';

interface BudgetAnalysisCardProps {
    categories: Category[];
    transactions: Transaction[];
    selectedMonth: string;
}

export const BudgetAnalysisCard: React.FC<BudgetAnalysisCardProps> = ({
    categories,
    transactions,
    selectedMonth
}) => {
    const { formatAmount } = useCurrency();
    const now = new Date();

    // Parse selected month
    const [year, month] = selectedMonth.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    const isCurrentMonth = selectedMonth === now.toISOString().slice(0, 7);
    const isPastMonth = selectedMonth < now.toISOString().slice(0, 7);

    const daysInMonth = periodEnd.getDate();
    const daysRemaining = isCurrentMonth
        ? Math.max(1, daysInMonth - now.getDate() + 1)
        : isPastMonth ? 0 : daysInMonth;

    // Calculate total budget stats
    const stats = categories.reduce((acc, cat) => {
        const effectiveBudget = BudgetService.getEffectiveBudget(cat);
        const spent = BudgetService.calculateSpent(cat, transactions, periodStart, periodEnd);

        let safeSpend = 0;
        const remaining = effectiveBudget - spent;

        if (daysRemaining > 0 && remaining > 0) {
            safeSpend = remaining / daysRemaining;
        }

        return {
            totalBudget: acc.totalBudget + effectiveBudget,
            totalSpent: acc.totalSpent + spent,
            totalSafeSpend: acc.totalSafeSpend + safeSpend,
            overBudgetCount: acc.overBudgetCount + (spent > effectiveBudget ? 1 : 0)
        };
    }, { totalBudget: 0, totalSpent: 0, totalSafeSpend: 0, overBudgetCount: 0 });

    const remaining = stats.totalBudget - stats.totalSpent;
    const progress = Math.min((stats.totalSpent / stats.totalBudget) * 100, 100);

    // Determine status color
    let statusColor = 'bg-green-500';
    let statusText = 'On Track';

    if (progress > 90) {
        statusColor = 'bg-red-500';
        statusText = 'Critical';
    } else if (progress > 75) {
        statusColor = 'bg-orange-500';
        statusText = 'Warning';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700 mb-6"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-white font-bold text-lg">Budget Analysis</h3>
                    <p className="text-gray-400 text-xs">Monthly Overview</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColor}`}>
                    {statusText}
                </div>
            </div>

            {/* Main Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Spent</span>
                    <span className="text-white font-medium">
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${statusColor}`}
                    />
                </div>
                <div className="flex justify-between text-xs mt-2 text-gray-400">
                    <span>{formatAmount(stats.totalSpent)}</span>
                    <span>{formatAmount(stats.totalBudget)}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-3 rounded-xl">
                    <p className="text-gray-400 text-xs mb-1">{isPastMonth ? 'Daily Average' : 'Safe Daily Spend'}</p>
                    <p className="text-white font-bold text-lg">
                        {isPastMonth
                            ? formatAmount(Math.round(stats.totalSpent / daysInMonth))
                            : formatAmount(Math.round(stats.totalSafeSpend))}
                    </p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-xl">
                    <p className="text-gray-400 text-xs mb-1">Remaining</p>
                    <p className={`font-bold text-lg ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatAmount(Math.abs(remaining))}
                    </p>
                </div>
            </div>

            {/* Alert Message */}
            {stats.overBudgetCount > 0 && (
                <div className="mt-4 flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-2 rounded-lg">
                    <span>⚠️</span>
                    <span>{stats.overBudgetCount} categories are over budget</span>
                </div>
            )}
        </motion.div>
    );
};
