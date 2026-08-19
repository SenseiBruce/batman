import React, { useState } from 'react';
import { Category, Transaction } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface CategoryTransactionsModalProps {
  isOpen: boolean;
  category: Category | null;
  transactions: Transaction[];
  categories: Category[];
  formatAmount: (amount: number) => string;
  onClose: () => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  isOpen,
  category,
  transactions,
  categories,
  formatAmount,
  onClose,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState('');
  const [editingAmount, setEditingAmount] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const handleClose = () => {
    setEditingTransactionId(null);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 no-capture animate-in fade-in">
        <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 border border-gray-700 shadow-2xl overflow-y-auto max-h-[80vh]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{category.name} Expenses</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>
          {transactions.length === 0 ? (
            <p className="text-gray-400">No transactions for this category.</p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((tx) => {
                const isEditing = editingTransactionId === tx.id;

                const handleStartEdit = () => {
                  setEditingTransactionId(tx.id);
                  setEditingCategory(tx.category);
                  setEditingAmount(tx.amount.toString());
                };

                const handleSaveTransaction = () => {
                  const newAmount = parseFloat(editingAmount);
                  if (isNaN(newAmount) || newAmount < 0) {
                    alert('Please enter a valid amount');
                    return;
                  }
                  if (onUpdateTransaction && (editingCategory !== tx.category || newAmount !== tx.amount)) {
                    onUpdateTransaction({ ...tx, category: editingCategory, amount: newAmount });
                  }
                  setEditingTransactionId(null);
                };

                return (
                  <li key={tx.id} className="bg-gray-700/30 p-3 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</span>
                          {!isEditing && <span className="font-medium text-white">{formatAmount(tx.amount)}</span>}
                        </div>
                        <p className="text-sm text-gray-200">{tx.merchant}</p>
                        {isEditing && (
                          <div className="mt-2 space-y-2">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Amount</label>
                              <input
                                type="number"
                                value={editingAmount}
                                onChange={(e) => setEditingAmount(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Category</label>
                              <select
                                value={editingCategory}
                                onChange={(e) => setEditingCategory(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleSaveTransaction}
                                className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(tx.id)}
                                className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTransactionId(null);
                                  setEditingCategory('');
                                  setEditingAmount('');
                                }}
                                className="flex-1 py-1 px-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={handleStartEdit}
                          className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                          title="Edit transaction"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmVariant="danger"
        confirmText="Delete"
        onConfirm={() => {
          if (confirmDeleteId && onDeleteTransaction) {
            onDeleteTransaction(confirmDeleteId);
          }
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </>
  );
};
