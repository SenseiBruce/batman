# IMPULSE CONTROL & LIFE COST Implementation Plan

## Overview
Transform the app from a passive tracker to an active behavior modifier.
1. **Life Cost Converter:** Show expenses in terms of "hours worked" based on user's hourly wage.
2. **Cooldown Wishlist:** A place to store "wants" with a mandatory cooldown timer (default 72h) to prevent impulse buys.

## 1. Data Model Changes
**File:** `src/types.ts`

```typescript
export interface WishlistItem {
  id: string;
  name: string;
  amount: number;
  url?: string;
  note?: string;
  dateAdded: string; // ISO string
  cooldownHours: number; // e.g., 24, 48, 72
  status: 'locked' | 'unlocked' | 'purchased' | 'abandoned';
}
```

## 2. Settings Update
**File:** `src/pages/Settings.tsx`
*   Add section "Behavioral Settings".
*   Input: "Hourly Wage Estimate" (needed for Time Cost calculation).
*   Input: "Default Cooldown Period" (default 72h).

## 3. App State & Logic
**File:** `src/App.tsx`
*   State: `hourlyWage` (number).
*   State: `wishlist` (WishlistItem[]).
*   Effect: Load/Save these from `SecureStorageService`.
*   Functions:
    *   `addWishlistItem(item)`
    *   `updateWishlistItem(item)`
    *   `deleteWishlistItem(id)`

## 4. UI Components

### A. Time Cost Display
**File:** `src/components/TimeCostDisplay.tsx` (NEW)
*   Props: `amount: number`, `hourlyWage: number`.
*   Logic: `hours = amount / hourlyWage`.
*   Render: "🕒 2h 30m work" (Subtle text).
*   Usage: Inject into `TransactionList` items.

### B. Wishlist Page
**File:** `src/pages/Wishlist.tsx` (NEW)
*   **Header:** "Impulse Control".
*   **List:** Items sorted by status (Locked -> Unlocked).
*   **Item Card:**
    *   Name, Price, Time Cost.
    *   **Locked:** Progress bar / Countdown timer ("Unlock in 23h"). Button disabled.
    *   **Unlocked:**
        *   "Buy It" -> Converts to a Transaction (opens Add Transaction with pre-filled data) + Marks as Purchased.
        *   "Don't Need It" -> Marks as Abandoned (+ Animation "You saved $X!").
*   **Add Button:** FAB to add new Wishlist item.

### C. Dashboard Integration
**File:** `src/pages/Dashboard.tsx`
*   Add a "Wishlist" widget or button.
*   Show "X items unlocking soon".

## 5. Deployment Strategy
1.  **Settings & State:** Implement Storage and App.tsx changes.
2.  **Time Cost:** Implement `TimeCostDisplay` and add to Transactions.
3.  **Wishlist:** Build the `Wishlist` page and components.
4.  **Integration:** Link it up.
