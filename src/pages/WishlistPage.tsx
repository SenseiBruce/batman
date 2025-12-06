import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistItem } from '../types';
import { Clock, Plus, Check, X, ShieldAlert } from 'lucide-react';
import { TimeCostDisplay } from '../components/TimeCostDisplay';
import { SecureStorageService } from '../services/secureStorageService';

interface WishlistPageProps {
    wishlist: WishlistItem[];
    onAdd: (item: WishlistItem) => void;
    onUpdate: (item: WishlistItem) => void;
    onDelete: (id: string) => void;
    onBuy: (item: WishlistItem) => void; // Converts to transaction
}

const WishlistPage: React.FC<WishlistPageProps> = ({ wishlist, onAdd, onUpdate, onDelete, onBuy }) => {
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Item State
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemNote, setNewItemNote] = useState('');
    const [newItemCooldown, setNewItemCooldown] = useState('72');

    // Hourly Wage (for Time Cost display)
    const [hourlyWage, setHourlyWage] = useState(0);

    // Load wage on mount
    React.useEffect(() => {
        SecureStorageService.get<string>('hourly_wage').then(wage => {
            if (wage) setHourlyWage(parseFloat(wage));
        });
    }, []);

    const handleAddItem = () => {
        if (!newItemName || !newItemAmount) return;

        const newItem: WishlistItem = {
            id: `wish-${Date.now()}`,
            name: newItemName,
            amount: parseFloat(newItemAmount),
            note: newItemNote,
            dateAdded: new Date().toISOString(),
            cooldownHours: parseInt(newItemCooldown),
            status: 'locked'
        };

        onAdd(newItem);
        setIsAddModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setNewItemName('');
        setNewItemAmount('');
        setNewItemNote('');
        setNewItemCooldown('72');
    }

    const getRemainingTime = (item: WishlistItem) => {
        if (item.status !== 'locked') return 0;

        const addedTime = new Date(item.dateAdded).getTime();
        const unlockTime = addedTime + (item.cooldownHours * 60 * 60 * 1000);
        const now = Date.now();
        const remaining = unlockTime - now;

        return remaining > 0 ? remaining : 0;
    };

    const formatRemainingTime = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Check for unlocks periodically or on render
    React.useEffect(() => {
        const interval = setInterval(() => {
            // Force re-render to update timers? 
            // Better: Check unlock status and update ONLY if changed.
            wishlist.forEach(item => {
                const remaining = getRemainingTime(item);
                if (item.status === 'locked' && remaining <= 0) {
                    onUpdate({ ...item, status: 'unlocked' });
                }
            });
        }, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [wishlist, onUpdate]);

    return (
        <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-blue-400" />
                        Impulse Control
                    </h1>
                    <p className="text-gray-400 text-sm">Wait first. Buy later.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </header>

            <div className="space-y-4">
                {wishlist.filter(i => i.status !== 'purchased' && i.status !== 'abandoned').length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                        <p className="text-xl font-medium text-gray-300">No active wishes</p>
                        <p className="text-sm text-gray-500">Add something you want to buy, and we'll help you decide if it's worth it.</p>
                    </div>
                ) : (
                    wishlist.filter(i => i.status !== 'purchased' && i.status !== 'abandoned').map(item => {
                        const remaining = getRemainingTime(item);
                        const isLocked = item.status === 'locked' && remaining > 0;
                        const progress = isLocked
                            ? (1 - (remaining / (item.cooldownHours * 60 * 60 * 1000))) * 100
                            : 100;

                        return (
                            <div key={item.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 relative overflow-hidden">
                                {isLocked && (
                                    <div className="absolute top-0 left-0 h-1 bg-blue-500/30 w-full">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{item.name}</h3>
                                        {item.note && <p className="text-gray-400 text-sm">{item.note}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-white">${item.amount}</p>
                                        {hourlyWage > 0 && (
                                            <TimeCostDisplay amount={item.amount} hourlyWage={hourlyWage} className="justify-end" />
                                        )}
                                    </div>
                                </div>

                                {isLocked ? (
                                    <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-3 flex items-center gap-3 mt-3">
                                        <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                                        <div>
                                            <p className="text-blue-200 text-sm font-medium"> Cooling down...</p>
                                            <p className="text-blue-400 text-xs">Unlocks in {formatRemainingTime(remaining)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => onBuy(item)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-4 h-4" /> Buy It
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Abandon this wish? It will be moved to archived.')) {
                                                    onUpdate({ ...item, status: 'abandoned' });
                                                }
                                            }}
                                            className="flex-1 bg-red-900/30 hover:bg-red-900/50 border border-red-800 py-2 rounded-lg text-red-200 font-medium flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Abandon
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Item Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-4">Add to Wishlist</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400">Item Name</label>
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. New Sneakers"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Price ($)</label>
                                <input
                                    type="number"
                                    value={newItemAmount}
                                    onChange={e => setNewItemAmount(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Note (Optional)</label>
                                <input
                                    type="text"
                                    value={newItemNote}
                                    onChange={e => setNewItemNote(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Why do you want this?"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Cooldown Period (Hours)</label>
                                <p className="text-xs text-gray-500 mb-1">How long should we lock this?</p>
                                <div className="flex gap-2">
                                    {['24', '48', '72', '168'].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setNewItemCooldown(h)}
                                            className={`flex-1 py-2 rounded-lg text-sm border ${newItemCooldown === h ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                        >
                                            {h}h
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    disabled={!newItemName || !newItemAmount}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                                >
                                    Add to Wishlist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WishlistPage;
