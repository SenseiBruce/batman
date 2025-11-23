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
