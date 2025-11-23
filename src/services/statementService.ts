import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { CATEGORY_KEYWORDS } from '../constants';

/**
 * Parse bank statement file and extract transactions
 * File data is processed in memory and cleared after parsing for security
 */
export const parseStatement = async (file: File): Promise<Transaction[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON, starting from row 22 (header row based on inspection)
                // We'll fetch raw values to handle dates better
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

                const transactions: Transaction[] = [];

                // HDFC Statement Format usually starts actual data after headers
                // We look for the header row first
                let headerRowIndex = -1;
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row.includes('Date') && row.includes('Narration') && row.includes('Withdrawal Amt.')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    // Fallback: try to find just "Date" and "Narration"
                    for (let i = 0; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (row.includes('Date') && row.includes('Narration')) {
                            headerRowIndex = i;
                            break;
                        }
                    }
                }

                if (headerRowIndex === -1) {
                    throw new Error('Could not find statement headers. Please check the file format.');
                }

                // Map column indices
                const headerRow = jsonData[headerRowIndex];
                const dateIdx = headerRow.findIndex((c: string) => c.includes('Date'));
                const narrationIdx = headerRow.findIndex((c: string) => c.includes('Narration'));
                const debitIdx = headerRow.findIndex((c: string) => c.includes('Withdrawal') || c.includes('Debit'));
                const creditIdx = headerRow.findIndex((c: string) => c.includes('Deposit') || c.includes('Credit'));
                const refIdx = headerRow.findIndex((c: string) => c.includes('Chq./Ref.No.'));

                // Parse rows
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row[dateIdx]) continue; // Skip empty rows

                    const dateStr = row[dateIdx];
                    const narration = row[narrationIdx];
                    const debitAmt = parseFloat((row[debitIdx] || '0').toString().replace(/,/g, ''));
                    const creditAmt = parseFloat((row[creditIdx] || '0').toString().replace(/,/g, ''));

                    if (isNaN(debitAmt) && isNaN(creditAmt)) continue;

                    const amount = debitAmt > 0 ? debitAmt : creditAmt;
                    const type = debitAmt > 0 ? 'debit' : 'credit';

                    if (amount === 0) continue;

                    // Parse Date
                    let day, month, year;
                    if (typeof dateStr === 'string') {
                        const parts = dateStr.split(/[-/]/); // Split by - or /
                        if (parts.length === 3) {
                            [day, month, year] = parts.map(p => parseInt(p));
                        }
                    }

                    if (!day || !month || !year) {
                        console.warn('Skipping row with invalid date:', dateStr, row);
                        continue;
                    }

                    // Adjust year if 2 digits
                    const fullYear = year < 100 ? 2000 + year : year;
                    const dateObj = new Date(fullYear, month - 1, day);

                    if (isNaN(dateObj.getTime())) {
                        console.warn('Invalid date object:', dateStr);
                        continue;
                    }

                    const isoDate = dateObj.toISOString();

                    // Generate ID
                    const uniqueString = `${isoDate}|${narration}|${amount}|${type}`;
                    let hash = 0;
                    for (let j = 0; j < uniqueString.length; j++) {
                        const char = uniqueString.charCodeAt(j);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    const id = `stmt-${Math.abs(hash)}`;

                    // Guess Category
                    let category = 'Other';
                    const lowerNarration = narration.toLowerCase();

                    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
                        if (keywords.some(k => lowerNarration.includes(k))) {
                            category = cat;
                            break;
                        }
                    }

                    // Clean Merchant Name
                    let merchant = narration;
                    if (merchant.includes('-')) {
                        const parts = merchant.split('-');
                        // Often format is "UPI-MERCHANT-REF" or "POS-MERCHANT-CITY"
                        if (parts.length > 1) merchant = parts[1];
                    }

                    transactions.push({
                        id,
                        date: isoDate,
                        amount,
                        type,
                        category,
                        merchant: merchant.trim(),
                        isManual: false,
                        rawSms: narration // Store narration here for reference
                    });
                }

                resolve(transactions);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
