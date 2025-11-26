import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction, Category } from '../types';

interface CategoryTrendsProps {
    transactions: Transaction[];
    categories: Category[];
}

const CategoryTrends: React.FC<CategoryTrendsProps> = ({ transactions, categories }) => {
    const { data, topCategories } = useMemo(() => {
        // 1. Get last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toISOString().slice(0, 7)); // YYYY-MM
        }

        // 2. Calculate spending per category per month
        const spendingByCat: Record<string, number> = {};

        // Filter txs for last 6 months
        const relevantTxs = transactions.filter(t => months.includes(t.date.slice(0, 7)) && t.type === 'debit');

        // Find top categories
        relevantTxs.forEach(t => {
            spendingByCat[t.category] = (spendingByCat[t.category] || 0) + t.amount;
        });

        const topCats = Object.entries(spendingByCat)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3) // Top 3
            .map(([name]) => name);

        // 3. Prepare chart data
        const chartData = months.map(month => {
            const monthData: any = { month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }) };
            topCats.forEach(cat => {
                const amount = relevantTxs
                    .filter(t => t.date.startsWith(month) && t.category === cat)
                    .reduce((acc, t) => acc + t.amount, 0);
                monthData[cat] = amount;
            });
            return monthData;
        });

        return { data: chartData, topCategories: topCats };
    }, [transactions]);

    // Get colors for top categories
    const getCategoryColor = (catName: string) => {
        return categories.find(c => c.name === catName)?.color || '#8884d8';
    };

    if (topCategories.length === 0) return null;

    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-white font-semibold mb-4">Category Trends (6 Months)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Legend />
                        {topCategories.map((key) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={getCategoryColor(key)}
                                strokeWidth={3}
                                dot={{ r: 3 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CategoryTrends;
