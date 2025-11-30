import { SplitExpense, SplitParticipant, Friend } from '../types';

/**
 * Business logic for bill splitting
 */
export class SplitService {
    /**
     * Calculate equal split among participants
     */
    static calculateEqualSplit(totalAmount: number, participantCount: number): number {
        if (participantCount <= 0) return 0;
        return Math.round((totalAmount / participantCount) * 100) / 100;
    }

    /**
     * Validate custom split amounts
     */
    static validateCustomSplit(totalAmount: number, amounts: number[]): boolean {
        const sum = amounts.reduce((acc, amt) => acc + amt, 0);
        return Math.abs(sum - totalAmount) < 0.01; // Allow for rounding errors
    }

    /**
     * Calculate percentage-based split
     */
    static calculatePercentageSplit(totalAmount: number, percentages: number[]): number[] {
        if (percentages.reduce((acc, p) => acc + p, 0) !== 100) {
            throw new Error('Percentages must sum to 100');
        }

        return percentages.map(p => Math.round((totalAmount * p / 100) * 100) / 100);
    }

    /**
     * Get outstanding balance for a specific friend
     */
    static getOutstandingBalance(friend: Friend): number {
        return friend.totalOwed - friend.totalOwing;
    }

    /**
     * Get total amount owed to you across all friends
     */
    static getTotalOwed(friends: Friend[]): number {
        return friends.reduce((sum, friend) => sum + friend.totalOwed, 0);
    }

    /**
     * Get total amount you owe across all friends
     */
    static getTotalOwing(friends: Friend[]): number {
        return friends.reduce((sum, friend) => sum + friend.totalOwing, 0);
    }

    /**
     * Mark a participant as paid in a split
     */
    static settleSplit(split: SplitExpense, participantId: string): SplitExpense {
        const updatedParticipants = split.participants.map(p =>
            p.id === participantId
                ? { ...p, paid: true, paidDate: new Date().toISOString() }
                : p
        );

        const allPaid = updatedParticipants.every(p => p.paid);

        return {
            ...split,
            participants: updatedParticipants,
            isSettled: allPaid,
            settledDate: allPaid ? new Date().toISOString() : undefined
        };
    }

    /**
     * Create split participants from names and amounts
     */
    static createParticipants(
        names: string[],
        amounts: number[],
        phones?: string[]
    ): SplitParticipant[] {
        return names.map((name, index) => ({
            id: `participant-${Date.now()}-${index}`,
            name,
            phone: phones?.[index],
            amount: amounts[index],
            paid: false
        }));
    }

    /**
     * Get unsettled splits
     */
    static getUnsettledSplits(splits: SplitExpense[]): SplitExpense[] {
        return splits.filter(split => !split.isSettled);
    }

    /**
     * Get splits with a specific friend
     */
    static getSplitsWithFriend(splits: SplitExpense[], friendId: string): SplitExpense[] {
        return splits.filter(split =>
            split.participants.some(p => p.id === friendId)
        );
    }

    /**
     * Calculate how much a friend owes in a specific split
     */
    static getFriendAmountInSplit(split: SplitExpense, friendId: string): number {
        const participant = split.participants.find(p => p.id === friendId);
        return participant && !participant.paid ? participant.amount : 0;
    }
}
