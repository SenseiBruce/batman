import React, { useState, useEffect } from 'react';
import { SplitExpense, Friend } from '../types';
import { SplitStorageService } from '../services/splitStorageService';
import { SplitService } from '../services/splitService';
import { motion } from 'framer-motion';
import { HapticService } from '../services/hapticService';

interface SplitBillPageProps {
    onCreateSplit: () => void;
}

const SplitBillPage: React.FC<SplitBillPageProps> = ({ onCreateSplit }) => {
    const [splits, setSplits] = useState<SplitExpense[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [activeTab, setActiveTab] = useState<'splits' | 'friends'>('splits');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [splitsData, friendsData] = await Promise.all([
                SplitStorageService.getSplitExpenses(),
                SplitStorageService.getFriends()
            ]);
            setSplits(splitsData);
            setFriends(friendsData);
        } catch (error) {
            console.error('Failed to load split data:', error);
        } finally {
            setLoading(false);
        }
    };

    const unsettledSplits = SplitService.getUnsettledSplits(splits);
    const totalOwed = SplitService.getTotalOwed(friends);
    const totalOwing = SplitService.getTotalOwing(friends);

    return (
        <div className="pb-24 pt-6 px-4 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Split Bills</h1>
                <button
                    onClick={() => {
                        HapticService.light();
                        onCreateSplit();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg"
                >
                    + New Split
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-xl shadow-lg"
                >
                    <p className="text-green-100 text-xs mb-1">You'll Get</p>
                    <p className="text-white text-2xl font-bold">₹{totalOwed.toLocaleString()}</p>
                    <p className="text-green-100 text-xs mt-1">from friends</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-orange-600 to-orange-700 p-4 rounded-xl shadow-lg"
                >
                    <p className="text-orange-100 text-xs mb-1">You Owe</p>
                    <p className="text-white text-2xl font-bold">₹{totalOwing.toLocaleString()}</p>
                    <p className="text-orange-100 text-xs mt-1">to friends</p>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-800 p-1 rounded-lg mb-6">
                <button
                    onClick={() => {
                        setActiveTab('splits');
                        HapticService.selectionChanged();
                    }}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'splits'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Splits ({unsettledSplits.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('friends');
                        HapticService.selectionChanged();
                    }}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'friends'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Friends ({friends.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-400 mt-4">Loading...</p>
                </div>
            ) : activeTab === 'splits' ? (
                <div className="space-y-3">
                    {unsettledSplits.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">💸</div>
                            <p className="text-gray-400 mb-2">No active splits</p>
                            <p className="text-gray-500 text-sm">Create a split to get started</p>
                        </div>
                    ) : (
                        unsettledSplits.map(split => (
                            <SplitExpenseCard key={split.id} split={split} onUpdate={loadData} />
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {friends.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">👥</div>
                            <p className="text-gray-400 mb-2">No friends added</p>
                            <p className="text-gray-500 text-sm">Add friends to split bills with them</p>
                        </div>
                    ) : (
                        friends.map(friend => (
                            <FriendCard key={friend.id} friend={friend} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Split Expense Card Component
const SplitExpenseCard: React.FC<{ split: SplitExpense; onUpdate: () => void }> = ({
    split,
    onUpdate
}) => {
    const unpaidParticipants = split.participants.filter(p => !p.paid);
    const paidCount = split.participants.length - unpaidParticipants.length;

    const handleMarkAsPaid = async (participantId: string) => {
        try {
            const updatedSplit = SplitService.settleSplit(split, participantId);
            await SplitStorageService.updateSplitExpense(updatedSplit);
            await SplitStorageService.updateFriendBalances();
            HapticService.success();
            onUpdate();
        } catch (error) {
            console.error('Failed to mark as paid:', error);
            alert('Failed to update payment status');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 p-4 rounded-xl border border-gray-700"
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="text-white font-medium">₹{split.totalAmount.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">{split.splitType} split</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${split.isSettled
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-orange-600/20 text-orange-400'
                    }`}>
                    {split.isSettled ? 'Settled' : `${paidCount}/${split.participants.length} paid`}
                </span>
            </div>

            <div className="space-y-2">
                {unpaidParticipants.map(participant => (
                    <div key={participant.id} className="flex justify-between items-center text-sm bg-gray-900/50 p-2 rounded-lg">
                        <div className="flex-1">
                            <span className="text-gray-300">{participant.name}</span>
                            <span className="text-white font-medium ml-2">₹{participant.amount.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={() => handleMarkAsPaid(participant.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg ml-2"
                        >
                            Mark Paid
                        </button>
                    </div>
                ))}
                {split.participants.filter(p => p.paid).map(participant => (
                    <div key={participant.id} className="flex justify-between items-center text-sm text-gray-500 p-2">
                        <span>{participant.name}</span>
                        <span className="flex items-center gap-2">
                            ₹{participant.amount.toLocaleString()}
                            <span className="text-green-400">✓ Paid</span>
                        </span>
                    </div>
                ))}
            </div>

            {split.notes && (
                <p className="text-gray-500 text-xs mt-3 italic">{split.notes}</p>
            )}
        </motion.div>
    );
};

// Friend Card Component
const FriendCard: React.FC<{ friend: Friend }> = ({ friend }) => {
    const balance = SplitService.getOutstandingBalance(friend);
    const balanceText = balance > 0 ? 'owes you' : balance < 0 ? 'you owe' : 'settled up';
    const balanceColor = balance > 0 ? 'text-green-400' : balance < 0 ? 'text-orange-400' : 'text-gray-400';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 p-4 rounded-xl border border-gray-700"
        >
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-white font-medium">{friend.name}</p>
                    <p className="text-gray-400 text-sm">{balanceText}</p>
                </div>
                <p className={`text-xl font-bold ${balanceColor}`}>
                    ₹{Math.abs(balance).toLocaleString()}
                </p>
            </div>
        </motion.div>
    );
};

export default SplitBillPage;
