import { Account, Transaction, AccountType } from '../types';
import { SecureStorageService } from './secureStorageService';

const ACCOUNTS_KEY = 'accounts';

export class AccountService {

    /**
     * Get all accounts
     */
    static async getAccounts(): Promise<Account[]> {
        const accounts = await SecureStorageService.get<Account[]>(ACCOUNTS_KEY);
        return accounts || [];
    }

    /**
     * Save accounts
     */
    static async saveAccounts(accounts: Account[]): Promise<void> {
        await SecureStorageService.set(ACCOUNTS_KEY, accounts);
    }

    /**
     * Create a new account
     */
    static async createAccount(name: string, type: AccountType, initialBalance: number): Promise<Account> {
        const accounts = await this.getAccounts();

        const newAccount: Account = {
            id: `acc-${Date.now()}`,
            name,
            type,
            balance: initialBalance,
            color: this.getAccountColor(type),
            icon: this.getAccountIcon(type),
            isDefault: accounts.length === 0 // First account is default
        };

        const updatedAccounts = [...accounts, newAccount];
        await this.saveAccounts(updatedAccounts);
        return newAccount;
    }

    /**
     * Update account balance
     */
    static async updateAccountBalance(accountId: string, amount: number, isCredit: boolean): Promise<void> {
        const accounts = await this.getAccounts();
        const updatedAccounts = accounts.map(acc => {
            if (acc.id === accountId) {
                const newBalance = isCredit ? acc.balance + amount : acc.balance - amount;
                return { ...acc, balance: newBalance };
            }
            return acc;
        });
        await this.saveAccounts(updatedAccounts);
    }

    /**
     * Perform a transfer between accounts
     */
    static async performTransfer(
        sourceId: string,
        destId: string,
        amount: number
    ): Promise<void> {
        const accounts = await this.getAccounts();
        const updatedAccounts = accounts.map(acc => {
            if (acc.id === sourceId) {
                return { ...acc, balance: acc.balance - amount };
            }
            if (acc.id === destId) {
                return { ...acc, balance: acc.balance + amount };
            }
            return acc;
        });
        await this.saveAccounts(updatedAccounts);
    }

    /**
     * Calculate Net Worth
     */
    static calculateNetWorth(accounts: Account[]): number {
        return accounts.reduce((total, acc) => {
            // Credit cards are liabilities (negative net worth contribution if they have positive balance representing debt)
            // However, usually credit card balance in apps represents "Available Limit" or "Outstanding Debt".
            // Let's assume balance represents "Current Funds" for assets and "Outstanding Debt" for liabilities.
            // Actually, standard practice: 
            // Bank/Cash: Positive Balance = Asset
            // Credit Card: Positive Balance usually means Debt (Liability) in expense trackers? 
            // OR Negative Balance means Debt?
            // Let's stick to: Positive number = Money you have. Negative number = Money you owe.
            // So for Credit Card, if you owe 5000, balance should be -5000.
            return total + acc.balance;
        }, 0);
    }

    /**
     * Get default account
     */
    static async getDefaultAccount(): Promise<Account | null> {
        const accounts = await this.getAccounts();
        return accounts.find(a => a.isDefault) || accounts[0] || null;
    }

    /**
     * Helper to get color based on type
     */
    private static getAccountColor(type: AccountType): string {
        switch (type) {
            case 'bank': return '#3B82F6'; // Blue
            case 'cash': return '#10B981'; // Green
            case 'credit_card': return '#EF4444'; // Red
            case 'wallet': return '#F59E0B'; // Amber
            default: return '#6B7280';
        }
    }

    /**
     * Helper to get icon based on type
     */
    private static getAccountIcon(type: AccountType): string {
        switch (type) {
            case 'bank': return '🏦';
            case 'cash': return '💵';
            case 'credit_card': return '💳';
            case 'wallet': return '👛';
            default: return '💰';
        }
    }
}
