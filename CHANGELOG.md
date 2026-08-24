# Changelog

All notable changes to Jarvis Expense Tracker are documented here.

## Unreleased

- Insights Days Left card can copy remaining days in the month.
- Budget Analysis card can copy a text summary of spend vs budget.
## [Unreleased]

### Added
- Skip button in pending SMS review to discard false positives
- Persist merchant → category corrections so the next SMS from that merchant is auto-categorized
- Tests for merchant learning and the review modal

- Transaction CSV export now respects the current search, month, and filter selection

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
