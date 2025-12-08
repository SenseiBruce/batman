import React, { useState, useRef } from 'react';
import { Transaction, Category } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import html2canvas from 'html2canvas';
import { HapticService } from '../services/hapticService';

interface CustomReportsProps {
    transactions: Transaction[];
    categories: Category[];
    onBack: () => void;
}

type ChartType = 'line' | 'bar' | 'pie';
type GroupBy = 'day' | 'week' | 'month';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

const CustomReports: React.FC<CustomReportsProps> = ({ transactions, categories, onBack }) => {
    const reportRef = useRef<HTMLDivElement>(null);

    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [groupBy, setGroupBy] = useState<GroupBy>('day');
    const [showTable, setShowTable] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const filteredTransactions = transactions.filter(t => {
        const txDate = new Date(t.date).toISOString().split('T')[0];
        const dateInRange = txDate >= startDate && txDate <= endDate;
        const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(t.category);
        return dateInRange && categoryMatch && t.type === 'debit';
    });

    const toggleCategory = (categoryName: string) => {
        HapticService.light();
        setSelectedCategories(prev =>
            prev.includes(categoryName) ? prev.filter(c => c !== categoryName) : [...prev, categoryName]
        );
    };

    const getChartData = () => {
        if (chartType === 'pie') {
            const categoryTotals: { [key: string]: number } = {};
            filteredTransactions.forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });
            return Object.entries(categoryTotals).map(([name, value]) => ({ name, value: Math.round(value) }));
        }

        const grouped: { [key: string]: number } = {};
        filteredTransactions.forEach(t => {
            const date = new Date(t.date);
            let key: string;

            if (groupBy === 'day') {
                key = date.toISOString().split('T')[0];
            } else if (groupBy === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else {
                key = date.toISOString().slice(0, 7);
            }

            grouped[key] = (grouped[key] || 0) + t.amount;
        });

        return Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, amount]) => ({
                date: formatDateLabel(date),
                amount: Math.round(amount)
            }));
    };

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        if (groupBy === 'month') {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (groupBy === 'week') {
            return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const chartData = getChartData();
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    const captureReport = async () => {
        if (!reportRef.current) return null;
        const canvas = await html2canvas(reportRef.current, { backgroundColor: '#111827', scale: 2 });
        return canvas.toDataURL('image/png');
    };

    const handleSaveToDevice = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        setShowExportModal(false);
        HapticService.medium();

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const base64 = await captureReport();
            if (!base64) throw new Error('Failed to capture');

            const fileName = `expense-report-${startDate}-to-${endDate}.png`;
            await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });

            alert(`Report saved to Documents/${fileName}`);
            HapticService.success();
        } catch (e) {
            console.error('Error:', e);
            alert('Failed to save report');
            HapticService.error();
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        setShowExportModal(false);
        HapticService.medium();

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const base64 = await captureReport();
            if (!base64) throw new Error('Failed to capture');

            const fileName = `report-${Date.now()}.png`;
            const result = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });

            await Share.share({
                title: 'Expense Report',
                text: `Report from ${startDate} to ${endDate}`,
                url: result.uri,
                dialogTitle: 'Share Report',
            });

            HapticService.success();
        } catch (e) {
            console.error('Error:', e);
            alert('Failed to share');
            HapticService.error();
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen pb-24 bg-gray-900 text-white max-w-md mx-auto">
            <div ref={reportRef} className="p-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold">Custom Reports</h1>
                    </div>
                    <button
                        onClick={() => { setShowExportModal(true); HapticService.light(); }}
                        disabled={isDownloading}
                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:bg-gray-700"
                    >
                        {isDownloading ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        )}
                    </button>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
                    <h2 className="text-lg font-semibold mb-4">Report Parameters</h2>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">From</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">To</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2">Categories (all if none selected)</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button key={cat.id} onClick={() => toggleCategory(cat.name)}
                                    className={`px-3 py-1 rounded-lg text-sm transition-all ${selectedCategories.includes(cat.name) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}>
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Chart Type</label>
                            <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="pie">Pie Chart</option>
                            </select>
                        </div>
                        {chartType !== 'pie' && (
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Group By</label>
                                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                                    <option value="day">Daily</option>
                                    <option value="week">Weekly</option>
                                    <option value="month">Monthly</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-100">Total in Period</p>
                    <p className="text-3xl font-bold">₹{totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-blue-100 mt-1">{filteredTransactions.length} transactions</p>
                </div>

                {chartData.length > 0 ? (
                    <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Visualization</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            {chartType === 'bar' ? (
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#e5e7eb' }} />
                                    <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            ) : chartType === 'line' ? (
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#e5e7eb' }} />
                                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                                </LineChart>
                            ) : (
                                <PieChart>
                                    <Pie data={chartData} cx="50%" cy="50%" labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100} fill="#8884d8" dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                                </PieChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl p-8 mb-6 border border-gray-700 text-center">
                        <p className="text-gray-400">No data available for selected parameters</p>
                    </div>
                )}

                <button onClick={() => { setShowTable(!showTable); HapticService.light(); }}
                    className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 mb-4 flex items-center justify-between transition-colors">
                    <span className="font-medium">Transaction Details</span>
                    <svg className={`w-5 h-5 transition-transform ${showTable ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showTable && filteredTransactions.length > 0 && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Merchant</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Category</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-300">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-700/50">
                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-200">{tx.merchant}</td>
                                            <td className="px-4 py-3 text-sm"><span className="text-gray-400">{tx.category}</span></td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-white">₹{tx.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showExportModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Export Report</h3>

                        <div className="space-y-3">
                            <button onClick={handleSaveToDevice}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-4 rounded-xl flex items-center gap-3 transition-all">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold">Save to Device</p>
                                    <p className="text-xs text-blue-100">Save in Documents folder</p>
                                </div>
                            </button>

                            <button onClick={handleShare}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-xl flex items-center gap-3 transition-all">
                                <div className="bg-white/10 p-2 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold">Share</p>
                                    <p className="text-xs text-gray-400">Share via apps</p>
                                </div>
                            </button>

                            <button onClick={() => { setShowExportModal(false); HapticService.light(); }}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-gray-300 p-3 rounded-xl transition-all mt-4">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomReports;
