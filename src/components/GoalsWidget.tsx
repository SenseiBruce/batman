import React, { useState } from 'react';
import { Goal } from '../types';
import { AnimatedNumber, AnimatedProgressBar } from './AnimatedNumber';
import { HapticService } from '../services/hapticService';
import { useCurrency } from '../contexts/CurrencyContext';

interface GoalsWidgetProps {
    goals: Goal[];
    onAddGoal: (goal: Goal) => void;
    onUpdateGoal: (goal: Goal) => void;
    onDeleteGoal: (id: string) => void;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
    const { currencySymbol, formatAmount } = useCurrency();
    const [isAdding, setIsAdding] = useState(false);
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');

    const handleAdd = () => {
        if (!newGoalName || !newGoalTarget) return;

        const goal: Goal = {
            id: `goal-${Date.now()}`,
            name: newGoalName,
            targetAmount: parseFloat(newGoalTarget),
            savedAmount: 0,
            icon: '🎯',
            color: 'bg-blue-500',
            isCompleted: false
        };

        onAddGoal(goal);
        setNewGoalName('');
        setNewGoalTarget('');
        setIsAdding(false);
        HapticService.success();
    };

    const handleAddSavings = (goal: Goal) => {
        const amount = prompt(`Add savings to ${goal.name}:`);
        if (amount) {
            const val = parseFloat(amount);
            if (!isNaN(val)) {
                const updated = { ...goal, savedAmount: goal.savedAmount + val };
                if (updated.savedAmount >= updated.targetAmount && !goal.isCompleted) {
                    updated.isCompleted = true;
                    HapticService.success();
                    alert(`🎉 Goal '${goal.name}' Completed!`);
                }
                onUpdateGoal(updated);
                HapticService.medium();
            }
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-lg font-semibold text-white">Savings Goals</h3>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        HapticService.light();
                    }}
                    className="text-blue-400 text-sm font-medium"
                >
                    {isAdding ? 'Cancel' : '+ Add Goal'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="Goal Name (e.g. New Phone)"
                        className="w-full bg-gray-700 text-white rounded-lg p-3 mb-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={newGoalName}
                        onChange={e => setNewGoalName(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder={`Target Amount (${currencySymbol})`}
                        className="w-full bg-gray-700 text-white rounded-lg p-3 mb-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={newGoalTarget}
                        onChange={e => setNewGoalTarget(e.target.value)}
                    />
                    <button
                        onClick={handleAdd}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        Create Goal
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {goals.length === 0 && !isAdding ? (
                    <div className="text-center py-8 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                        <p className="text-gray-400 text-sm">No goals set yet.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mt-2 text-blue-400 text-sm"
                        >
                            Create your first goal
                        </button>
                    </div>
                ) : (
                    goals.map(goal => (
                        <div
                            key={goal.id}
                            className="bg-gray-800 rounded-xl p-4 border border-gray-700 relative overflow-hidden"
                            onClick={() => handleAddSavings(goal)}
                        >
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                                        {goal.isCompleted ? '🏆' : goal.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{goal.name}</h4>
                                        <p className="text-xs text-gray-400">
                                            <AnimatedNumber value={goal.savedAmount} prefix={currencySymbol} /> / {formatAmount(goal.targetAmount)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">
                                        <AnimatedNumber value={(goal.savedAmount / goal.targetAmount) * 100} decimals={0} suffix="%" />
                                    </p>
                                </div>
                            </div>

                            <AnimatedProgressBar
                                percentage={(goal.savedAmount / goal.targetAmount) * 100}
                                color={goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'}
                            />

                            {goal.isCompleted && (
                                <div className="absolute top-0 right-0 p-1 bg-green-500/20 rounded-bl-xl border-b border-l border-green-500/30">
                                    <span className="text-[10px] font-bold text-green-400 px-1">COMPLETED</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
