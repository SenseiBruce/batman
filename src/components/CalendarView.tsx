import React, { useState } from 'react';
import { Transaction } from '../types';
import { HapticService } from '../services/hapticService';

interface CalendarViewProps {
    transactions: Transaction[];
    selectedMonth: string; // YYYY-MM
    onSelectDate: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ transactions, selectedMonth, onSelectDate }) => {
    const [year, month] = selectedMonth.split('-').map(Number);

    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const getDailyTotal = (day: number) => {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
        return transactions
            .filter(t => t.date.startsWith(dateStr) && t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const hasTransactions = (day: number) => {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
        return transactions.some(t => t.date.startsWith(dateStr));
    };

    return (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map(i => (
                    <div key={`blank-${i}`} className="aspect-square" />
                ))}
                {days.map(day => {
                    const total = getDailyTotal(day);
                    const hasTx = hasTransactions(day);

                    // Intensity based on spending (simple logic: >0, >1000, >5000)
                    let bgClass = 'bg-gray-700/30';
                    if (total > 5000) bgClass = 'bg-red-500/40 border-red-500/50';
                    else if (total > 1000) bgClass = 'bg-orange-500/40 border-orange-500/50';
                    else if (total > 0) bgClass = 'bg-blue-500/40 border-blue-500/50';

                    return (
                        <button
                            key={day}
                            onClick={() => {
                                HapticService.selectionChanged();
                                onSelectDate(`${selectedMonth}-${String(day).padStart(2, '0')}`);
                            }}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center relative border border-transparent transition-all active:scale-95 ${bgClass} ${hasTx ? 'hover:bg-gray-600' : ''}`}
                        >
                            <span className={`text-xs font-medium ${hasTx ? 'text-white' : 'text-gray-500'}`}>
                                {day}
                            </span>
                            {total > 0 && (
                                <span className="text-[8px] text-gray-300 mt-0.5">
                                    {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
