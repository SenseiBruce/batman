import { Capacitor } from '@capacitor/core';

/**
 * UPI Payment Integration Service
 */
export class UpiService {
    /**
     * Generate UPI payment link
     */
    static generateUpiLink(
        amount: number,
        name: string,
        upiId?: string,
        note?: string
    ): string {
        const params = new URLSearchParams({
            pa: upiId || '', // Payee UPI ID (optional, user can select in UPI app)
            pn: name, // Payee name
            am: amount.toFixed(2), // Amount
            cu: 'INR', // Currency
            tn: note || 'Split expense settlement' // Transaction note
        });

        return `upi://pay?${params.toString()}`;
    }

    /**
     * Open UPI app with payment link
     */
    static async openUpiApp(upiLink: string): Promise<boolean> {
        if (Capacitor.getPlatform() !== 'android') {
            console.warn('UPI is only supported on Android');
            return false;
        }

        try {
            // Use window.open to trigger UPI intent
            window.location.href = upiLink;
            return true;
        } catch (error) {
            console.error('Failed to open UPI app:', error);
            return false;
        }
    }

    /**
     * Generate payment link for a specific UPI app
     */
    static generateAppSpecificLink(
        app: 'gpay' | 'phonepe' | 'paytm',
        amount: number,
        name: string,
        upiId?: string
    ): string {
        const baseLink = this.generateUpiLink(amount, name, upiId);

        // App-specific deep links
        const appLinks = {
            gpay: `tez://upi/pay?${baseLink.split('?')[1]}`,
            phonepe: `phonepe://pay?${baseLink.split('?')[1]}`,
            paytm: `paytmmp://pay?${baseLink.split('?')[1]}`
        };

        return appLinks[app] || baseLink;
    }

    /**
     * Check if UPI is supported on this device
     */
    static isSupported(): boolean {
        return Capacitor.getPlatform() === 'android';
    }

    /**
     * Format amount for display
     */
    static formatAmount(amount: number): string {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
