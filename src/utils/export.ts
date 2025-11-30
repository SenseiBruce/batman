import { Transaction } from '../types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const exportToCSV = async (transactions: Transaction[]) => {
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type', 'Description'];
    const rows = transactions.map(t => [
        t.date,
        `"${t.merchant.replace(/"/g, '""')}"`,
        `"${t.category.replace(/"/g, '""')}"`,
        t.amount.toString(),
        t.type,
        `"${(t.rawSms || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const fileName = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;

    try {
        // Write to file
        const result = await Filesystem.writeFile({
            path: fileName,
            data: csvContent,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
        });

        // Share the file
        await Share.share({
            title: 'Export Transactions',
            text: 'Here are your transactions',
            url: result.uri,
            dialogTitle: 'Export Transactions'
        });

        return true;
    } catch (error) {
        console.error('Export failed:', error);
        return false;
    }
};
