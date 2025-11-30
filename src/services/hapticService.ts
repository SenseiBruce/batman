import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Haptic Feedback Service
 * Provides tactile feedback for various user interactions
 */

export class HapticService {
    /**
     * Light impact - for subtle interactions
     * Use for: button taps, toggles, minor selections
     */
    static async light() {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (error) {
            // Haptics not available on this device
            console.debug('Haptics not available:', error);
        }
    }

    /**
     * Medium impact - for standard interactions
     * Use for: confirmations, swipe actions, card selections
     */
    static async medium() {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    }

    /**
     * Heavy impact - for important actions
     * Use for: deletions, errors, critical alerts
     */
    static async heavy() {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    }

    /**
     * Success notification - for successful operations
     * Use for: successful sync, transaction added, goal achieved
     */
    static async success() {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    }

    /**
     * Warning notification - for warnings
     * Use for: budget warnings, approaching limits
     */
    static async warning() {
        try {
            await Haptics.notification({ type: NotificationType.Warning });
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    }

    /**
     * Error notification - for errors
     * Use for: failed operations, validation errors
     */
    static async error() {
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    }

    /**
     * Selection changed - for picker/selector changes
     * Use for: month selector, category filter changes
     */
    static async selectionChanged() {
        try {
            await Haptics.selectionChanged();
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    }

    /**
     * Double tap - two quick light impacts
     * Use for: special actions, easter eggs
     */
    static async doubleTap() {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
            setTimeout(async () => {
                await Haptics.impact({ style: ImpactStyle.Light });
            }, 100);
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    }

    /**
     * Vibrate pattern for budget exceeded
     * Use for: when user exceeds budget limit
     */
    static async budgetExceeded() {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
            setTimeout(async () => {
                await Haptics.impact({ style: ImpactStyle.Medium });
            }, 150);
            setTimeout(async () => {
                await Haptics.impact({ style: ImpactStyle.Medium });
            }, 300);
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    }
}
