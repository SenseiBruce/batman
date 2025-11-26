import { Transaction } from '../types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const generateCSV = (transactions: Transaction[]): string => {
    const headers = ['ID', 'Date', 'Merchant', 'Category', 'Amount', 'Type', 'Description'];
    const rows = transactions.map(t => [
        t.id,
        t.date,
        `"${t.merchant.replace(/"/g, '""')}"`, // Escape quotes
        `"${t.category.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        t.type,
        `"${(t.rawSms || '').replace(/"/g, '""')}"`
    ]);

    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
};

export const exportData = async (transactions: Transaction[]) => {
    try {
        const csv = generateCSV(transactions);
        const fileName = `transactions_${new Date().toISOString().split('T')[0]}.csv`;

        // Write to file
        const result = await Filesystem.writeFile({
            path: fileName,
            data: csv,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
        });

        // Share file
        await Share.share({
            title: 'Export Transactions',
            text: 'Here is your transaction history.',
            url: result.uri,
            dialogTitle: 'Export Data'
        });

        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};
