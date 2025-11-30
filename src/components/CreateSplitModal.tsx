import React, { useState } from 'react';
import { Transaction, SplitExpense, SplitParticipant } from '../types';
import { SplitService } from '../services/splitService';
import { SplitStorageService } from '../services/splitStorageService';
import { HapticService } from '../services/hapticService';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateSplitModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
}

export const CreateSplitModal: React.FC<CreateSplitModalProps> = ({
    isOpen,
    onClose,
    transactions
}) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
    const [participantNames, setParticipantNames] = useState<string[]>(['']);
    const [customAmounts, setCustomAmounts] = useState<number[]>([0]);
    const [notes, setNotes] = useState('');

    const handleAddParticipant = () => {
        setParticipantNames([...participantNames, '']);
        if (splitType === 'custom') {
            setCustomAmounts([...customAmounts, 0]);
        }
        HapticService.light();
    };

    const handleRemoveParticipant = (index: number) => {
        setParticipantNames(participantNames.filter((_, i) => i !== index));
        if (splitType === 'custom') {
            setCustomAmounts(customAmounts.filter((_, i) => i !== index));
        }
        HapticService.light();
    };

    const handleCreateSplit = async () => {
        if (!selectedTransaction) return;

        try {
            console.log('Creating split...');

            const amounts = splitType === 'equal'
                ? Array(participantNames.filter(n => n.trim()).length).fill(
                    SplitService.calculateEqualSplit(
                        selectedTransaction.amount,
                        participantNames.filter(n => n.trim()).length
                    )
                )
                : customAmounts;

            if (splitType === 'custom' && !SplitService.validateCustomSplit(selectedTransaction.amount, amounts)) {
                alert('Custom amounts must equal the total transaction amount');
                return;
            }

            const validNames = participantNames.filter(n => n.trim());
            const participants: SplitParticipant[] = SplitService.createParticipants(
                validNames,
                amounts
            );

            const split: SplitExpense = {
                id: `split-${Date.now()}`,
                transactionId: selectedTransaction.id,
                totalAmount: selectedTransaction.amount,
                paidBy: 'me',
                splitType,
                participants,
                createdDate: new Date().toISOString(),
                isSettled: false,
                notes
            };

            // Save split
            await SplitStorageService.saveSplitExpense(split);
            console.log('Split saved:', split);

            // Create or update friends
            const existingFriends = await SplitStorageService.getFriends();
            for (const participant of participants) {
                const existingFriend = existingFriends.find(f => f.name === participant.name);
                if (!existingFriend) {
                    const newFriend = {
                        id: participant.id,
                        name: participant.name,
                        phone: participant.phone,
                        totalOwed: participant.amount,
                        totalOwing: 0,
                        addedDate: new Date().toISOString()
                    };
                    await SplitStorageService.saveFriend(newFriend);
                    console.log('Friend created:', newFriend);
                }
            }

            // Update balances
            await SplitStorageService.updateFriendBalances();
            console.log('Balances updated');

            HapticService.success();
            onClose();
            resetForm();

            // Force page reload to show new split
            window.location.reload();
        } catch (error) {
            console.error('Failed to create split:', error);
            alert('Failed to create split. Please try again.');
        }
    };

    const resetForm = () => {
        setStep(1);
        setSelectedTransaction(null);
        setSplitType('equal');
        setParticipantNames(['']);
        setCustomAmounts([0]);
        setNotes('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-gray-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">
                            {step === 1 && 'Select Transaction'}
                            {step === 2 && 'Add Participants'}
                            {step === 3 && 'Review Split'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            ✕
                        </button>
                    </div>

                    {step === 1 && (
                        <div className="space-y-3">
                            {transactions.filter(t => t.type === 'debit').slice(0, 10).map(tx => (
                                <button
                                    key={tx.id}
                                    onClick={() => {
                                        setSelectedTransaction(tx);
                                        setStep(2);
                                        HapticService.selectionChanged();
                                    }}
                                    className="w-full bg-gray-800 p-4 rounded-xl text-left hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-medium">{tx.merchant}</p>
                                            <p className="text-gray-400 text-sm">{tx.category}</p>
                                        </div>
                                        <p className="text-white font-bold">₹{tx.amount.toLocaleString()}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 2 && selectedTransaction && (
                        <div className="space-y-4">
                            <div className="bg-gray-800 p-4 rounded-xl">
                                <p className="text-gray-400 text-sm">Total Amount</p>
                                <p className="text-white text-2xl font-bold">₹{selectedTransaction.amount.toLocaleString()}</p>
                            </div>

                            <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setSplitType('equal')}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium ${splitType === 'equal' ? 'bg-blue-600 text-white' : 'text-gray-400'
                                        }`}
                                >
                                    Equal Split
                                </button>
                                <button
                                    onClick={() => setSplitType('custom')}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium ${splitType === 'custom' ? 'bg-blue-600 text-white' : 'text-gray-400'
                                        }`}
                                >
                                    Custom
                                </button>
                            </div>

                            <div className="space-y-3">
                                {participantNames.map((name, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => {
                                                const updated = [...participantNames];
                                                updated[index] = e.target.value;
                                                setParticipantNames(updated);
                                            }}
                                            placeholder="Friend's name"
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                                        />
                                        {splitType === 'custom' && (
                                            <input
                                                type="number"
                                                value={customAmounts[index] || ''}
                                                onChange={(e) => {
                                                    const updated = [...customAmounts];
                                                    updated[index] = parseFloat(e.target.value) || 0;
                                                    setCustomAmounts(updated);
                                                }}
                                                placeholder="Amount"
                                                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                                            />
                                        )}
                                        {participantNames.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveParticipant(index)}
                                                className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAddParticipant}
                                className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300"
                            >
                                + Add Participant
                            </button>

                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes (optional)"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                                rows={2}
                            />

                            <button
                                onClick={() => {
                                    if (participantNames.some(n => n.trim())) {
                                        setStep(3);
                                        HapticService.light();
                                    }
                                }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 3 && selectedTransaction && (
                        <div className="space-y-4">
                            <div className="bg-gray-800 p-4 rounded-xl space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Total</span>
                                    <span className="text-white font-bold">₹{selectedTransaction.amount.toLocaleString()}</span>
                                </div>
                                {participantNames.filter(n => n.trim()).map((name, index) => {
                                    const amount = splitType === 'equal'
                                        ? SplitService.calculateEqualSplit(selectedTransaction.amount, participantNames.filter(n => n.trim()).length)
                                        : customAmounts[index];
                                    return (
                                        <div key={index} className="flex justify-between">
                                            <span className="text-gray-300">{name}</span>
                                            <span className="text-white">₹{amount.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateSplit}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium"
                                >
                                    Create Split
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
