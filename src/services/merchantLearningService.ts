import { SecureStorageService } from './secureStorageService';

export interface MerchantLearning {
    merchantName: string;
    category: string;
    learnedAt: string;
    usageCount: number;
}

const STORAGE_KEY = 'merchant_learnings';

export class MerchantLearningService {
    /**
     * Learn a merchant -> category mapping
     */
    static async learnMapping(merchantName: string, category: string): Promise<void> {
        const learnings = await this.getAllLearnings();
        const existing = learnings.find(l =>
            l.merchantName.toLowerCase() === merchantName.toLowerCase()
        );

        if (existing) {
            // Update existing learning
            existing.category = category;
            existing.usageCount++;
            existing.learnedAt = new Date().toISOString();
        } else {
            // Add new learning
            learnings.push({
                merchantName,
                category,
                learnedAt: new Date().toISOString(),
                usageCount: 1
            });
        }

        await SecureStorageService.set(STORAGE_KEY, learnings);
    }

    /**
     * Get learned category for a merchant
     */
    static async getLearnedCategory(merchantName: string): Promise<string | null> {
        const learnings = await this.getAllLearnings();
        const normalized = merchantName.toLowerCase().trim();

        // First try exact match
        const exactMatch = learnings.find(l =>
            l.merchantName.toLowerCase() === normalized
        );
        if (exactMatch) return exactMatch.category;

        // Try partial match (contains)
        const partialMatch = learnings.find(l =>
            normalized.includes(l.merchantName.toLowerCase()) ||
            l.merchantName.toLowerCase().includes(normalized)
        );
        if (partialMatch) return partialMatch.category;

        return null;
    }

    /**
     * Get all learned mappings
     */
    static async getAllLearnings(): Promise<MerchantLearning[]> {
        const data = await SecureStorageService.get<MerchantLearning[]>(STORAGE_KEY);
        return data || [];
    }

    /**
     * Clear all learnings
     */
    static async clearAllLearnings(): Promise<void> {
        await SecureStorageService.remove(STORAGE_KEY);
    }

    /**
     * Get top merchants (by usage count)
     */
    static async getTopMerchants(limit: number = 10): Promise<MerchantLearning[]> {
        const learnings = await this.getAllLearnings();
        return learnings
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }

    /**
     * Export learnings as JSON string
     */
    static async exportLearnings(): Promise<string> {
        const learnings = await this.getAllLearnings();
        return JSON.stringify(learnings, null, 2);
    }

    /**
     * Import learnings from JSON string
     */
    static async importLearnings(jsonString: string): Promise<void> {
        try {
            const imported = JSON.parse(jsonString) as MerchantLearning[];
            if (!Array.isArray(imported)) {
                throw new Error('Invalid format: must be an array');
            }
            await SecureStorageService.set(STORAGE_KEY, imported);
        } catch (error) {
            console.error('Failed to import learnings:', error);
            throw new Error('Invalid import format');
        }
    }
}
