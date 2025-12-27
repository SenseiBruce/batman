import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, Category } from '../types';
import { PredictionService, PredictiveInsight, BudgetForecast, SpendingAnomaly } from '../services/predictionService';
import { useCurrency } from '../contexts/CurrencyContext';

interface PredictionsCardProps {
    transactions: Transaction[];
    categories: Category[];
    selectedMonth: string;
}

export const PredictionsCard: React.FC<PredictionsCardProps> = ({
    transactions,
    categories,
    selectedMonth
}) => {
    const { formatAmount } = useCurrency();
    const [activeTab, setActiveTab] = useState<'insights' | 'forecasts' | 'anomalies'>('insights');

    const insights = PredictionService.generatePredictiveInsights(transactions, categories, selectedMonth);
    const forecasts = PredictionService.forecastBudgetExceedance(transactions, categories, selectedMonth);
    const anomalies = PredictionService.detectAnomalies(transactions, selectedMonth);
    const predictions = PredictionService.predictMonthlySpending(transactions, categories, selectedMonth);

    const now = new Date();
    const isCurrentMonth = selectedMonth === now.toISOString().slice(0, 7);

    if (!isCurrentMonth) {
        return null; // Only show predictions for current month
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-orange-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'warning': return 'text-red-400';
            case 'suggestion': return 'text-blue-400';
            case 'achievement': return 'text-green-400';
            case 'trend': return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 mb-6 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔮</span>
                    <h3 className="text-white font-bold text-lg">AI Predictions</h3>
                </div>
                <p className="text-purple-100 text-xs">ML-powered insights and forecasts</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700 bg-gray-800/50">
                <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 min-w-0 py-3 px-1 sm:px-3 text-xs sm:text-sm font-medium transition-all ${activeTab === 'insights'
                        ? 'text-white border-b-2 border-purple-500 bg-gray-700/50'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2">
                        <span className="text-base">💡</span>
                        <span className="hidden sm:inline">Insights</span>
                        {insights.length > 0 && (
                            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full mt-0.5 sm:mt-0">
                                {insights.length}
                            </span>
                        )}
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('forecasts')}
                    className={`flex-1 min-w-0 py-3 px-1 sm:px-3 text-xs sm:text-sm font-medium transition-all ${activeTab === 'forecasts'
                        ? 'text-white border-b-2 border-purple-500 bg-gray-700/50'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2">
                        <span className="text-base">📊</span>
                        <span className="hidden sm:inline">Forecasts</span>
                        {forecasts.length > 0 && (
                            <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full mt-0.5 sm:mt-0">
                                {forecasts.length}
                            </span>
                        )}
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('anomalies')}
                    className={`flex-1 min-w-0 py-3 px-1 sm:px-3 text-xs sm:text-sm font-medium transition-all ${activeTab === 'anomalies'
                        ? 'text-white border-b-2 border-purple-500 bg-gray-700/50'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2">
                        <span className="text-base">🔍</span>
                        <span className="hidden sm:inline">Anomalies</span>
                        {anomalies.length > 0 && (
                            <span className="bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded-full mt-0.5 sm:mt-0">
                                {anomalies.length}
                            </span>
                        )}
                    </div>
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    {/* Insights Tab */}
                    {activeTab === 'insights' && (
                        <motion.div
                            key="insights"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-3"
                        >
                            {insights.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="text-4xl mb-2 block">✨</span>
                                    <p>No insights available yet</p>
                                    <p className="text-xs mt-1">Keep tracking to get predictions</p>
                                </div>
                            ) : (
                                insights.map((insight, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-gray-700/30 rounded-xl p-3 border border-gray-700 hover:border-gray-600 transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">{insight.icon}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`font-semibold text-sm ${getTypeColor(insight.type)}`}>
                                                        {insight.title}
                                                    </h4>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(insight.priority)} text-white`}>
                                                        {insight.priority}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 text-xs mb-2">{insight.message}</p>
                                                {insight.actionable && (
                                                    <div className="flex items-center gap-1 text-xs text-purple-400">
                                                        <span>💡</span>
                                                        <span>{insight.actionable}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Forecasts Tab */}
                    {activeTab === 'forecasts' && (
                        <motion.div
                            key="forecasts"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-3"
                        >
                            {forecasts.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="text-4xl mb-2 block">🎯</span>
                                    <p>All budgets on track!</p>
                                    <p className="text-xs mt-1">No exceedance predicted</p>
                                </div>
                            ) : (
                                forecasts.map((forecast, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-red-900/20 rounded-xl p-3 border border-red-700/50"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-semibold text-white text-sm">{forecast.categoryName}</h4>
                                                <p className="text-xs text-gray-400">Budget Forecast</p>
                                            </div>
                                            <span className="text-2xl">⚠️</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div className="bg-gray-800/50 rounded-lg p-2">
                                                <p className="text-xs text-gray-400">Current</p>
                                                <p className="text-white font-semibold">{formatAmount(forecast.currentSpend)}</p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-2">
                                                <p className="text-xs text-gray-400">Predicted</p>
                                                <p className="text-red-400 font-semibold">{formatAmount(forecast.predictedMonthEnd)}</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-800/50 rounded-lg p-2 mb-2">
                                            <p className="text-xs text-gray-400 mb-1">Budget Limit</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-white font-semibold">{formatAmount(forecast.budgetLimit)}</p>
                                                <p className="text-red-400 text-xs">
                                                    Exceed by {formatAmount(forecast.exceedAmount || 0)}
                                                </p>
                                            </div>
                                        </div>

                                        {forecast.daysUntilExceed && (
                                            <div className="bg-red-900/30 rounded-lg p-2 flex items-center gap-2">
                                                <span className="text-lg">⏰</span>
                                                <p className="text-xs text-red-300">
                                                    Budget will be exceeded in approximately <strong>{forecast.daysUntilExceed} days</strong>
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}

                            {/* Prediction Summary */}
                            {predictions.length > 0 && (
                                <div className="mt-4 bg-gray-700/30 rounded-xl p-3 border border-gray-700">
                                    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                                        <span>📈</span>
                                        <span>Category Predictions</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {predictions.slice(0, 5).map((pred, index) => (
                                            <div key={index} className="flex items-center justify-between text-xs">
                                                <span className="text-gray-300">{pred.categoryName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium">
                                                        {formatAmount(pred.predictedSpend)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full ${pred.trend === 'increasing' ? 'bg-red-900/50 text-red-300' :
                                                        pred.trend === 'decreasing' ? 'bg-green-900/50 text-green-300' :
                                                            'bg-gray-700 text-gray-300'
                                                        }`}>
                                                        {pred.trend === 'increasing' ? '↗' : pred.trend === 'decreasing' ? '↘' : '→'}
                                                        {Math.round(pred.trendPercentage)}%
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {pred.confidence}% conf
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Anomalies Tab */}
                    {activeTab === 'anomalies' && (
                        <motion.div
                            key="anomalies"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-3"
                        >
                            {anomalies.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="text-4xl mb-2 block">✅</span>
                                    <p>No unusual transactions detected</p>
                                    <p className="text-xs mt-1">All spending looks normal</p>
                                </div>
                            ) : (
                                anomalies.slice(0, 10).map((anomaly, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-orange-900/20 rounded-xl p-3 border border-orange-700/50"
                                    >
                                        <div className="flex flex-col gap-2 mb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-white text-sm truncate">{anomaly.merchant}</h4>
                                                    <p className="text-xs text-gray-400">{anomaly.category}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    <p className="text-orange-400 font-bold text-sm whitespace-nowrap">{formatAmount(anomaly.amount)}</p>
                                                    <p className="text-xs text-gray-500 whitespace-nowrap">
                                                        {new Date(anomaly.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-600 text-white whitespace-nowrap">
                                                    {anomaly.anomalyScore}% unusual
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-2 flex items-start gap-2">
                                            <span className="text-lg flex-shrink-0">🔍</span>
                                            <p className="text-xs text-orange-300 break-words">{anomaly.reason}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
