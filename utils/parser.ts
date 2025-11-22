import { REGEX_PATTERNS, CATEGORY_KEYWORDS, DEFAULT_CATEGORIES } from "../constants";
import { Transaction, TransactionType } from "../types";

export const parseSms = (smsText: string): Partial<Transaction> | null => {
  const amountMatch = smsText.match(REGEX_PATTERNS.AMOUNT);
  if (!amountMatch) return null;

  const amountStr = amountMatch[1].replace(/,/g, '');
  const amount = parseFloat(amountStr);

  let type: TransactionType = 'debit';
  if (REGEX_PATTERNS.CREDIT_TYPE.test(smsText)) {
    type = 'credit';
  }

  // Merchant extraction
  let merchant = "Unknown";
  const merchantMatch = smsText.match(REGEX_PATTERNS.MERCHANT);
  if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1].trim();
  }

  // Categorization logic
  let category = "Other";
  const lowerMerchant = merchant.toLowerCase();
  const lowerText = smsText.toLowerCase();
  
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lowerMerchant.includes(k) || lowerText.includes(k))) {
      category = catName;
      break;
    }
  }

  // Ensure category exists in our default list, otherwise fallback
  if (!DEFAULT_CATEGORIES.find(c => c.name === category)) {
    category = "Other";
  }

  // Date extraction - simple fallback to today if not found
  // In a real app, we might parse the date from SMS
  const date = new Date().toISOString();

  return {
    amount,
    type,
    merchant,
    category,
    date,
    rawSms: smsText,
    isManual: false,
  };
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};