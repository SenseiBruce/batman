# Jarvis Expense Tracker

SMS-powered expense tracker for India. Jarvis reads bank/UPI SMS on Android (Capacitor), categorizes merchants, tracks budgets, and answers spending questions through an optional Gemini assistant. The same codebase ships as a Vite web app.

License: [MIT](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## Architecture

```
src/
  pages/        Screens (Dashboard, Transactions, Insights, Settings, Jarvis, …)
  components/   Shared UI (modals, cards, navigation)
  services/     Domain logic: SMS parse, predictions, sync, budgets, Gemini
  contexts/     React context (currency, Jarvis chat)
  config/       Firebase web SDK init from VITE_ env vars
  utils/        Notifications, export, share-to-image, local JSON backup
android/        Capacitor Android project (SMS reader, Firebase Auth)
```

Business rules live in `src/services` so they can be unit-tested without the UI. Pages compose services and components. Capacitor plugins (`@solimanware/capacitor-sms-reader`, filesystem, share, biometrics) are no-ops or permission-gated on web/iOS.

## Setup

**Prerequisites:** Node.js 20+, npm. For the Android app: Android Studio and a device/emulator with SMS permission.

```bash
git clone <repo-url>
cd batman
npm ci
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables)). Do not commit `.env.local`.

## Run

```bash
npm run dev          # Vite dev server, http://localhost:5173
```

### Docker (isolated sandbox)

Firebase is a cloud backend; compose does not start a local database. Copy `.env.example` to `.env`, then:

```bash
docker compose up --build
```

The web app is served at [http://localhost:8080](http://localhost:8080).

## Test

```bash
npm run test         # vitest run --coverage
npm run test:watch   # watch mode
```

CI runs lint, `tsc` (via `npm run build`), and the test suite on every push and pull request.

## Build

```bash
npm run build        # tsc && vite build → dist/
npm run android      # open the Capacitor Android project
npx cap sync android # after a web build, copy dist/ into android/
```

## Environment variables

Copy `.env.example` to `.env.local` for Vite, or `.env` for Docker Compose.

| Variable                            | Purpose                                             |
| ----------------------------------- | --------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase web API key                                |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain                                |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project id                                 |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Cloud Storage bucket                                |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender id                                       |
| `VITE_FIREBASE_APP_ID`              | Firebase app id                                     |
| `VITE_GEMINI_API_KEY`               | Optional default Gemini key for web builds          |
| `GEMINI_API_KEY`                    | Same key; also used by some AI Studio tooling       |
| `VITE_DEBUG`                        | `true` to emit structured logs in production builds |
| `VITE_SENTRY_DSN`                   | Optional Sentry DSN for uncaught errors             |

Gemini can also be set at runtime in **Settings** (stored in Capacitor secure storage / localStorage). Android native Firebase config remains in `android/app/google-services.json`.

Open this repo in a [Dev Container](.devcontainer/devcontainer.json) or see [CHANGELOG.md](CHANGELOG.md) for release notes. CI fails on high-severity `npm audit` findings and on coverage below 60% lines / 50% branches for services, utils, and extracted UI.

Gemini can also be set at runtime in **Settings** (stored in Capacitor secure storage / localStorage). Android native Firebase config remains in `android/app/google-services.json`.

If a Firebase web API key was previously committed, rotate it in the [Firebase console](https://console.firebase.google.com/) under Project settings → API keys, restrict the new key (HTTP referrers for web, Android package for the native app), and update `android/app/google-services.json` if it still references the old key.

## Lint and format

```bash
npm run lint           # eslint src --max-warnings=0
npm run format         # prettier --write src
npm run format:check   # prettier --check src
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch and commit conventions.
