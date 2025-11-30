import { Capacitor } from '@capacitor/core';

/**
 * Widget Service for React Native
 * Handles communication between widgets and the app
 * Note: Widget updates are handled natively via SharedPreferences
 */
export class WidgetService {

    /**
     * Update all widgets with latest data
     * Widgets automatically update when SharedPreferences change
     */
    static async updateWidgets(): Promise<void> {
        if (Capacitor.getPlatform() !== 'android') {
            return;
        }

        // Widgets will auto-update when they detect SharedPreferences changes
        // No additional action needed from React Native side
        console.debug('Widget update triggered (handled natively)');
    }

    /**
     * Update specific widget by ID
     */
    static async updateWidget(widgetId: string): Promise<void> {
        if (Capacitor.getPlatform() !== 'android') {
            return;
        }

        console.debug(`Widget ${widgetId} update triggered (handled natively)`);
    }

    /**
     * Check if widgets are supported on this platform
     */
    static isSupported(): boolean {
        return Capacitor.getPlatform() === 'android';
    }
}
