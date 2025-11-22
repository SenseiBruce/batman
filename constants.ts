import { Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#F87171', icon: '🍔', budget: 5000, alertsEnabled: true },
  { id: '2', name: 'Transport', color: '#60A5FA', icon: '🚗', budget: 3000, alertsEnabled: true },
  { id: '3', name: 'Shopping', color: '#A78BFA', icon: '🛍️', budget: 5000, alertsEnabled: true },
  { id: '4', name: 'Utilities', color: '#34D399', icon: '💡', budget: 2000, alertsEnabled: true },
  { id: '5', name: 'Entertainment', color: '#FBBF24', icon: '🎬', budget: 1500, alertsEnabled: true },
  { id: '6', name: 'Health', color: '#EC4899', icon: '💊', budget: 2000, alertsEnabled: true },
  { id: '7', name: 'Groceries', color: '#10B981', icon: '🥦', budget: 6000, alertsEnabled: true },
  { id: '8', name: 'Other', color: '#9CA3AF', icon: '📦', budget: 1000, alertsEnabled: true },
];

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dominos', 'mcdonald', 'kfc', 'pizza', 'burger'],
  'Transport': ['uber', 'ola', 'rapido', 'petrol', 'fuel', 'metro', 'bus', 'taxi', 'pump'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'shop', 'mall', 'store', 'retail'],
  'Utilities': ['electricity', 'water', 'gas', 'internet', 'wifi', 'airtel', 'jio', 'vodafone', 'bescom'],
  'Entertainment': ['netflix', 'prime', 'spotify', 'movie', 'bookmyshow', 'cinema', 'game'],
  'Groceries': ['bigbasket', 'blinkit', 'dmart', 'supermarket', 'fresh', 'mart', 'zepto'],
  'Health': ['pharmacy', 'hospital', 'doctor', 'med', 'apollo', '1mg'],
};

// Regex Patterns adapted for JS from the prompt
// Note: JS regex differs slightly from Python/Dart (e.g., named groups support, flags)
export const REGEX_PATTERNS = {
  // Matches: Rs. 500, INR 500, Rs 500.00
  AMOUNT: /(?:Rs\.?|INR|₹)\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  // Simple keyword checks usually suffice for type, but using regex for context
  DEBIT_TYPE: /(debited|spent|paid|sent|withdraw)/i,
  CREDIT_TYPE: /(credited|received|added|deposit|refund)/i,
  // Attempt to capture merchant after 'at', 'to', 'from'
  MERCHANT: /(?:at|to|from)\s+([A-Za-z0-9\s&]+?)(?:\s(?:on|via|using|ref)|\.|$)/i,
  // Date matcher (DD-MM-YYYY or DD/MM/YYYY or similar)
  DATE: /(\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)/,
};