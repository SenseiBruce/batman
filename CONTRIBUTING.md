# Contributing

## Branches

- Branch from `main` (or `master`).
- Name branches by intent: `feat/sms-parser`, `fix/budget-forecast`, `test/prediction-service`.

## Commits

Prefer [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: parse round UPI transfers as Personal Transfers
fix: ignore available-balance SMS
test: cover predictMonthlySpending for current month
chore: move Firebase config to VITE_ env vars
```

Keep each feature or fix in its **own commit** (or small PR) that includes the tests pinning the new behavior. Avoid bulk commits that mix formatting, refactors, and features.

## Checks before opening a PR

```bash
npm ci
cp .env.example .env.local   # if you do not already have env vars
npm run lint
npm run test
npm run build
```

GitHub Actions runs the same lint / build / test pipeline on every push and pull request.
