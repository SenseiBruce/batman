import { beforeEach, describe, expect, it, vi } from 'vitest';

const { preferencesGet, getLearnedCategory } = vi.hoisted(() => ({
  preferencesGet: vi.fn(async () => ({ value: null as string | null })),
  getLearnedCategory: vi.fn(async (_merchant?: string) => null as string | null),
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: preferencesGet,
    set: vi.fn(async () => undefined),
  },
}));

vi.mock('@capacitor/core', () => ({
  registerPlugin: () => ({
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getMessages: vi.fn(),
  }),
  Capacitor: {
    getPlatform: () => 'web',
  },
}));

vi.mock('./secureStorageService', () => ({
  SecureStorageService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('./geminiCategorizationService', () => ({
  GeminiCategorizationService: vi.fn(),
}));

vi.mock('./merchantLearningService', () => ({
  MerchantLearningService: {
    getLearnedCategory: (merchant: string) => getLearnedCategory(merchant),
    learnMapping: vi.fn(),
  },
}));

import { parseSmsToTransaction, smartCategorize } from './smsService';

const smsDate = '2026-08-15T10:00:00.000Z';

describe('smartCategorize', () => {
  it('maps large SIP / mutual fund transfers to Investments', () => {
    expect(
      smartCategorize('Groww', 75000, 'Rs. 75000 sent for SIP mutual fund purchase', 'Other')
    ).toBe('Investments');
  });

  it('maps large furniture / electronics purchases to Shopping', () => {
    expect(
      smartCategorize('Croma', 62000, 'Rs. 62000 spent on electronics appliance', 'Other')
    ).toBe('Shopping');
  });

  it('maps round amounts to personal names as Personal Transfers', () => {
    expect(smartCategorize('Rahul Kumar', 2000, 'Rs. 2000 sent To Rahul Kumar', 'Other')).toBe(
      'Personal Transfers'
    );
  });

  it('does not treat non-round amounts to a person as Personal Transfers', () => {
    expect(smartCategorize('Rahul Kumar', 2150, 'Rs. 2150 sent To Rahul Kumar', 'Other')).toBe(
      'Other'
    );
  });

  it('always categorizes meal cards as Food & Dining', () => {
    expect(smartCategorize('Pluxee', 180, 'Rs. 180 spent at Pluxee', 'Other')).toBe(
      'Food & Dining'
    );
    expect(smartCategorize('Sodexo', 90, 'Rs. 90 spent at Sodexo', 'Shopping')).toBe(
      'Food & Dining'
    );
  });

  it('maps tiny unknown amounts to UPI Transactions', () => {
    expect(smartCategorize('Unknown', 20, 'Rs. 20 sent via UPI', 'Other')).toBe('UPI Transactions');
  });

  it('keeps the keyword fallback when no heuristic matches', () => {
    expect(smartCategorize('Random Store', 750, 'Rs. 750 spent at Random Store', 'Shopping')).toBe(
      'Shopping'
    );
  });
});

describe('parseSmsToTransaction', () => {
  beforeEach(() => {
    preferencesGet.mockResolvedValue({ value: null });
    getLearnedCategory.mockResolvedValue(null);
  });

  it('returns null for promotional / spam messages', async () => {
    const result = await parseSmsToTransaction(
      'Rs. 500 cashback offer. Click here to apply now, limited time deal.',
      smsDate,
      'AD-PROMO'
    );
    expect(result).toBeNull();
  });

  it('returns null for OTP and login messages', async () => {
    const result = await parseSmsToTransaction(
      'OTP 482193 for login verification. Do not share your password.',
      smsDate,
      'VM-HDFCBK'
    );
    expect(result).toBeNull();
  });

  it('returns null for available-balance alerts even when an amount is present', async () => {
    const result = await parseSmsToTransaction(
      'Avl Bal Rs. 12000. Last txn Rs. 500 spent at Swiggy.',
      smsDate,
      'VM-HDFCBK'
    );
    expect(result).toBeNull();
  });

  it('returns null when the body has no debit or credit action verb', async () => {
    const result = await parseSmsToTransaction(
      'Rs. 1500 is the pending amount on your statement.',
      smsDate,
      'VM-HDFCBK'
    );
    expect(result).toBeNull();
  });

  it('parses a valid debit SMS with merchant, amount, date, and category', async () => {
    const result = await parseSmsToTransaction(
      'Rs. 450 sent To Swiggy On 15-08-2026 Ref ABC123. Your A/c has been debited.',
      smsDate,
      'VM-HDFCBK'
    );
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(450);
    expect(result!.type).toBe('debit');
    expect(result!.merchant).toBe('Swiggy');
    expect(result!.category).toBe('Food & Dining');
    expect(result!.id).toBe('sms-ABC123');
    expect(result!.isPending).toBe(true);
    expect(result!.date.startsWith('2026-08-15')).toBe(true);
  });

  it('parses credited messages as credit transactions', async () => {
    const result = await parseSmsToTransaction(
      'Rs. 1,200.00 credited To Salary On 15-08-2026 Ref SAL99.',
      smsDate,
      'VM-HDFCBK'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('credit');
    expect(result!.amount).toBe(1200);
  });

  it('normalizes known merchant aliases such as ptaxis', async () => {
    const result = await parseSmsToTransaction(
      'Rs. 250 sent To ptaxis On 15-08-2026 Ref TX99. Debited.',
      smsDate,
      'VM-PAYTM'
    );
    expect(result).not.toBeNull();
    expect(result!.merchant).toBe('Paytm Taxi');
    expect(result!.category).toBe('Transport');
  });

  it('categorizes round UPI transfers to a personal name as Personal Transfers', async () => {
    const result = await parseSmsToTransaction(
      'Rs. 2000 sent To Rahul Kumar On 15-08-2026 Ref PN77. Debited.',
      smsDate,
      'VM-HDFCBK'
    );
    expect(result).not.toBeNull();
    expect(result!.merchant).toBe('Rahul Kumar');
    expect(result!.category).toBe('Personal Transfers');
  });

  it('prefers a learned merchant category over keyword matching', async () => {
    getLearnedCategory.mockResolvedValue('Shopping');
    const result = await parseSmsToTransaction(
      'Rs. 450 sent To Swiggy On 15-08-2026 Ref LEARN1. Your A/c has been debited.',
      smsDate,
      'VM-HDFCBK'
    );
    expect(result).not.toBeNull();
    expect(result!.category).toBe('Shopping');
  });

  it('filters out messages that look like stock or SIP purchase alerts', async () => {
    const result = await parseSmsToTransaction(
      'Rs. 5000 sent for SIP purchase of equity on NSE. Debited.',
      smsDate,
      'VM-GROWW'
    );
    expect(result).toBeNull();
  });
});
