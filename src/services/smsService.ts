// src/services/smsService.ts
import { Preferences } from '@capacitor/preferences';
import { SecureStorageService } from './secureStorageService';
import { Transaction } from '../types';
import { DEFAULT_CATEGORIES, CATEGORY_KEYWORDS } from '../constants';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { GeminiCategorizationService } from './geminiCategorizationService';

// Register the SMS Reader plugin
interface SMSReaderPlugin {
    checkPermissions(): Promise<any>;
    requestPermissions(): Promise<any>;
    getMessages(options: any): Promise<any>;
}

const SMSReader = registerPlugin<SMSReaderPlugin>('MessageReader');

/** Helper: Detect personal name patterns for Personal Transfers */
function hasPersonNamePattern(merchant: string): boolean {
    const patterns = [
        /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,
        /kumar|singh|sharma|prasad|pal|verma|gupta|jain|reddy|nair|iyer|agarwal/i,
        /^mr\.|^mrs\.|^ms\./i,
        /^\w+\s+\w+$/
    ];
    return patterns.some(p => p.test(merchant));
}

/** Smart categorization based on amount, merchant and heuristics */
function smartCategorize(merchant: string, amount: number, smsBody: string, fallback: string): string {
    // Large amounts likely investments or big purchases
    if (amount > 50000) {
        if (/sip|mutual|stock|equity|investment/i.test(smsBody)) return 'Investments';
        if (/furniture|electronics|appliance/i.test(smsBody)) return 'Shopping';
    }
    // Round amounts with personal names → Personal Transfers
    if (amount % 100 === 0 && amount >= 100 && amount <= 5000 && hasPersonNamePattern(merchant)) {
        return 'Personal Transfers';
    }
    // Meal cards always Food & Dining
    if (/pluxee|sodexo|eternal/i.test(merchant)) return 'Food & Dining';
    // Small unknown amounts → UPI Transactions
    if (amount < 50 && fallback === 'Other') return 'UPI Transactions';
    return fallback;
}

/** Initialise Gemini service if API key is stored */
let geminiService: GeminiCategorizationService | null = null;
async function initGeminiService() {
    const { value } = await Preferences.get({ key: 'gemini_api_key' });
    if (value) {
        geminiService = new GeminiCategorizationService(value);
    }
}
initGeminiService();

/** Record a user correction for future learning */
async function recordCategoryCorrection(merchant: string, userCategory: string) {
    const key = 'category_corrections';
    const { value } = await Preferences.get({ key });
    let corrections: Array<{ merchant: string; category: string; timestamp: string }> = [];
    if (value) {
        try { corrections = JSON.parse(value); } catch { corrections = []; }
    }
    corrections.push({ merchant, category: userCategory, timestamp: new Date().toISOString() });
    await Preferences.set({ key, value: JSON.stringify(corrections) });
}

/** Retrieve learned category for a merchant */
async function getLearnedCategory(merchant: string): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'category_corrections' });
    if (!value) return null;
    try {
        const corrections: Array<{ merchant: string; category: string; timestamp: string }> = JSON.parse(value);
        const match = corrections.find(c => c.merchant.toLowerCase() === merchant.toLowerCase());
        return match ? match.category : null;
    } catch { return null; }
}

/** Request SMS permissions (READ_SMS, RECEIVE_SMS) at runtime. */
export async function requestSmsPermissions(): Promise<boolean> {
    try {
        console.log('🔐 Checking SMS permissions...');
        const status = await SMSReader.checkPermissions();
        console.log('Permission status:', JSON.stringify(status));
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

export async function checkSmsPermissionsOnly(): Promise<boolean> {
    try {
        const status = await SMSReader.checkPermissions();
        return status && (status.read === 'granted' || status === 'granted' || status.messages === 'granted');
    } catch { return false; }
}

/** Parse a raw SMS text into a Transaction object */
async function parseSmsToTransaction(smsBody: string, smsDate: string, smsFrom: string): Promise<Transaction | null> {
    // ==================== FILTERING ====================
    const spamKeywords = [
        'click', 'offer', 'deal', 'sale', 'discount', 'save', 'cashback',
        'pre-approved', 'pre approved', 'loan approved', 'get loan',
        'apply now', 'limited time', 'hurry', 'expires', 'validity',
        'download', 'install', 'app', '.com', '.in', 'http',
        'congratulations', 'congrats', 'winner', 'prize', 'reward',
        'good news', 'boost', 'instant funds', 'personal loan', 'credit card offer',
        'jiohotstar', 'netflix', 'amazon prime', 'spotify',
        'otp', 'password', 'verification code', 'login', 'authentication'
    ];
    const lowerBody = smsBody.toLowerCase();
    if (spamKeywords.some(k => lowerBody.includes(k))) return null;
    if (/available\s+bal|avl\s+bal|current\s+bal/i.test(smsBody)) return null;
    if (/trade|traded|bse|nse|stock|equity|derivative|sip\s+purchase/i.test(smsBody)) return null;
    if (/transaction\s+check\s+alert|we\s+tried\s+to\s+contact/i.test(smsBody)) return null;
    if (/autopay|mandate|standing instruction/i.test(smsBody)) return null;
    if (!/(sent|spent|debited|credited|received|paid|withdrawn|transferred)/i.test(smsBody)) return null;

    // ==================== PARSING ====================
    const amountRegex = /(?:Rs\.?|INR|₹)\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/i;
    const debitRegex = /(sent|debited|spent|paid|withdraw)/i;
    const creditRegex = /(credited|received|added|deposit|refund)/i;
    const toMerchantRegex = /To\s+([A-Za-z0-9\s.]+?)(?:\s+On|\s+Ref|$)/i;
    const fromVpaRegex = /from\s+VPA\s+(\d+)@([a-z]+)/i;
    const merchantRegex = /(?:at|to|from)\s+([A-Za-z0-9\s\&]+?)(?:\s(?:on|via|using|ref)|\.|$)/i;
    const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
    const refRegex = /(?:Ref(?:\s?no)?|Reference|Txn(?:\s?ID)?)[:\s]+([A-Z0-9]+)/i;

    const amountMatch = smsBody.match(amountRegex);
    if (!amountMatch) return null;
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const type = debitRegex.test(smsBody) ? 'debit' : creditRegex.test(smsBody) ? 'credit' : 'debit';

    // ---- Merchant extraction ----
    let merchant = smsFrom || 'Unknown';
    const toMatch = smsBody.match(toMerchantRegex);
    if (toMatch) {
        merchant = toMatch[1].trim();
    } else {
        const vpaMatch = smsBody.match(fromVpaRegex);
        if (vpaMatch) {
            merchant = vpaMatch[2];
        } else {
            const genericMatch = smsBody.match(merchantRegex);
            if (genericMatch) {
                merchant = genericMatch[1].trim();
                if (/^\d{10}$/.test(merchant) || merchant.includes('7308080808') || merchant.includes('18002586161')) {
                    merchant = 'Unknown';
                }
            }
        }
    }
    // ---- Normalization ----
    const merchantLower = merchant.toLowerCase();
    const MERCHANT_MAPPING: Record<string, string> = {
        'ptaxis': 'Paytm Taxi',
        'ptyes': 'Paytm',
        'bigtree': 'BookMyShow',
        'bigtree entertainment': 'BookMyShow',
        'pvr inox': 'PVR INOX',
        'pvr inox limited': 'PVR INOX',
        'sriitoma gaming': 'Gaming',
        'eternal limited': 'Meal Card (Pluxee)',
        'eternal lim': 'Meal Card (Pluxee)',
        'pluxee': 'Meal Card (Pluxee)',
        'sodexo': 'Meal Card (Sodexo)',
        'bhoj restaurant': 'Bhoj Restaurant',
        'connaught plaza restaur': 'Connaught Plaza',
        'indmoney': 'INDmoney',
        'indstocks': 'INDstocks',
        'valid upi unit of indstocks': 'INDstocks',
        'blinkit': 'Blinkit',
        'bigbasket': 'BigBasket',
        'airtel': 'Airtel',
        'hsquare sports': 'HSQUARE Sports',
        'ranco dental clinic': 'Ranco Dental Clinic',
        'shree ambica medicos': 'Ambica Medicos',
        'khurana crockery corner': 'Khurana Crockery'
    };
    for (const [key, val] of Object.entries(MERCHANT_MAPPING)) {
        if (merchantLower.includes(key)) { merchant = val; break; }
    }

    // ---- Date parsing ----
    const dateMatch = smsBody.match(dateRegex);
    let dateString: string; // Store as YYYY-MM-DD

    if (dateMatch) {
        // If date is in SMS body, parse it
        try {
            const parts = dateMatch[0].split(/[-/]/);
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            let year = parseInt(parts[2]);
            if (year < 100) year += year < 50 ? 2000 : 1900;
            // Format as YYYY-MM-DD
            dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        } catch {
            // Fallback to SMS timestamp
            const smsTimestamp = new Date(smsDate);
            const year = smsTimestamp.getFullYear();
            const month = smsTimestamp.getMonth() + 1;
            const day = smsTimestamp.getDate();
            dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
    } else {
        // No date in SMS body, use SMS timestamp
        const smsTimestamp = new Date(smsDate);
        const year = smsTimestamp.getFullYear();
        const month = smsTimestamp.getMonth() + 1;
        const day = smsTimestamp.getDate();
        dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Convert to ISO format for storage
    // If date was parsed from SMS body, use midnight UTC; otherwise preserve SMS timestamp
    const isoDate = dateMatch
        ? new Date(dateString + 'T00:00:00.000Z').toISOString()
        : new Date(smsDate).toISOString();

    // ---- Category determination ----
    // 1. Learned corrections
    const learned = await getLearnedCategory(merchant);
    let category = learned || 'Other';
    if (!learned) {
        // 2. Keyword based
        const lowerMerchant = (merchant || '').toLowerCase();
        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(k => lowerMerchant.includes(k))) { category = cat; break; }
        }
        // 3. Smart rules
        category = smartCategorize(merchant, amount, smsBody, category);
        // 4. Gemini fallback
        if (category === 'Other' && geminiService) {
            const availableCategories = Object.keys(CATEGORY_KEYWORDS);
            try {
                const aiCat = await geminiService.categorizeTransaction({
                    merchant,
                    amount,
                    smsBody,
                    availableCategories
                });
                if (aiCat && aiCat !== 'Other') category = aiCat;
            } catch (e) { console.error('Gemini error', e); }
        }
    }

    // ---- Unique ID ----
    const refMatch = smsBody.match(refRegex);
    let id: string;
    if (refMatch && refMatch[1]) {
        id = `sms-${refMatch[1]}`;
    } else {
        const unique = `${smsBody}|${isoDate}|${smsFrom}`;
        let hash = 0;
        for (let i = 0; i < unique.length; i++) {
            const ch = unique.charCodeAt(i);
            hash = ((hash << 5) - hash) + ch;
            hash = hash & hash;
        }
        id = `sms-${Math.abs(hash)}`;
    }

    const tx: Transaction = {
        id,
        amount,
        type,
        category,
        merchant,
        date: isoDate,
        isManual: false,
        rawSms: smsBody,
        isPending: true // NEW: All SMS transactions start as pending review
    };
    return tx;
}

/** Initialize SMS reading and return all parsed transactions. */
export async function fetchAllSmsTransactions(): Promise<Transaction[]> {
    if (Capacitor.getPlatform() === 'ios') {
        console.log('🍎 iOS detected: SMS reading is not supported. Skipping.');
        return [];
    }
    const granted = await requestSmsPermissions();
    if (!granted) {
        console.warn('SMS permissions not granted');
        throw new Error('SMS permissions not granted');
    }
    try {
        // Optimization: Incremental Sync
        const lastSyncTimeStr = await SecureStorageService.get<string>('last_sms_sync_time');
        const lastSyncTime = lastSyncTimeStr ? parseInt(lastSyncTimeStr) : 0;

        // If first run, maybe limit to last 6 months to avoid massive initial load?
        // For now, we'll fetch all if it's the first time, but subsequent runs will be fast.
        const filter: any = {};
        if (lastSyncTime > 0) {
            console.log(`🕒 Incremental Sync: Fetching SMS after ${new Date(lastSyncTime).toLocaleString()}`);
            filter.minDate = lastSyncTime;
        } else {
            console.log('🕒 First Sync: Fetching all SMS messages...');
        }

        const result = await SMSReader.getMessages(filter);
        const messages: Array<{ body: string; date: number; address: string }> = result?.messages || [];
        console.log(`📱 Found ${messages.length} new SMS messages`);

        const transactions: Transaction[] = [];
        const unknownTransactions: { index: number; tx: Transaction }[] = [];

        // Track max date to update sync time
        let maxDate = lastSyncTime;

        // 1. Initial Parse (Keywords + Smart Rules)
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            // Ensure we update maxDate
            if (msg.date > maxDate) maxDate = msg.date;

            const tx = await parseSmsToTransaction(msg.body, new Date(msg.date).toISOString(), msg.address);
            if (tx) {
                // First Sync (lastSyncTime == 0) -> Auto Approve (isPending = false)
                // Incremental Sync -> Require Review (isPending = true)
                tx.isPending = lastSyncTime > 0;
                transactions.push(tx);
                if (tx.category === 'Other') {
                    unknownTransactions.push({ index: transactions.length - 1, tx });
                }
            }
        }

        // 2. Batch AI Categorization (if enabled and needed)
        if (unknownTransactions.length > 0 && geminiService) {
            console.log(`🤖 AI Categorizing ${unknownTransactions.length} unknown transactions...`);

            // Prepare batch items
            const batchItems = unknownTransactions.map(item => ({
                id: item.tx.id,
                merchant: item.tx.merchant,
                amount: item.tx.amount,
                smsBody: item.tx.rawSms
            }));

            const availableCategories = Object.keys(CATEGORY_KEYWORDS);

            // Call Gemini in batch
            const categorizedMap = await geminiService.categorizeBatch(batchItems, availableCategories);

            // Update transactions with AI results
            for (const item of unknownTransactions) {
                const newCategory = categorizedMap[item.tx.id];
                if (newCategory && newCategory !== 'Other') {
                    transactions[item.index].category = newCategory;
                    // Optional: Learn this correction automatically?
                    // await recordCategoryCorrection(item.tx.merchant, newCategory);
                }
            }
            console.log(`✅ AI Categorization complete.`);
        }

        console.log(`📊 Parsed ${transactions.length} valid transactions`);

        // Update last sync time
        if (maxDate > lastSyncTime) {
            await SecureStorageService.set('last_sms_sync_time', maxDate.toString());
        }

        return transactions;
    } catch (e) {
        console.error('Error reading SMS', e);
        throw e;
    }
}

/** Export debug data */
export async function exportSmsDebugData(): Promise<string> {
    if (Capacitor.getPlatform() === 'ios') {
        throw new Error('SMS reading is not supported on iOS due to privacy restrictions.');
    }
    const granted = await requestSmsPermissions();
    if (!granted) throw new Error('SMS permissions not granted');
    const result = await SMSReader.getMessages({});
    const messages: Array<{ body: string; date: string; address: string }> = result?.messages || [];
    const parsedMessages = await Promise.all(messages.map(async (msg, idx) => {
        const parsed = await parseSmsToTransaction(msg.body, msg.date, msg.address);
        return {
            index: idx + 1,
            raw: { from: msg.address, date: msg.date, body: msg.body },
            parsed: parsed ? {
                id: parsed.id,
                amount: parsed.amount,
                type: parsed.type,
                category: parsed.category,
                merchant: parsed.merchant,
                date: parsed.date
            } : null,
            parseSuccess: parsed !== null
        };
    }));
    const debugData = {
        exportDate: new Date().toISOString(),
        totalMessages: messages.length,
        messages: parsedMessages,
        summary: {
            totalParsed: parsedMessages.filter(m => m.parseSuccess).length,
            totalFailed: parsedMessages.filter(m => !m.parseSuccess).length
        }
    };
    return JSON.stringify(debugData, null, 2);
}
