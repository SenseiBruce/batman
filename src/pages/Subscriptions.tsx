import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { detectSubscriptions, Subscription } from '../services/subscriptionService';
import { getSubscriptions, setSubscriptions, updateSubscription, deleteSubscription, addSubscription } from '../services/subscriptionStorageService';
import { scheduleSubscriptionReminder } from '../utils/notify';

interface SubscriptionsProps {
    transactions: Transaction[];
}

const Subscriptions: React.FC<SubscriptionsProps> = ({ transactions }) => {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editMerchant, setEditMerchant] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editFreq, setEditFreq] = useState('');
    const [editNextDue, setEditNextDue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newMerchant, setNewMerchant] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newFreq, setNewFreq] = useState('30');
    const [newNextDue, setNewNextDue] = useState('');

    // Load persisted subscriptions on mount, fallback to detection
    useEffect(() => {
        const load = async () => {
            const stored = await getSubscriptions();
            if (stored.length > 0) {
                setSubs(stored);
            } else {
                const detected = detectSubscriptions(transactions);
                setSubs(detected);
                await setSubscriptions(detected);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions]);

    const startEdit = (sub: Subscription) => {
        setEditingId(sub.id);
        setEditMerchant(sub.merchant);
        setEditAmount(sub.amount.toString());
        setEditFreq(sub.frequencyDays.toString());
        setEditNextDue(sub.nextDueDate);
        setIsAdding(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        const amountNum = parseFloat(editAmount);
        const freqNum = parseInt(editFreq, 10);
        if (isNaN(amountNum) || isNaN(freqNum) || editMerchant.trim() === '' || editNextDue.trim() === '') {
            alert('Please fill all fields correctly');
            return;
        }
        const updated: Subscription = {
            id: editingId,
            merchant: editMerchant,
            amount: amountNum,
            frequencyDays: freqNum,
            lastPaymentDate: subs.find(s => s.id === editingId)?.lastPaymentDate || new Date().toISOString(),
            nextDueDate: editNextDue,
        };
        await updateSubscription(updated);
        setSubs(prev => prev.map(s => (s.id === editingId ? updated : s)));
        setEditingId(null);
        scheduleSubscriptionReminder(updated.merchant, updated.nextDueDate);
    };

    const startAdd = () => {
        setIsAdding(true);
        setNewMerchant('');
        setNewAmount('');
        setNewFreq('30');
        setNewNextDue(new Date().toISOString().split('T')[0]);
        setEditingId(null);
    };

    const cancelAdd = () => {
        setIsAdding(false);
    };

    const saveNew = async () => {
        const amountNum = parseFloat(newAmount);
        const freqNum = parseInt(newFreq, 10);
        if (isNaN(amountNum) || isNaN(freqNum) || newMerchant.trim() === '' || newNextDue.trim() === '') {
            alert('Please fill all fields correctly');
            return;
        }
        const newSub: Subscription = {
            id: Date.now().toString(),
            merchant: newMerchant,
            amount: amountNum,
            frequencyDays: freqNum,
            lastPaymentDate: new Date().toISOString(), // Placeholder
            nextDueDate: newNextDue,
        };
        await addSubscription(newSub);
        setSubs(prev => [...prev, newSub]);
        setIsAdding(false);
        scheduleSubscriptionReminder(newSub.merchant, newSub.nextDueDate);
    };

    const removeSub = async (id: string) => {
        if (!window.confirm('Delete this subscription?')) return;
        await deleteSubscription(id);
        setSubs(prev => prev.filter(s => s.id !== id));
    };

    const refresh = async () => {
        const detected = detectSubscriptions(transactions);
        setSubs(detected);
        await setSubscriptions(detected);
    };

    return (
        <div className="p-4 pb-24">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Subscriptions</h2>
                <button
                    onClick={startAdd}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium"
                >
                    + Add
                </button>
            </div>

            {isAdding && (
                <div className="bg-gray-800 p-4 rounded-xl border border-blue-500 mb-4 animate-fade-in">
                    <h3 className="text-white font-medium mb-2">New Subscription</h3>
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newMerchant}
                            onChange={e => setNewMerchant(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                            placeholder="Merchant Name"
                        />
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={newAmount}
                                onChange={e => setNewAmount(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                placeholder="Amount (₹)"
                            />
                            <input
                                type="number"
                                value={newFreq}
                                onChange={e => setNewFreq(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                placeholder="Freq (days)"
                            />
                        </div>
                        <input
                            type="date"
                            value={newNextDue}
                            onChange={e => setNewNextDue(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                        />
                        <div className="flex gap-2 mt-2">
                            <button onClick={saveNew} className="flex-1 py-1 bg-green-600 hover:bg-green-500 text-white rounded">
                                Save
                            </button>
                            <button onClick={cancelAdd} className="flex-1 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {subs.length === 0 && !isAdding ? (
                <div className="p-4 text-gray-300 text-center">
                    <p>No subscriptions found.</p>
                    <button
                        onClick={refresh}
                        className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                    >
                        Auto-Detect from SMS
                    </button>
                </div>
            ) : (
                <ul className="space-y-3">
                    {subs.map(sub => (
                        <li key={sub.id} className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                            {editingId === sub.id ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={editMerchant}
                                        onChange={e => setEditMerchant(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                        placeholder="Merchant"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={editAmount}
                                            onChange={e => setEditAmount(e.target.value)}
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                            placeholder="Amount"
                                        />
                                        <input
                                            type="number"
                                            value={editFreq}
                                            onChange={e => setEditFreq(e.target.value)}
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                            placeholder="Freq (days)"
                                        />
                                    </div>
                                    <input
                                        type="date"
                                        value={editNextDue}
                                        onChange={e => setEditNextDue(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={saveEdit} className="flex-1 py-1 bg-green-600 hover:bg-green-500 text-white rounded">
                                            Save
                                        </button>
                                        <button onClick={cancelEdit} className="flex-1 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-medium">{sub.merchant}</p>
                                        <p className="text-gray-400 text-sm">₹{sub.amount.toLocaleString()} • every {sub.frequencyDays} days</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-300 text-sm">Next due</p>
                                        <p className="text-white font-medium">{new Date(sub.nextDueDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2 ml-2">
                                        <button onClick={() => startEdit(sub)} className="text-blue-400 hover:text-blue-300 p-1">
                                            ✏️
                                        </button>
                                        <button onClick={() => removeSub(sub.id)} className="text-red-400 hover:text-red-300 p-1">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {subs.length > 0 && !isAdding && (
                <div className="mt-6 text-center">
                    <button
                        onClick={refresh}
                        className="text-xs text-gray-500 hover:text-gray-300 underline"
                    >
                        Re-scan SMS for Subscriptions
                    </button>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
