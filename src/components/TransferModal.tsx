import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import { AccountService } from '../services/accountService';
import { motion } from 'framer-motion';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (sourceId: string, destId: string, amount: number, date: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
    isOpen,
    onClose,
    onTransfer
}) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [sourceId, setSourceId] = useState('');
    const [destId, setDestId] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        if (isOpen) {
            loadAccounts();
        }
    }, [isOpen]);

    const loadAccounts = async () => {
        const accs = await AccountService.getAccounts();
        setAccounts(accs);
        if (accs.length > 0) {
            setSourceId(accs[0].id);
            if (accs.length > 1) setDestId(accs[1].id);
        }
    };

    const handleSubmit = () => {
        if (!sourceId || !destId || !amount) return;
        if (sourceId === destId) {
            alert('Source and destination accounts must be different');
            return;
        }
        onTransfer(sourceId, destId, parseFloat(amount), date);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800 rounded-2xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Transfer Funds</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-4">
                    {/* From Account */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">From</label>
                        <select
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.icon} {acc.name} (₹{acc.balance})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex justify-center -my-2 relative z-10">
                        <div className="bg-gray-700 rounded-full p-1 border-4 border-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                        </div>
                    </div>

                    {/* To Account */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">To</label>
                        <select
                            value={destId}
                            onChange={(e) => setDestId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id} disabled={acc.id === sourceId}>
                                    {acc.icon} {acc.name} (₹{acc.balance})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-8 pr-4 text-white font-bold text-lg focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold mt-2"
                    >
                        Transfer Now
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
