// src/utils/notify.ts
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Request permission for local notifications (required on Android 13+).
 */
export async function requestPushPermission(): Promise<boolean> {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
}

/**
 * Register listeners (optional – you can handle received notifications here).
 */
export function registerPushListeners() {
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Local notification received:', notification);
    });
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('Local notification action performed', action);

        // Handle notification tap - emit custom event
        if (action.notification.id === 999) { // Pending transactions notification
            window.dispatchEvent(new CustomEvent('openPendingTransactionsReview'));
        }
    });
}

/**
 * Schedule a local notification for a budget alert.
 */
export async function scheduleBudgetAlert(title: string, body: string) {
    // Ensure permission first
    const granted = await requestPushPermission();
    if (!granted) return;

    await LocalNotifications.schedule({
        notifications: [
            {
                title,
                body,
                id: Math.floor(Math.random() * 1000000000),
                schedule: { at: new Date(Date.now() + 500) }, // half‑second delay
            },
        ],
    });
}

/**
 * Schedule a local notification for pending transactions.
 */
export async function schedulePendingTransactionsAlert(count: number) {
    const granted = await requestPushPermission();
    if (!granted) return;

    // Cancel any existing pending transaction notifications
    await LocalNotifications.cancel({ notifications: [{ id: 999 }] });

    if (count === 0) return; // Don't notify if no pending transactions

    await LocalNotifications.schedule({
        notifications: [
            {
                title: '💰 New Transactions Detected',
                body: `${count} transaction${count > 1 ? 's' : ''} pending your review. Tap to categorize.`,
                id: 999, // Fixed ID so we can update/cancel it
                schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
                actionTypeId: 'PENDING_REVIEW',
                extra: {
                    action: 'openPendingReview',
                    count: count
                }
            },
        ],
    });
}

/**
 * Schedule a local notification for a subscription renewal (1 day before).
 */
export async function scheduleSubscriptionReminder(subName: string, dueDate: string) {
    const granted = await requestPushPermission();
    if (!granted) return;

    const due = new Date(dueDate);
    // Set reminder for 9:00 AM the day before
    const reminderDate = new Date(due);
    reminderDate.setDate(due.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);

    // If reminder date is in the past, don't schedule
    if (reminderDate.getTime() < Date.now()) return;

    await LocalNotifications.schedule({
        notifications: [
            {
                title: 'Subscription Renewal',
                body: `Your ${subName} subscription is due tomorrow!`,
                id: Math.floor(Math.random() * 1000000000),
                schedule: { at: reminderDate },
            },
        ],
    });
}
