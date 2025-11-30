import React, { useState } from 'react';
import { Category, BudgetConfig } from '../types';
import { BudgetService } from '../services/budgetService';
import { HapticService } from '../services/hapticService';
import { motion, AnimatePresence } from 'framer-motion';

interface BudgetSettingsPageProps {
    categories: Category[];
    onUpdateCategory: (category: Category) => void;
    onBack: () => void;
}

const BudgetSettingsPage: React.FC<BudgetSettingsPageProps> = ({
    categories,
    onUpdateCategory,
    onBack
}) => {
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    return (
        <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen bg-gray-900">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={onBack}
                    className="mr-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white"
                >
                    ←
                </button>
                <h1 className="text-2xl font-bold text-white">Budget Settings</h1>
            </div>

            <div className="space-y-4">
                {categories.map(category => (
                    <motion.button
                        key={category.id}
                        onClick={() => {
                            setSelectedCategory(category);
                            HapticService.selectionChanged();
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gray-800 p-4 rounded-xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{category.icon}</span>
                            <div className="text-left">
                                <p className="text-white font-medium">{category.name}</p>
                                <p className="text-gray-400 text-sm">
                                    ₹{category.budget.toLocaleString()} • {category.budgetConfig?.period || 'Monthly'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {category.budgetConfig?.rollover && (
                                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                                    Rollover
                                </span>
                            )}
                            <span className="text-gray-500">›</span>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Configuration Modal */}
            <AnimatePresence>
                {selectedCategory && (
                    <BudgetConfigModal
                        category={selectedCategory}
                        onClose={() => setSelectedCategory(null)}
                        onSave={(updated) => {
                            onUpdateCategory(updated);
                            setSelectedCategory(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

interface BudgetConfigModalProps {
    category: Category;
    onClose: () => void;
    onSave: (category: Category) => void;
}

const BudgetConfigModal: React.FC<BudgetConfigModalProps> = ({
    category,
    onClose,
    onSave
}) => {
    const [budget, setBudget] = useState(category.budget.toString());
    const [config, setConfig] = useState<BudgetConfig>(
        category.budgetConfig || BudgetService.getDefaultConfig()
    );

    const handleSave = () => {
        onSave({
            ...category,
            budget: parseFloat(budget) || 0,
            budgetConfig: config
        });
        HapticService.success();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-gray-900 w-full max-w-lg rounded-t-3xl p-6 pb-24 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name} Budget
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-6">
                    {/* Budget Amount */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Budget Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-bold focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Period Selection */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Budget Period</label>
                        <div className="flex bg-gray-800 p-1 rounded-xl">
                            {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setConfig({ ...config, period: p })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${config.period === p
                                        ? 'bg-gray-700 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rollover Toggle */}
                    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl">
                        <div>
                            <p className="text-white font-medium">Rollover Budget</p>
                            <p className="text-gray-400 text-xs mt-1">
                                Carry forward unspent amount to next period
                            </p>
                        </div>
                        <button
                            onClick={() => setConfig({ ...config, rollover: !config.rollover })}
                            className={`w-12 h-7 rounded-full transition-colors relative ${config.rollover ? 'bg-blue-600' : 'bg-gray-600'
                                }`}
                        >
                            <div
                                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${config.rollover ? 'left-6' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Alerts Config */}
                    <div className="bg-gray-800 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Spending Alerts</p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Get notified when nearing limit
                                </p>
                            </div>
                            <button
                                onClick={() => setConfig({
                                    ...config,
                                    alerts: { ...config.alerts, enabled: !config.alerts.enabled }
                                })}
                                className={`w-12 h-7 rounded-full transition-colors relative ${config.alerts.enabled ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${config.alerts.enabled ? 'left-6' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {config.alerts.enabled && (
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Alert Threshold</span>
                                    <span className="text-white font-bold">{config.alerts.threshold}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    step="5"
                                    value={config.alerts.threshold}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        alerts: { ...config.alerts, threshold: parseInt(e.target.value) }
                                    })}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg"
                    >
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default BudgetSettingsPage;
