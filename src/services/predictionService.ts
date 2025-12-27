import { Transaction, Category } from '../types';

/**
 * ML-based Prediction Service
 * Provides spending forecasts, anomaly detection, and predictive insights
 */

export interface SpendingPrediction {
    categoryName: string;
    predictedSpend: number;
    confidence: number; // 0-100
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
}

export interface BudgetForecast {
    categoryName: string;
    currentSpend: number;
    predictedMonthEnd: number;
    budgetLimit: number;
    willExceed: boolean;
    exceedAmount?: number;
    daysUntilExceed?: number;
}

export interface SpendingAnomaly {
    transactionId: string;
    merchant: string;
    amount: number;
    category: string;
    date: string;
    anomalyScore: number; // 0-100, higher = more unusual
    reason: string;
}

export interface SpendingPattern {
    dayOfWeek: string;
    averageSpend: number;
    peakHour?: number;
    commonCategories: string[];
}

export interface PredictiveInsight {
    type: 'warning' | 'suggestion' | 'achievement' | 'trend';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    actionable?: string;
    icon: string;
}

export class PredictionService {

    /**
     * Predict spending for each category by end of month
     */
    static predictMonthlySpending(
        transactions: Transaction[],
        categories: Category[],
        selectedMonth: string
    ): SpendingPrediction[] {
        const predictions: SpendingPrediction[] = [];
        const now = new Date();
        const [year, month] = selectedMonth.split('-').map(Number);
        const isCurrentMonth = selectedMonth === now.toISOString().slice(0, 7);

        if (!isCurrentMonth) {
            // Only predict for current month
            return [];
        }

        const currentDay = now.getDate();
        const daysInMonth = new Date(year, month, 0).getDate();
        const daysElapsed = currentDay;
        const daysRemaining = daysInMonth - currentDay;

        categories.forEach(category => {
            const categoryTransactions = transactions.filter(t =>
                t.category === category.name &&
                t.type === 'debit' &&
                t.date.startsWith(selectedMonth)
            );

            if (categoryTransactions.length === 0) {
                predictions.push({
                    categoryName: category.name,
                    predictedSpend: 0,
                    confidence: 50,
                    trend: 'stable',
                    trendPercentage: 0
                });
                return;
            }

            const currentSpend = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

            // Calculate daily average
            const dailyAverage = currentSpend / daysElapsed;

            // Simple linear prediction
            const simplePrediction = dailyAverage * daysInMonth;

            // Weighted prediction (recent days have more weight)
            const weightedPrediction = this.calculateWeightedPrediction(
                categoryTransactions,
                daysInMonth,
                daysElapsed
            );

            // Trend-based prediction
            const trendPrediction = this.calculateTrendPrediction(
                categoryTransactions,
                daysInMonth,
                daysElapsed
            );

            // Combine predictions (weighted average)
            const predictedSpend = (
                simplePrediction * 0.3 +
                weightedPrediction * 0.4 +
                trendPrediction * 0.3
            );

            // Calculate confidence based on data consistency
            const confidence = this.calculateConfidence(categoryTransactions, daysElapsed);

            // Determine trend
            const previousMonthSpend = this.getPreviousMonthSpend(
                transactions,
                category.name,
                year,
                month
            );

            const { trend, trendPercentage } = this.calculateTrend(
                predictedSpend,
                previousMonthSpend
            );

            predictions.push({
                categoryName: category.name,
                predictedSpend: Math.round(predictedSpend),
                confidence: Math.round(confidence),
                trend,
                trendPercentage
            });
        });

        return predictions;
    }

    /**
     * Forecast if budget will be exceeded
     */
    static forecastBudgetExceedance(
        transactions: Transaction[],
        categories: Category[],
        selectedMonth: string
    ): BudgetForecast[] {
        const forecasts: BudgetForecast[] = [];
        const predictions = this.predictMonthlySpending(transactions, categories, selectedMonth);
        const now = new Date();
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const currentDay = now.getDate();

        categories.forEach(category => {
            const prediction = predictions.find(p => p.categoryName === category.name);
            if (!prediction) return;

            const currentSpend = transactions
                .filter(t =>
                    t.category === category.name &&
                    t.type === 'debit' &&
                    t.date.startsWith(selectedMonth)
                )
                .reduce((sum, t) => sum + t.amount, 0);

            const willExceed = prediction.predictedSpend > category.budget;

            let daysUntilExceed: number | undefined;
            if (willExceed && currentSpend < category.budget) {
                const dailyRate = currentSpend / currentDay;
                const remainingBudget = category.budget - currentSpend;
                daysUntilExceed = Math.ceil(remainingBudget / dailyRate);
            }

            forecasts.push({
                categoryName: category.name,
                currentSpend: Math.round(currentSpend),
                predictedMonthEnd: Math.round(prediction.predictedSpend),
                budgetLimit: category.budget,
                willExceed,
                exceedAmount: willExceed ? Math.round(prediction.predictedSpend - category.budget) : undefined,
                daysUntilExceed
            });
        });

        return forecasts.filter(f => f.willExceed);
    }

    /**
     * Detect anomalous transactions
     */
    static detectAnomalies(
        transactions: Transaction[],
        selectedMonth: string
    ): SpendingAnomaly[] {
        const anomalies: SpendingAnomaly[] = [];

        // Get transactions for the selected month
        const monthTransactions = transactions.filter(t =>
            t.date.startsWith(selectedMonth) && t.type === 'debit'
        );

        // Group by category
        const categoryGroups = new Map<string, Transaction[]>();
        monthTransactions.forEach(t => {
            if (!categoryGroups.has(t.category)) {
                categoryGroups.set(t.category, []);
            }
            categoryGroups.get(t.category)!.push(t);
        });

        // Detect anomalies in each category
        categoryGroups.forEach((txs, category) => {
            if (txs.length < 3) return; // Need at least 3 transactions for statistical analysis

            const amounts = txs.map(t => t.amount);
            const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);

            txs.forEach(tx => {
                const zScore = Math.abs((tx.amount - mean) / (stdDev || 1));

                // Z-score > 2 indicates anomaly (2 standard deviations)
                if (zScore > 2) {
                    const anomalyScore = Math.min(100, zScore * 30);
                    let reason = '';

                    if (tx.amount > mean * 2) {
                        reason = `Unusually high amount (${Math.round((tx.amount / mean - 1) * 100)}% above average)`;
                    } else if (tx.amount < mean / 2) {
                        reason = `Unusually low amount (${Math.round((1 - tx.amount / mean) * 100)}% below average)`;
                    }

                    anomalies.push({
                        transactionId: tx.id,
                        merchant: tx.merchant,
                        amount: tx.amount,
                        category: tx.category,
                        date: tx.date,
                        anomalyScore: Math.round(anomalyScore),
                        reason
                    });
                }
            });
        });

        return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
    }

    /**
     * Analyze spending patterns by day of week
     */
    static analyzeSpendingPatterns(
        transactions: Transaction[]
    ): SpendingPattern[] {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const patterns: SpendingPattern[] = [];

        const debitTransactions = transactions.filter(t => t.type === 'debit');

        dayNames.forEach((dayName, dayIndex) => {
            const dayTransactions = debitTransactions.filter(t => {
                const date = new Date(t.date);
                return date.getDay() === dayIndex;
            });

            if (dayTransactions.length === 0) return;

            const totalSpend = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
            const averageSpend = totalSpend / dayTransactions.length;

            // Find common categories
            const categoryCount = new Map<string, number>();
            dayTransactions.forEach(t => {
                categoryCount.set(t.category, (categoryCount.get(t.category) || 0) + 1);
            });

            const commonCategories = Array.from(categoryCount.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cat]) => cat);

            patterns.push({
                dayOfWeek: dayName,
                averageSpend: Math.round(averageSpend),
                commonCategories
            });
        });

        return patterns;
    }

    /**
     * Generate predictive insights
     */
    static generatePredictiveInsights(
        transactions: Transaction[],
        categories: Category[],
        selectedMonth: string
    ): PredictiveInsight[] {
        const insights: PredictiveInsight[] = [];
        const forecasts = this.forecastBudgetExceedance(transactions, categories, selectedMonth);
        const predictions = this.predictMonthlySpending(transactions, categories, selectedMonth);
        const anomalies = this.detectAnomalies(transactions, selectedMonth);

        // Budget exceedance warnings
        forecasts.forEach(forecast => {
            if (forecast.daysUntilExceed && forecast.daysUntilExceed <= 7) {
                insights.push({
                    type: 'warning',
                    title: `${forecast.categoryName} Budget Alert`,
                    message: `You'll likely exceed your budget in ${forecast.daysUntilExceed} days. Consider reducing spending by ₹${Math.round(forecast.exceedAmount! / forecast.daysUntilExceed)} per day.`,
                    priority: 'high',
                    actionable: `Reduce daily ${forecast.categoryName} spending`,
                    icon: '⚠️'
                });
            } else if (forecast.willExceed) {
                insights.push({
                    type: 'warning',
                    title: `${forecast.categoryName} Forecast`,
                    message: `Predicted to exceed budget by ₹${forecast.exceedAmount} this month.`,
                    priority: 'medium',
                    actionable: `Review ${forecast.categoryName} expenses`,
                    icon: '📊'
                });
            }
        });

        // Positive trends
        predictions.forEach(pred => {
            if (pred.trend === 'decreasing' && pred.trendPercentage > 10) {
                insights.push({
                    type: 'achievement',
                    title: `Great Progress on ${pred.categoryName}!`,
                    message: `You're spending ${Math.round(pred.trendPercentage)}% less than last month. Keep it up!`,
                    priority: 'low',
                    icon: '🎉'
                });
            } else if (pred.trend === 'increasing' && pred.trendPercentage > 20) {
                insights.push({
                    type: 'trend',
                    title: `${pred.categoryName} Spending Increasing`,
                    message: `Spending is up ${Math.round(pred.trendPercentage)}% compared to last month.`,
                    priority: 'medium',
                    icon: '📈'
                });
            }
        });

        // Anomaly alerts
        if (anomalies.length > 0) {
            const topAnomaly = anomalies[0];
            insights.push({
                type: 'warning',
                title: 'Unusual Transaction Detected',
                message: `₹${topAnomaly.amount} at ${topAnomaly.merchant} - ${topAnomaly.reason}`,
                priority: 'medium',
                icon: '🔍'
            });
        }

        // Savings suggestions
        const totalPredicted = predictions.reduce((sum, p) => sum + p.predictedSpend, 0);
        const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);
        const potentialSavings = totalBudget - totalPredicted;

        if (potentialSavings > 0) {
            insights.push({
                type: 'suggestion',
                title: 'Savings Opportunity',
                message: `You're on track to save ₹${Math.round(potentialSavings)} this month!`,
                priority: 'low',
                actionable: 'Set up a savings goal',
                icon: '💰'
            });
        }

        return insights.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    // Helper methods

    private static calculateWeightedPrediction(
        transactions: Transaction[],
        daysInMonth: number,
        daysElapsed: number
    ): number {
        // Give more weight to recent transactions
        const sortedTxs = [...transactions].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        let weightedSum = 0;
        let totalWeight = 0;

        sortedTxs.forEach((tx, index) => {
            const weight = 1 / (index + 1); // More recent = higher weight
            weightedSum += tx.amount * weight;
            totalWeight += weight;
        });

        const weightedAverage = weightedSum / totalWeight;
        const dailyRate = weightedAverage / (daysElapsed / transactions.length);

        return dailyRate * daysInMonth;
    }

    private static calculateTrendPrediction(
        transactions: Transaction[],
        daysInMonth: number,
        daysElapsed: number
    ): number {
        if (transactions.length < 2) {
            const total = transactions.reduce((sum, t) => sum + t.amount, 0);
            return (total / daysElapsed) * daysInMonth;
        }

        // Calculate spending trend (increasing/decreasing)
        const sortedTxs = [...transactions].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const firstHalf = sortedTxs.slice(0, Math.floor(sortedTxs.length / 2));
        const secondHalf = sortedTxs.slice(Math.floor(sortedTxs.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length;

        const trendFactor = secondHalfAvg / (firstHalfAvg || 1);
        const currentSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
        const dailyRate = (currentSpend / daysElapsed) * trendFactor;

        return dailyRate * daysInMonth;
    }

    private static calculateConfidence(
        transactions: Transaction[],
        daysElapsed: number
    ): number {
        // Confidence based on:
        // 1. Number of transactions
        // 2. Consistency of spending
        // 3. Days elapsed in month

        const txCount = transactions.length;
        const amounts = transactions.map(t => t.amount);
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;

        // More transactions = higher confidence
        const txConfidence = Math.min(100, (txCount / 10) * 100);

        // Lower variance = higher confidence
        const consistencyConfidence = Math.max(0, 100 - (coefficientOfVariation * 100));

        // More days elapsed = higher confidence
        const timeConfidence = Math.min(100, (daysElapsed / 15) * 100);

        return (txConfidence * 0.3 + consistencyConfidence * 0.4 + timeConfidence * 0.3);
    }

    private static getPreviousMonthSpend(
        transactions: Transaction[],
        categoryName: string,
        currentYear: number,
        currentMonth: number
    ): number {
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

        return transactions
            .filter(t =>
                t.category === categoryName &&
                t.type === 'debit' &&
                t.date.startsWith(prevMonthStr)
            )
            .reduce((sum, t) => sum + t.amount, 0);
    }

    private static calculateTrend(
        predictedSpend: number,
        previousMonthSpend: number
    ): { trend: 'increasing' | 'decreasing' | 'stable'; trendPercentage: number } {
        if (previousMonthSpend === 0) {
            return { trend: 'stable', trendPercentage: 0 };
        }

        const percentageChange = ((predictedSpend - previousMonthSpend) / previousMonthSpend) * 100;

        if (Math.abs(percentageChange) < 5) {
            return { trend: 'stable', trendPercentage: Math.abs(percentageChange) };
        } else if (percentageChange > 0) {
            return { trend: 'increasing', trendPercentage: percentageChange };
        } else {
            return { trend: 'decreasing', trendPercentage: Math.abs(percentageChange) };
        }
    }
}
