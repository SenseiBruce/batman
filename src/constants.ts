import { Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#F87171', icon: '🍔', budget: 5000, alertsEnabled: true },
  { id: '2', name: 'Transport', color: '#60A5FA', icon: '🚗', budget: 3000, alertsEnabled: true },
  { id: '3', name: 'Shopping', color: '#A78BFA', icon: '🛍️', budget: 5000, alertsEnabled: true },
  { id: '4', name: 'Utilities', color: '#34D399', icon: '💡', budget: 2000, alertsEnabled: true },
  { id: '5', name: 'Entertainment', color: '#FBBF24', icon: '🎬', budget: 1500, alertsEnabled: true },
  { id: '6', name: 'Health', color: '#EC4899', icon: '💊', budget: 2000, alertsEnabled: true },
  { id: '7', name: 'Groceries', color: '#10B981', icon: '🥦', budget: 6000, alertsEnabled: true },
  { id: '8', name: 'Investments', color: '#14B8A6', icon: '📈', budget: 10000, alertsEnabled: true },
  { id: '9', name: 'UPI Transactions', color: '#8B5CF6', icon: '💸', budget: 5000, alertsEnabled: true },

  // NEW CATEGORIES (Phase 1)
  { id: '11', name: 'Personal Transfers', color: '#F59E0B', icon: '👥', budget: 0, alertsEnabled: false },
  { id: '12', name: 'Home & Kitchen', color: '#8B5CF6', icon: '🏠', budget: 3000, alertsEnabled: true },
  { id: '13', name: 'Sports & Fitness', color: '#EF4444', icon: '⚽', budget: 2000, alertsEnabled: true },
  { id: '14', name: 'Subscriptions', color: '#10B981', icon: '📺', budget: 1500, alertsEnabled: true },
  { id: '15', name: 'Gifts & Donations', color: '#EC4899', icon: '🎁', budget: 1000, alertsEnabled: true },
  { id: '16', name: 'Bills & Recharges', color: '#6366F1', icon: '📱', budget: 2000, alertsEnabled: true },

  { id: '10', name: 'Other', color: '#9CA3AF', icon: '📦', budget: 1000, alertsEnabled: true },
];

// Expanded keyword lists based on actual SMS data analysis
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': [
    // Chain restaurants & delivery
    'swiggy', 'zomato', 'dominos', 'mcdonald', 'kfc', 'pizza', 'burger',
    // Local restaurants (from your data)
    'bhoj', 'restaurant', 'cafe', 'bistro', 'dhaba', 'canteen',
    // Meal cards (Pluxee/Sodexo)
    'pluxee', 'sodexo', 'eternal', 'meal card', 'food card',
    // Other food
    'food', 'snacks', 'bakery', 'sweet', 'tiffin', 'mess',
    // Specific merchants from your data
    'connaught plaza', 'paerul snacks'
  ],

  'Transport': [
    // Ride hailing
    'uber', 'ola', 'rapido', 'cab', 'taxi', 'auto',
    // Paytm variants (from your data)
    'ptaxis', 'ptyes', 'paytm taxi',
    // Fuel & parking
    'petrol', 'fuel', 'diesel', 'pump', 'parking', 'toll', 'fastag',
    // Public transport
    'metro', 'bus', 'train'
  ],

  'Shopping': [
    // Online marketplaces
    'amazon', 'flipkart', 'myntra', 'meesho',
    // Physical stores
    'shop', 'mall', 'store', 'retail', 'market',
    // Categories
    'clothing', 'footwear', 'fashion', 'electronics', 'appliance',
    // From your data
    'shoppers stop'
  ],

  'Utilities': [
    // Telecom
    'airtel', 'jio', 'vodafone', 'vi', 'bsnl', 'postpaid', 'broadband',
    // Services
    'electricity', 'water', 'gas', 'internet', 'wifi', 'bescom',
    // Specific from your data
    'electricity board'
  ],

  'Entertainment': [
    // Streaming
    'netflix', 'prime', 'amazon prime', 'hotstar', 'jiohotstar', 'spotify', 'youtube premium',
    // Movies & theaters (from your data)
    'pvr', 'inox', 'bigtree', 'bookmyshow', 'cinema', 'multiplex', 'movie',
    // Gaming
    'gaming', 'game', 'playstation', 'xbox', 'steam', 'sriitoma gaming',
    // Other
    'concert', 'show', 'event'
  ],

  'Groceries': [
    // Online grocery
    'bigbasket', 'blinkit', 'zepto', 'dunzo', 'amazon fresh',
    // Supermarkets
    'dmart', 'reliance fresh', 'more', 'supermarket', 'hypercity',
    // Local stores
    'kirana', 'provision', 'mart', 'vegetables', 'fruits'
  ],

  'Health': [
    // Pharmacies
    'pharmacy', 'apollo', '1mg', 'netmeds', 'pharmeasy', 'medicos', 'chemist',
    // Medical facilities (from your data)
    'hospital', 'clinic', 'dental', 'ranco dental',
    // Services
    'doctor', 'medical', 'medicine', 'health', 'diagnostic', 'lab', 'test'
  ],

  'Investments': [
    // Trading platforms
    'zerodha', 'groww', 'upstox', 'angel one', '5paisa',
    // From your data
    'indmoney', 'indstocks', 'valid upi unit',
    // Investment types
    'sip', 'mutual fund', 'mutual', 'stock', 'equity', 'mf',
    // HDFC MF specific
    'hdfc defence', 'hdfc mutual', 'nav', 'units', 'folio',
    // Others
    'coin', 'kuvera', 'sumangli', 'indiandesign', 'indianesign'
  ],

  'UPI Transactions': [
    // UPI apps
    'upi', 'paytm', 'phonepe', 'gpay', 'google pay', 'bhim', 'freecharge',
    // Transfer keywords
    'transfer', 'sent to', 'paid to'
  ],

  // NEW CATEGORIES

  'Personal Transfers': [
    // Common surnames (Indian)
    'kumar', 'singh', 'sharma', 'prasad', 'pal', 'verma', 'gupta', 'jain',
    'yadav', 'reddy', 'nair', 'iyer', 'patel', 'shah', 'agarwal',
    // Titles
    'mr.', 'mrs.', 'miss', 'ms.',
    // Names from your data
    'pintu', 'sumit', 'kushagra', 'kuldeep', 'praveen', 'narender',
    'siva', 'bittu', 'ashavir', 'sandeep', 'deep chand', 'gaddiparthi'
  ],

  'Home & Kitchen': [
    // From your data
    'khurana crockery', 'crockery', 'corner',
    // Categories
    'utensils', 'cookware', 'kitchen', 'home decor', 'furniture',
    'appliances', 'bedding', 'curtains', 'home', 'interior'
  ],

  'Sports & Fitness': [
    // From your data
    'hsquare', 'sports',
    // Gyms
    'gym', 'fitness', 'cult', 'gold gym', 'yoga', 'crossfit',
    // Stores
    'decathlon', 'nike', 'adidas', 'puma', 'sports store'
  ],

  'Subscriptions': [
    'subscription', 'membership', 'annual', 'monthly',
    'netflix', 'prime', 'spotify', 'youtube premium'
  ],

  'Gifts & Donations': [
    'gift', 'present', 'donation', 'charity', 'ngo',
    'gift card', 'voucher'
  ],

  'Bills & Recharges': [
    'recharge', 'bill payment', 'bill', 'mobile recharge',
    'dth', 'fastag', 'lpg', 'cylinder'
  ]
};

// Merchant name normalization - map variations to clean names
export const MERCHANT_MAPPING: Record<string, string> = {
  // Payment services
  'ptaxis': 'Paytm Taxi',
  'ptyes': 'Paytm',

  // Entertainment
  'bigtree': 'BookMyShow',
  'bigtree entertainment': 'BookMyShow',
  'pvr inox': 'PVR INOX',
  'pvr inox limited': 'PVR INOX',
  'sriitoma gaming': 'Gaming',

  // Food & Meal Cards
  'eternal limited': 'Meal Card (Pluxee)',
  'eternal lim': 'Meal Card (Pluxee)',
  'pluxee': 'Meal Card (Pluxee)',
  'sodexo': 'Meal Card (Sodexo)',
  'bhoj restaurant': 'Bhoj Restaurant',
  'connaught plaza restaur': 'Connaught Plaza',

  // Investments
  'indmoney': 'INDmoney',
  'indstocks': 'INDstocks',
  'valid upi unit of indstocks': 'INDstocks',

  // Groceries
  'blinkit': 'Blinkit',
  'bigbasket': 'BigBasket',

  // Utilities
  'airtel': 'Airtel',

  // Sports
  'hsquare sports': 'HSQUARE Sports',

  // Health
  'ranco dental clinic': 'Ranco Dental Clinic',
  'shree ambica medicos': 'Ambica Medicos',

  // Home & Kitchen
  'khurana crockery corner': 'Khurana Crockery',
};

// Regex Patterns
export const REGEX_PATTERNS = {
  AMOUNT: /(?:Rs\.?|INR|₹)\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  DEBIT_TYPE: /(debited|spent|paid|sent|withdraw)/i,
  CREDIT_TYPE: /(credited|received|added|deposit|refund)/i,
  MERCHANT: /(?:at|to|from)\s+([A-Za-z0-9\s\&]+?)(?:\s(?:on|via|using|ref)|\.|$)/i,
  DATE: /(\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)/,
};