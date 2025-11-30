import { Preferences } from '@capacitor/preferences';
import { SplitExpense, Friend } from '../types';

/**
 * Storage service for bill splitting data
 */
export class SplitStorageService {
    private static SPLITS_KEY = 'splitExpenses';
    private static FRIENDS_KEY = 'friends';

    // Split Expenses
    static async getSplitExpenses(): Promise<SplitExpense[]> {
        try {
            const { value } = await Preferences.get({ key: this.SPLITS_KEY });
            return value ? JSON.parse(value) : [];
        } catch (error) {
            console.error('Failed to get split expenses:', error);
            return [];
        }
    }

    static async saveSplitExpense(split: SplitExpense): Promise<void> {
        try {
            const splits = await this.getSplitExpenses();
            const existingIndex = splits.findIndex(s => s.id === split.id);

            if (existingIndex >= 0) {
                splits[existingIndex] = split;
            } else {
                splits.push(split);
            }

            await Preferences.set({
                key: this.SPLITS_KEY,
                value: JSON.stringify(splits)
            });
        } catch (error) {
            console.error('Failed to save split expense:', error);
            throw error;
        }
    }

    static async updateSplitExpense(split: SplitExpense): Promise<void> {
        return this.saveSplitExpense(split);
    }

    static async deleteSplitExpense(id: string): Promise<void> {
        try {
            const splits = await this.getSplitExpenses();
            const filtered = splits.filter(s => s.id !== id);
            await Preferences.set({
                key: this.SPLITS_KEY,
                value: JSON.stringify(filtered)
            });
        } catch (error) {
            console.error('Failed to delete split expense:', error);
            throw error;
        }
    }

    // Friends
    static async getFriends(): Promise<Friend[]> {
        try {
            const { value } = await Preferences.get({ key: this.FRIENDS_KEY });
            return value ? JSON.parse(value) : [];
        } catch (error) {
            console.error('Failed to get friends:', error);
            return [];
        }
    }

    static async saveFriend(friend: Friend): Promise<void> {
        try {
            const friends = await this.getFriends();
            const existingIndex = friends.findIndex(f => f.id === friend.id);

            if (existingIndex >= 0) {
                friends[existingIndex] = friend;
            } else {
                friends.push(friend);
            }

            await Preferences.set({
                key: this.FRIENDS_KEY,
                value: JSON.stringify(friends)
            });
        } catch (error) {
            console.error('Failed to save friend:', error);
            throw error;
        }
    }

    static async deleteFriend(id: string): Promise<void> {
        try {
            const friends = await this.getFriends();
            const filtered = friends.filter(f => f.id !== id);
            await Preferences.set({
                key: this.FRIENDS_KEY,
                value: JSON.stringify(filtered)
            });
        } catch (error) {
            console.error('Failed to delete friend:', error);
            throw error;
        }
    }

    static async updateFriendBalances(): Promise<void> {
        try {
            const [splits, friends] = await Promise.all([
                this.getSplitExpenses(),
                this.getFriends()
            ]);

            // Calculate balances for each friend
            const balances = new Map<string, { owed: number; owing: number }>();

            splits.forEach(split => {
                split.participants.forEach(participant => {
                    if (!balances.has(participant.id)) {
                        balances.set(participant.id, { owed: 0, owing: 0 });
                    }

                    const balance = balances.get(participant.id)!;

                    if (!participant.paid) {
                        if (split.paidBy === 'me') {
                            // They owe you
                            balance.owed += participant.amount;
                        } else {
                            // You owe them
                            balance.owing += participant.amount;
                        }
                    }
                });
            });

            // Update friend balances
            const updatedFriends = friends.map(friend => {
                const balance = balances.get(friend.id) || { owed: 0, owing: 0 };
                return {
                    ...friend,
                    totalOwed: balance.owed,
                    totalOwing: balance.owing
                };
            });

            await Preferences.set({
                key: this.FRIENDS_KEY,
                value: JSON.stringify(updatedFriends)
            });
        } catch (error) {
            console.error('Failed to update friend balances:', error);
            throw error;
        }
    }
}
