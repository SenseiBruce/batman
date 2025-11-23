import { CapacitorConfig as BaseCapacitorConfig } from '@capacitor/cli';

declare module '@capacitor/cli' {
    interface CapacitorConfig extends BaseCapacitorConfig {
        /** Custom URL scheme for deep linking (e.g., jarvis://) */
        appUrlScheme?: string;
    }
}
