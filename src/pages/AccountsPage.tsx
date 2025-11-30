import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '../types';
import { AccountService } from '../services/accountService';
import { HapticService } from '../services/hapticService';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountsPageProps {
    onBack: () => void;
}

const AccountsPage: React.FC<AccountsPageProps> = ({ onBack }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [netWorth, setNetWorth] = useState(0);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const accs = await AccountService.getAccounts();
        setAccounts(accs);
        setNetWorth(AccountService.calculateNetWorth(accs));
    };

    const handleAddAccount = async (name: string, type: AccountType, balance: number) => {
        await AccountService.createAccount(name, type, balance);
        await loadAccounts();
        setShowAddModal(false);
        HapticService.success();
    };

    return (
        <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={onBack}
                        className="mr-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white"
                    >
                        ←
                    </button>
                    <h1 className="text-2xl font-bold text-white">Accounts</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500"
                >
                    + Add
                </button>
            </div>

            {/* Net Worth Card */}
            <div className="bg-gradient-to-br from-blue-900 to-gray-800 p-6 rounded-2xl mb-6 shadow-lg border border-blue-800/50">
                <p className="text-blue-200 text-sm font-medium mb-1">Total Net Worth</p>
                <h2 className="text-3xl font-bold text-white">₹{netWorth.toLocaleString()}</h2>
            </div>

            {/* Accounts List */}
            <div className="space-y-4">
                {accounts.map(acc => (
                    <motion.div
                        key={acc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800 p-4 rounded-xl flex items-center justify-between border border-gray-700"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gray-700/50">
                                {acc.icon}
                            </div>
                            <div>
                                <p className="text-white font-medium">{acc.name}</p>
                                <p className="text-gray-400 text-xs capitalize">{acc.type.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold text-lg ${acc.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                                ₹{acc.balance.toLocaleString()}
                            </p>
                        </div>
                    </motion.div>
                ))}

                {accounts.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>No accounts yet.</p>
                        <p className="text-sm">Add an account to start tracking.</p>
                    </div>
                )}
            </div>

            {/* Add Account Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddAccountModal
                        onClose={() => setShowAddModal(false)}
                        onAdd={handleAddAccount}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

interface AddAccountModalProps {
    onClose: () => void;
    onAdd: (name: string, type: AccountType, balance: number) => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>('bank');
    const [balance, setBalance] = useState('');

    const handleSubmit = () => {
        if (!name || !balance) return;
        onAdd(name, type, parseFloat(balance));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-gray-900 w-full max-w-lg rounded-t-3xl p-6 pb-12"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add Account</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Account Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. HDFC Bank"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['bank', 'cash', 'credit_card', 'wallet'] as AccountType[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`p-2 rounded-lg text-sm font-medium capitalize border ${type === t
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400'
                                        }`}
                                >
                                    {t.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Current Balance</label>
                        <input
                            type="number"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold mt-4"
                    >
                        Create Account
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AccountsPage;
