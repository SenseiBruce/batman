import { Transaction, Category } from '../types';

export interface DailyInsight {
    type: 'success' | 'warning' | 'info' | 'tip';
    title: string;
    message: string;
    icon: string;
    gradient: string;
}

export const generateDailyInsight = (
    transactions: Transaction[],
    categories: Category[],
    currentMonth: string
): DailyInsight => {
    // Filter transactions for current month
    const monthTransactions = transactions.filter(t => {
        const txMonth = new Date(t.date).toISOString().slice(0, 7);
        return txMonth === currentMonth && t.type === 'debit';
    });

    // Filter transactions for previous month
    const prevMonthDate = new Date(currentMonth + '-01');
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);

    const prevMonthTransactions = transactions.filter(t => {
        const txMonth = new Date(t.date).toISOString().slice(0, 7);
        return txMonth === prevMonth && t.type === 'debit';
    });

    // Calculate totals
    const currentTotal = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const prevTotal = prevMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);

    // Get current week transactions (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekTransactions = monthTransactions.filter(t => new Date(t.date) >= weekAgo);
    const weekTotal = weekTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Category analysis
    const categorySpending = monthTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];

    // Generate insights based on data
    const insights: DailyInsight[] = [];

    // 1. Budget progress insight
    if (totalBudget > 0) {
        const percentUsed = (currentTotal / totalBudget) * 100;
        const daysInMonth = new Date(new Date(currentMonth + '-01').getFullYear(), new Date(currentMonth + '-01').getMonth() + 1, 0).getDate();
        const currentDay = new Date().getDate();
        const expectedPercent = (currentDay / daysInMonth) * 100;

        if (percentUsed < expectedPercent - 10) {
            insights.push({
                type: 'success',
                title: '🎯 Great Job!',
                message: `You're ${Math.round(expectedPercent - percentUsed)}% under budget for this point in the month. Keep it up!`,
                icon: '🎉',
                gradient: 'from-green-600 to-emerald-600'
            });
        } else if (percentUsed > expectedPercent + 15) {
            insights.push({
                type: 'warning',
                title: '⚠️ Budget Alert',
                message: `You've used ${Math.round(percentUsed)}% of your budget. Consider slowing down spending.`,
                icon: '⚠️',
                gradient: 'from-orange-600 to-red-600'
            });
        }
    }

    // 2. Month-over-month comparison
    if (prevTotal > 0) {
        const change = ((currentTotal - prevTotal) / prevTotal) * 100;
        if (change < -10) {
            insights.push({
                type: 'success',
                title: '📉 Spending Down',
                message: `You're spending ${Math.abs(Math.round(change))}% less than last month. Excellent progress!`,
                icon: '📉',
                gradient: 'from-blue-600 to-cyan-600'
            });
        } else if (change > 20) {
            insights.push({
                type: 'info',
                title: '📈 Spending Up',
                message: `Your spending is ${Math.round(change)}% higher than last month. Review your expenses.`,
                icon: '📈',
                gradient: 'from-purple-600 to-pink-600'
            });
        }
    }

    // 3. Top category insight
    if (topCategory && currentTotal > 0) {
        const categoryPercent = (topCategory[1] / currentTotal) * 100;
        if (categoryPercent > 40) {
            insights.push({
                type: 'info',
                title: `💰 ${topCategory[0]} Dominates`,
                message: `${Math.round(categoryPercent)}% of your spending is on ${topCategory[0]}. Worth reviewing?`,
                icon: categories.find(c => c.name === topCategory[0])?.icon || '💸',
                gradient: 'from-indigo-600 to-purple-600'
            });
        }
    }

    // 4. Weekly spending pattern
    if (weekTotal > 0 && currentTotal > 0) {
        const weeklyAverage = weekTotal / 7;
        const monthlyProjection = weeklyAverage * 30;
        if (monthlyProjection > totalBudget * 1.2) {
            insights.push({
                type: 'warning',
                title: '🔮 Projection Alert',
                message: `At this rate, you'll exceed your budget by ₹${Math.round(monthlyProjection - totalBudget).toLocaleString()}.`,
                icon: '🔮',
                gradient: 'from-red-600 to-pink-600'
            });
        }
    }

    // 5. Streak insights
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().slice(0, 10);
    });

    const daysWithSpending = last7Days.filter(day =>
        monthTransactions.some(t => t.date.startsWith(day))
    ).length;

    if (daysWithSpending === 0) {
        insights.push({
            type: 'success',
            title: '🌟 No Spending Week!',
            message: 'You haven\'t spent anything in the last 7 days. Impressive self-control!',
            icon: '🌟',
            gradient: 'from-yellow-600 to-orange-600'
        });
    }

    // 6. Savings tip
    if (monthTransactions.length > 10 && insights.length === 0) {
        const avgTransaction = currentTotal / monthTransactions.length;
        insights.push({
            type: 'tip',
            title: '💡 Smart Tip',
            message: `Your average transaction is ₹${Math.round(avgTransaction)}. Small savings add up - try reducing by 10%!`,
            icon: '💡',
            gradient: 'from-teal-600 to-green-600'
        });
    }

    // Default insight if no specific insights
    if (insights.length === 0) {
        if (monthTransactions.length === 0) {
            return {
                type: 'info',
                title: '👋 Welcome!',
                message: 'Start tracking your expenses by syncing SMS or adding transactions manually.',
                icon: '👋',
                gradient: 'from-blue-600 to-indigo-600'
            };
        }

        return {
            type: 'info',
            title: '✨ Looking Good',
            message: `You've tracked ${monthTransactions.length} transactions this month. Keep monitoring your spending!`,
            icon: '✨',
            gradient: 'from-cyan-600 to-blue-600'
        };
    }

    // Return the most relevant insight (prioritize warnings, then success, then info)
    const priorityOrder = ['warning', 'success', 'info', 'tip'];
    insights.sort((a, b) => priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type));

    return insights[0];
};
