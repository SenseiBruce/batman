// src/services/smsService.ts
import { Preferences } from '@capacitor/preferences';
import { Transaction } from '../types';
import { DEFAULT_CATEGORIES, CATEGORY_KEYWORDS } from '../constants';
import { registerPlugin } from '@capacitor/core';

// Register the SMS Reader plugin
interface SMSReaderPlugin {
    checkPermissions(): Promise<any>;
    requestPermissions(): Promise<any>;
    getMessages(options: any): Promise<any>;
}

const SMSReader = registerPlugin<SMSReaderPlugin>('MessageReader');

/**
 * Request SMS permissions (READ_SMS, RECEIVE_SMS) at runtime.
 */
async function requestSmsPermissions(): Promise<boolean> {
    try {
        console.log('🔐 Checking SMS permissions...');
        const status = await SMSReader.checkPermissions();
        console.log('Permission status:', JSON.stringify(status));

        // Check if already granted (handle different response formats)
        // Logged status: {"messages":"granted"}
        if (status && (status.read === 'granted' || status === 'granted' || status.messages === 'granted')) {
            console.log('✅ SMS permissions already granted');
            return true;
        }

        console.log('📱 Requesting SMS permissions...');
        const result = await SMSReader.requestPermissions();
        console.log('Permission result:', JSON.stringify(result));

        const granted = result && (result.read === 'granted' || result === 'granted');
        console.log(granted ? '✅ Permissions granted' : '❌ Permissions denied');
        return granted;
    } catch (e) {
        console.error('SMS permission error:', e);
        return false;
    }
}

/**
 * Parse a raw SMS text into a Transaction object using the regex patterns
 * defined in constants.ts.
 */
function parseSmsToTransaction(smsBody: string, smsDate: string, smsFrom: string): Transaction | null {
    // Updated regex patterns to match HDFC Bank format
    // Amount: Rs.408.00 or Rs 408 or INR 408.00 or ₹408
    const amountRegex = /(?:Rs\.?|INR|₹)\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/i;

    // HDFC uses "Sent" for debits, "debited" for other banks
    const debitRegex = /(sent|debited|spent|paid|withdraw)/i;

    // Credit keywords
    const creditRegex = /(credited|received|added|deposit|refund)/i;

    // Merchant extraction - HDFC format: "To Mrs Ruby" or "from VPA 9971601304@ptaxis"
    const toMerchantRegex = /To\s+([A-Za-z0-9\s.]+?)(?:\s+On|\s+Ref|$)/i;
    const fromVpaRegex = /from\s+VPA\s+(\d+)@([a-z]+)/i;
    const merchantRegex = /(?:at|to|from)\s+([A-Za-z0-9\s&]+?)(?:\s(?:on|via|using|ref)|\.|$)/i;

    // Date: 20/11/25 or 20-11-25 or DD-MM-YYYY
    const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;

    // Parse amount
    const amountMatch = smsBody.match(amountRegex);
    if (!amountMatch) {
        return null; // Skip if no amount found
    }
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Determine type
    const type = debitRegex.test(smsBody) ? 'debit' : creditRegex.test(smsBody) ? 'credit' : 'debit';

    // Extract merchant
    let merchant = smsFrom || 'Unknown';

    // Try HDFC "To" format first
    const toMatch = smsBody.match(toMerchantRegex);
    if (toMatch) {
        merchant = toMatch[1].trim();
    } else {
        // Try VPA format (e.g., "from VPA 9971601304@ptaxis")
        const vpaMatch = smsBody.match(fromVpaRegex);
        if (vpaMatch) {
            merchant = vpaMatch[2]; // Extract service name (ptaxis, ptyes, etc.)
        } else {
            // Try generic merchant pattern
            const genericMatch = smsBody.match(merchantRegex);
            if (genericMatch) {
                merchant = genericMatch[1].trim();
            }
        }
    }

    // Parse date
    const dateMatch = smsBody.match(dateRegex);
    let isoDate = new Date(smsDate).toISOString();
    if (dateMatch) {
        try {
            // Convert DD/MM/YY or DD-MM-YY to proper date
            const parts = dateMatch[0].split(/[-/]/);
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // 0-indexed
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000; // Convert 25 to 2025
            const parsedDate = new Date(year, month, day);
            if (!isNaN(parsedDate.getTime())) {
                isoDate = parsedDate.toISOString();
            }
        } catch (e) {
            // Fall back to SMS date
        }
    }

    // Simple category guess based on merchant
    // Uses CATEGORY_KEYWORDS from constants.ts
    const lowerMerchant = (merchant || '').toLowerCase();
    let category = 'Other';
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(k => lowerMerchant.includes(k))) {
            category = cat;
            break;
        }
    }

    // Generate a deterministic ID based on content to prevent duplicates
    // Simple hash of body + date + sender
    const uniqueString = `${smsBody}|${isoDate}|${smsFrom}`;
    let hash = 0;
    for (let i = 0; i < uniqueString.length; i++) {
        const char = uniqueString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const id = `sms-${Math.abs(hash)}`;

    const tx: Transaction = {
        id,
        amount,
        type,
        category,
        merchant,
        date: isoDate,
        isManual: false,
        rawSms: smsBody
    };
    return tx;
}

/**
 * Initialize SMS reading and return all parsed transactions.
 */
export async function fetchAllSmsTransactions(): Promise<Transaction[]> {
    const granted = await requestSmsPermissions();
    if (!granted) {
        console.warn('SMS permissions not granted');
        throw new Error('SMS permissions not granted');
    }
    try {
        const result = await SMSReader.getMessages({});
        const messages: Array<{ body: string; date: string; address: string }> = result?.messages || [];

        console.log(`📱 Total SMS messages found: ${messages.length}`);

        const transactions: Transaction[] = [];
        messages.forEach((msg) => {
            const tx = parseSmsToTransaction(msg.body, msg.date, msg.address);
            if (tx) {
                transactions.push(tx);
            }
        });

        console.log(`📊 Parsed ${transactions.length} out of ${messages.length} SMS messages`);

        if (transactions.length === 0 && messages.length > 0) {
            console.warn('⚠️ No transactions parsed. Sample SMS might not match patterns.');
        }

        return transactions;
    } catch (e) {
        console.error('Error reading SMS', e);
        throw e;
    }
}
