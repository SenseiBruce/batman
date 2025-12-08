import React, { createContext, useContext, useState, useEffect } from 'react';
import { SecureStorageService } from '../services/secureStorageService';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CNY' | 'KRW' | 'RUB' | 'BRL';

interface CurrencyContextType {
    currencyCode: CurrencyCode;
    currencySymbol: string;
    setCurrency: (code: CurrencyCode) => Promise<void>;
    formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string; locale: string }> = {
    INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
    EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
    GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
    JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    CNY: { symbol: 'CN¥', name: 'Chinese Yuan', locale: 'zh-CN' },
    KRW: { symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
    RUB: { symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
    BRL: { symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('INR');

    useEffect(() => {
        initializeCurrency();
    }, []);

    const initializeCurrency = async () => {
        // 1. Try to load saved preference
        const saved = await SecureStorageService.get<CurrencyCode>('currency_preference');
        if (saved && CURRENCIES[saved]) {
            setCurrencyCode(saved);
            return;
        }

        // 2. If no preference, detect locale
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Heuristic mapping from timezone to currency
            // This is a rough estimation, user can override in settings
            let detected: CurrencyCode = 'USD'; // Default fallback

            if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || timeZone.includes('India')) detected = 'INR';
            else if (timeZone.includes('London')) detected = 'GBP';
            else if (timeZone.includes('Europe') || timeZone.includes('Berlin') || timeZone.includes('Paris')) detected = 'EUR';
            else if (timeZone.includes('Tokyo')) detected = 'JPY';
            else if (timeZone.includes('Sydney') || timeZone.includes('Melbourne')) detected = 'AUD';
            else if (timeZone.includes('New_York') || timeZone.includes('Los_Angeles') || timeZone.includes('Chicago')) detected = 'USD';

            console.log('🌍 Detected Currency:', detected, 'from TimeZone:', timeZone);
            setCurrencyCode(detected);

            // Save it as default so we don't guess every time
            await SecureStorageService.set('currency_preference', detected);
        } catch (e) {
            console.warn('Currency detection failed, defaulting to INR');
            setCurrencyCode('INR');
        }
    };

    const setCurrency = async (code: CurrencyCode) => {
        setCurrencyCode(code);
        await SecureStorageService.set('currency_preference', code);
    };

    const formatAmount = (amount: number) => {
        const { locale, symbol } = CURRENCIES[currencyCode];
        // Use Intl for proper locale formatting (e.g. 1,00,000 for INR vs 100,000 for USD)
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        } catch (e) {
            // Fallback
            return `${symbol}${amount.toLocaleString()}`;
        }
    };

    return (
        <CurrencyContext.Provider value={{
            currencyCode,
            currencySymbol: CURRENCIES[currencyCode].symbol,
            setCurrency,
            formatAmount
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
