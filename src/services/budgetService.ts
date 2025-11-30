import { Category, Transaction, BudgetConfig } from '../types';

/**
 * Service for handling advanced budgeting logic
 */
export class BudgetService {

    /**
     * Calculate effective budget including rollover
     */
    static getEffectiveBudget(category: Category): number {
        const baseBudget = category.budget;
        const rollover = category.rolloverAmount || 0;
        return baseBudget + rollover;
    }

    /**
     * Calculate spending for a specific category in a given period
     */
    static calculateSpent(
        category: Category,
        transactions: Transaction[],
        periodStart: Date,
        periodEnd: Date
    ): number {
        return transactions
            .filter(t => {
                const txDate = new Date(t.date);
                return (
                    t.category === category.name &&
                    t.type === 'debit' &&
                    txDate >= periodStart &&
                    txDate <= periodEnd
                );
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    /**
     * Calculate rollover amount for the next period
     */
    static calculateRollover(
        category: Category,
        spent: number
    ): number {
        if (!category.budgetConfig?.rollover) return 0;

        const effectiveBudget = this.getEffectiveBudget(category);
        const remaining = effectiveBudget - spent;

        // Carry forward positive (savings) or negative (overspending)
        return remaining;
    }

    /**
     * Get date range for the current budget period
     */
    static getBudgetPeriod(config?: BudgetConfig): { start: Date; end: Date } {
        const now = new Date();
        const period = config?.period || 'monthly';

        const start = new Date(now);
        const end = new Date(now);

        switch (period) {
            case 'weekly':
                // Start of week (Monday)
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);

                // End of week (Sunday)
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;

            case 'yearly':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);

                end.setMonth(11, 31);
                end.setHours(23, 59, 59, 999);
                break;

            case 'monthly':
            default:
                start.setDate(1);
                start.setHours(0, 0, 0, 0);

                end.setMonth(start.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
        }

        return { start, end };
    }

    /**
     * Calculate "Safe to Spend" per day
     */
    static getDailySafeSpend(
        category: Category,
        spent: number
    ): number {
        const { end } = this.getBudgetPeriod(category.budgetConfig);
        const now = new Date();

        // Calculate days remaining (including today)
        const diffTime = Math.abs(end.getTime() - now.getTime());
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 0) return 0;

        const effectiveBudget = this.getEffectiveBudget(category);
        const remaining = effectiveBudget - spent;

        return Math.max(0, remaining / daysRemaining);
    }

    /**
     * Check if budget alert should be triggered
     */
    static shouldTriggerAlert(
        category: Category,
        spent: number
    ): boolean {
        if (!category.budgetConfig?.alerts.enabled) return false;

        const effectiveBudget = this.getEffectiveBudget(category);
        const threshold = category.budgetConfig.alerts.threshold || 80;
        const percentage = (spent / effectiveBudget) * 100;

        return percentage >= threshold;
    }

    /**
     * Get default budget config
     */
    static getDefaultConfig(): BudgetConfig {
        return {
            period: 'monthly',
            rollover: false,
            alerts: {
                enabled: true,
                threshold: 80
            }
        };
    }
}
