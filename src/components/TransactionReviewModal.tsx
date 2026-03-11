import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticService } from '../services/hapticService';

interface TransactionReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendingTransactions: Transaction[];
    categories: Category[];
    onApprove: (transaction: Transaction) => void;
}

export const TransactionReviewModal: React.FC<TransactionReviewModalProps> = ({
    isOpen,
    onClose,
    pendingTransactions,
    categories,
    onApprove
}) => {
    // Local state to track changes before saving
    const [editingTx, setEditingTx] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Local copy of pending transactions that we'll remove from as user approves
    const [localPending, setLocalPending] = useState<Transaction[]>([]);

    // Update local pending list when prop changes
    useEffect(() => {
        setLocalPending(pendingTransactions);
    }, [pendingTransactions]);

    // Auto-close when all transactions are approved
    useEffect(() => {
        let closeTimer: ReturnType<typeof setTimeout> | undefined;

        if (isOpen && localPending.length === 0 && pendingTransactions.length === 0) {
            closeTimer = setTimeout(() => {
                onClose();
            }, 300); // Small delay for smooth UX
        }

        return () => {
            if (closeTimer) {
                clearTimeout(closeTimer);
            }
        };
    }, [localPending.length, pendingTransactions.length, isOpen, onClose]);

    // Clear transient editing state whenever modal closes
    useEffect(() => {
        if (!isOpen) {
            setEditingTx(null);
            setSelectedCategory('');
        }
    }, [isOpen]);

    const handleApprove = (tx: Transaction) => {
        HapticService.success();

        // Determine final category
        const finalCategory = (editingTx === tx.id && selectedCategory) ? selectedCategory : tx.category;

        // Call parent's approve handler
        onApprove({ ...tx, category: finalCategory, isPending: false });

        // Remove from local list immediately for instant feedback
        setLocalPending(prev => prev.filter(t => t.id !== tx.id));

        // Reset edit state
        setEditingTx(null);
        setSelectedCategory('');
    };

    const startEditing = (tx: Transaction) => {
        setEditingTx(tx.id);
        setSelectedCategory(tx.category);
        HapticService.selectionChanged();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 backdrop-blur-sm">
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-gray-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto border-t border-gray-800"
                >
                    <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-900 z-10 pb-4 border-b border-gray-800">
                        <div>
                            <h2 className="text-xl font-bold text-white">Review Transactions</h2>
                            <p className="text-gray-400 text-sm">{localPending.length} transaction{localPending.length !== 1 ? 's' : ''} pending</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4 pb-20">
                        <AnimatePresence mode="popLayout">
                            {localPending.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10 text-gray-500"
                                >
                                    <div className="text-5xl mb-4">🎉</div>
                                    <p className="text-lg font-semibold">All caught up!</p>
                                    <p className="text-sm mt-2">No pending transactions to review.</p>
                                </motion.div>
                            ) : (
                                localPending.map((tx, index) => (
                                    <motion.div
                                        key={tx.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-gray-800 p-4 rounded-xl border border-gray-700"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-white font-semibold text-lg">{tx.merchant}</h3>
                                                <p className="text-gray-400 text-xs">
                                                    {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {tx.rawSms && (
                                                    <p className="text-gray-500 text-xs mt-1 truncate max-w-[200px]" title={tx.rawSms}>
                                                        {tx.rawSms}
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`text-lg font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                                                {tx.type === 'credit' ? '+' : ''}₹{tx.amount.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 items-center mt-4">
                                            <div className="flex-1">
                                                {editingTx === tx.id ? (
                                                    <select
                                                        value={selectedCategory}
                                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                                        className="w-full bg-gray-900 border border-blue-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        autoFocus
                                                    >
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => startEditing(tx)}
                                                        className="w-full text-left bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 flex justify-between items-center group hover:border-gray-600 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{categories.find(c => c.name === tx.category)?.icon || '🏷️'}</span>
                                                            <span className="text-sm text-gray-300">{tx.category}</span>
                                                        </div>
                                                        <span className="text-gray-500 text-xs group-hover:text-white transition-colors">Edit</span>
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleApprove(tx)}
                                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center justify-center min-w-[80px] h-[42px] transition-colors shadow-lg shadow-green-900/20 font-medium text-sm"
                                                aria-label="Approve"
                                            >
                                                {editingTx === tx.id ? 'Save' : '✓ Approve'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
