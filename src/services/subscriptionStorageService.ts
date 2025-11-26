import { SecureStorageService } from '../services/secureStorageService';
import { Subscription } from './subscriptionService';

const SUBS_KEY = 'subscriptions';

export const getSubscriptions = async (): Promise<Subscription[]> => {
    try {
        const stored = await SecureStorageService.get<Subscription[]>(SUBS_KEY);
        return stored || [];
    } catch (e) {
        console.error('Failed to load subscriptions:', e);
        return [];
    }
};

export const setSubscriptions = async (subs: Subscription[]): Promise<void> => {
    try {
        await SecureStorageService.set(SUBS_KEY, subs);
    } catch (e) {
        console.error('Failed to save subscriptions:', e);
    }
};

export const updateSubscription = async (updated: Subscription): Promise<void> => {
    const subs = await getSubscriptions();
    const newSubs = subs.map(s => (s.id === updated.id ? updated : s));
    await setSubscriptions(newSubs);
};

export const addSubscription = async (sub: Subscription): Promise<void> => {
    const subs = await getSubscriptions();
    await setSubscriptions([...subs, sub]);
};

export const deleteSubscription = async (id: string): Promise<void> => {
    const subs = await getSubscriptions();
    await setSubscriptions(subs.filter(s => s.id !== id));
};
