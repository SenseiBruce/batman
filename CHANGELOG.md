# Changelog

All notable changes to Jarvis Expense Tracker are documented here.

## Unreleased

- Restore components that were duplicated during stacked PR merges, and clear the review modal timer on close.
- Insights Days Left card can copy remaining days in the month.
- Insights Spending Forecast can copy projected spend, budget, and daily average.
- Insights can copy budget alert lines (category and percent used).
- Persist the Transactions merchant search query across reloads.
- Persist the Transactions category filter across reloads.
- Transactions remembers the From/To date range across reloads.
- Transactions remembers min/max amount filters across reloads.
- Transactions can copy the visible (filtered) transaction count.
- Transactions can copy a filtered spend summary (debits, credits, count).
- Settings can copy the default cooldown hours.
- Settings About can copy the app version string.
- Settings About can copy the privacy tagline.
- Budget Analysis card can copy a text summary of spend vs budget.
## [Unreleased]

### Added
- Skip button in pending SMS review to discard false positives
- Persist merchant → category corrections so the next SMS from that merchant is auto-categorized
- Tests for merchant learning and the review modal

- Transaction CSV export now respects the current search, month, and filter selection

- SMS and statement imports skip merchant+amount+day duplicates, even when IDs differ

- Insights "Copy summary" copies a plain-text month report (expenses, budget left, avg/day, MoM, top categories)


- Settings “Download local backup” exports transactions, categories, goals, wishlist, wage, cooldown, and subscriptions as JSON without cloud sign-in


- Subscriptions “Copy summary” copies merchants, cadence, next due dates, and estimated monthly cost
- Savings Goals widget can copy a text summary of progress (saved vs target, completed count).
- Insights Top Merchants card can copy a ranked spend summary to the clipboard
- Dashboard AI Predictions card can copy insight/forecast counts to the clipboard
- Dashboard Jarvis insight card can copy title and message to the clipboard
- Accounts page can copy net worth and account balances as text
- Persist the dashboard/insights selected month (`YYYY-MM`) in `localStorage` so it survives reloads
- Persist the Transactions page month filter (`YYYY-MM`) in `localStorage`
- Persist Transactions list vs calendar view in `localStorage`
- Settings can copy the hourly wage estimate.
- Settings can copy the selected currency (symbol, name, and code).

## 1.1.0 - 2026-08-19

### Added

- Vitest coverage for budget, sync, SMS, Gemini, split, and insight services
- Component tests for Settings API key, PIN, and backup panels
- Page tests for Transactions sync/export toasts and Jarvis chat context
- Structured logger (`src/utils/logger.ts`) and optional Sentry via `VITE_SENTRY_DSN`
- GitHub Actions dependency audit, Dependabot, Docker Compose, and a Dev Container

### Changed

- Firebase web config reads from `VITE_FIREBASE_*` environment variables
- Settings and Insights pages split into smaller presentational components

## 1.0.0 - 2026-01-01

- Initial Jarvis expense tracker (SMS parse, budgets, Capacitor Android app)
