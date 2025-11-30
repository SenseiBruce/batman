# Jarvis Expense Tracker - Application Business Logic

## Overview
This document provides a visual description of the Jarvis Expense Tracker application's business logic, data flow, and component architecture.

---

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │ Transactions │  Insights  │  Jarvis  │ Add    │
│  (Budget    │  (History)   │ (Analytics)│  (AI)    │ (Form) │
│  Management)│              │            │          │        │
└──────┬──────┴──────┬───────┴─────┬──────┴────┬─────┴────┬───┘
       │             │             │           │          │
       └─────────────┴─────────────┴───────────┴──────────┘
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                    Business Logic Layer                    │
├────────────────────────────────────────────────────────────┤
│  • Transaction Management                                  │
│  • Category Management                                     │
│  • Budget Calculations                                     │
│  • Data Filtering & Sorting                               │
│  • SMS Parsing                                            │
│  • Statement Parsing                                       │
│  • AI Query Processing                                     │
└─────────────────────────────┬──────────────────────────────┘
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                    Data Persistence Layer                  │
├────────────────────────────────────────────────────────────┤
│  • Secure Storage (Capacitor Preferences)                  │
│  • Local Storage (Backup)                                  │
│  • File System (Exports, Shares)                          │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### Transaction Creation Flow

```
┌─────────────┐
│   User      │
│   Action    │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       │              │              │              │
       v              v              v              v
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Manual  │   │   SMS    │   │Statement │   │   AI     │
│   Add    │   │  Sync    │   │  Upload  │   │ Suggest  │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │
     └──────────────┴──────────────┴──────────────┘
                    │
                    v
         ┌──────────────────────┐
         │  Parse & Categorize  │
         │  (Auto-categorize    │
         │   based on keywords) │
         └──────────┬───────────┘
                    │
                    v
         ┌──────────────────────┐
         │  Duplicate Check     │
         │  (by transaction ID) │
         └──────────┬───────────┘
                    │
                    v
         ┌──────────────────────┐
         │  Add to State        │
         │  (transactions[])    │
         └──────────┬───────────┘
                    │
                    v
         ┌──────────────────────┐
         │  Persist to Storage  │
         │  (SecureStorage)     │
         └──────────────────────┘
```

### Budget Calculation Flow

```
┌──────────────────┐
│  Selected Month  │
└────────┬─────────┘
         │
         v
┌─────────────────────────────┐
│  Filter Transactions        │
│  • Match month (YYYY-MM)    │
│  • Type = 'debit'           │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Group by Category          │
│  • Sum amounts per category │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Calculate Metrics          │
│  • Total Spent              │
│  • Budget Remaining         │
│  • Percentage Used          │
│  • Alert Thresholds         │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Trigger Notifications      │
│  • 75% = Warning            │
│  • 90% = Critical           │
│  • 100%+ = Over Budget      │
└─────────────────────────────┘
```

---

## 🔄 State Management

### App-Level State (App.tsx)

```typescript
State:
├── transactions: Transaction[]
│   └── { id, date, merchant, amount, category, type }
│
├── categories: Category[]
│   └── { id, name, budget, color, icon, alertsEnabled }
│
├── selectedMonth: string (YYYY-MM)
│
└── isDataLoaded: boolean

Actions:
├── addTransaction(t: Transaction)
├── addBulkTransactions(txs: Transaction[])
├── deleteTransaction(id: string)
├── updateTransaction(t: Transaction)
├── updateCategory(c: Category)
├── addCategory(name, budget)
├── clearTransactions()
└── reparseTransactions()
```

### Page-Level State

#### Dashboard
```typescript
State:
├── editingId: string | null
├── editAmount: string
├── editAlerts: boolean
├── showAddModal: boolean
├── showCategoryModal: boolean
└── selectedCategory: Category | null
```

#### Transactions
```typescript
State:
├── isSyncing: boolean
├── syncStatus: string
├── selectedMonth: string
├── searchQuery: string
└── filters: FilterState
    ├── category: string
    ├── dateFrom: string
    ├── dateTo: string
    ├── amountMin: string
    └── amountMax: string
```

#### Jarvis
```typescript
State:
├── messages: Message[]
├── input: string
├── isLoading: boolean
├── apiKey: string
└── showKeyInput: boolean
```

---

## 🎯 Business Rules

### Transaction Rules

1. **Unique ID**: Each transaction must have a unique ID
   ```typescript
   id = `tx-${Date.now()}-${Math.random()}`
   ```

2. **Auto-Categorization**: Transactions are categorized based on merchant keywords
   ```typescript
   CATEGORY_KEYWORDS = {
     'Food': ['swiggy', 'zomato', 'restaurant', 'cafe'],
     'Transport': ['uber', 'ola', 'metro', 'fuel'],
     // ... more categories
   }
   ```

3. **Duplicate Prevention**: Transactions with same ID are rejected
   ```typescript
   uniqueNewTxs = newTxs.filter(newTx => 
     !existing.some(e => e.id === newTx.id)
   )
   ```

4. **Type Classification**: Transactions are either 'credit' or 'debit'
   - SMS parsing determines type from keywords
   - Manual entry requires user selection

### Budget Rules

1. **Monthly Budgets**: Budgets are set per category per month
   ```typescript
   budget = { category: 'Food', amount: 5000, month: '2025-11' }
   ```

2. **Alert Thresholds**:
   - **75-89%**: Warning (Yellow)
   - **90-99%**: Critical (Orange)
   - **100%+**: Over Budget (Red)

3. **Dynamic Calculation**: Spent amount is calculated on-the-fly
   ```typescript
   spent = transactions
     .filter(t => t.category === cat.name && t.month === selectedMonth)
     .reduce((sum, t) => sum + t.amount, 0)
   ```

4. **Notification Rules**:
   - Only trigger once per threshold per category
   - Respect user's `alertsEnabled` setting
   - Show in-app alerts + push notifications

### Category Rules

1. **Default Categories**: App ships with predefined categories
   ```typescript
   DEFAULT_CATEGORIES = [
     { name: 'Food', budget: 5000, color: '#EF4444', icon: '🍔' },
     { name: 'Transport', budget: 2000, color: '#3B82F6', icon: '🚗' },
     // ... more
   ]
   ```

2. **Custom Categories**: Users can add unlimited categories
   - Must have unique name
   - Auto-assigned random color
   - Default icon: 💰

3. **Category Migration**: Old data is migrated to new structure
   - Remove deprecated fields (e.g., `spent`)
   - Add new categories (e.g., `Investments`)

---

## 🔐 Data Persistence Strategy

### Storage Hierarchy

```
1. Secure Storage (Primary)
   ├── transactions
   ├── categories
   ├── chat_history
   └── gemini_api_key

2. Local Storage (Fallback/Migration)
   └── gemini_api_key (legacy)

3. File System (Exports)
   ├── Budget screenshots (PNG)
   └── Statement uploads (XLS)
```

### Save Triggers

```typescript
// Auto-save on every change
useEffect(() => {
  if (isDataLoaded) {
    SecureStorageService.set('transactions', transactions)
  }
}, [transactions, isDataLoaded])

// Immediate save for critical actions
const addTransaction = (t) => {
  const updated = [t, ...prev]
  SecureStorageService.set('transactions', updated) // Immediate
  return updated
}
```

### Load Strategy

```typescript
// On app mount
1. Load from Secure Storage
2. If not found, check Local Storage (migration)
3. If still not found, use defaults
4. Set isDataLoaded = true
```

---

## 🤖 AI Integration (Jarvis)

### Query Flow

```
User Query
    │
    v
┌─────────────────┐
│  Validate API   │
│  Key Exists     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Build Context  │
│  • Transactions │
│  • Categories   │
│  • Budgets      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Send to Gemini │
│  API            │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Parse Response │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Display to     │
│  User           │
└─────────────────┘
```

### Context Building

```typescript
const context = `
You are Jarvis, a financial assistant.
User has ${transactions.length} transactions.
Total budget: ₹${totalBudget}
Total spent: ₹${totalSpent}

Recent transactions:
${recentTxs.map(t => `- ${t.merchant}: ₹${t.amount}`).join('\n')}

Answer the user's question: "${query}"
`
```

---

## 📱 SMS Parsing Logic

### Flow

```
SMS Message
    │
    v
┌─────────────────┐
│  Permission     │
│  Check          │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Read All SMS   │
│  (Capacitor)    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Filter Bank    │
│  Messages       │
│  (Keywords)     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Extract Data   │
│  • Amount       │
│  • Merchant     │
│  • Date         │
│  • Type         │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Categorize     │
│  (Keywords)     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Create         │
│  Transaction    │
└─────────────────┘
```

### Parsing Patterns

```typescript
// Amount extraction
/(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i

// Merchant extraction
/(?:at|to|from)\s+([A-Z][A-Za-z0-9\s&-]+)/i

// Type detection
debit: ['debited', 'spent', 'withdrawn', 'paid']
credit: ['credited', 'received', 'deposited']
```

---

## 📈 Analytics Calculations

### Insights Page Metrics

```typescript
// Total Expenses (Current Month)
totalExpenses = monthlyTransactions
  .filter(t => t.type === 'debit')
  .reduce((sum, t) => sum + t.amount, 0)

// Average Daily Spending
avgDailySpending = totalExpenses / currentDayOfMonth

// Budget Progress
budgetProgress = (totalExpenses / totalBudget) * 100

// Month-over-Month Change
expenseChange = ((current - previous) / previous) * 100

// Spending Forecast
projectedTotal = (totalExpenses / dayOfMonth) * daysInMonth
```

### Chart Data Preparation

```typescript
// Pie Chart (Category Distribution)
categoryData = categories.map(cat => ({
  name: cat.name,
  value: monthlyTxs
    .filter(t => t.category === cat.name)
    .reduce((sum, t) => sum + t.amount, 0),
  color: cat.color
})).filter(d => d.value > 0)

// Line Chart (7-Day Trend)
trendData = last7Days.map(date => ({
  day: date.toLocaleDateString('en-US', { weekday: 'short' }),
  amount: transactions
    .filter(t => t.date.startsWith(dateStr))
    .reduce((sum, t) => sum + t.amount, 0)
}))
```

---

## 🔔 Notification System

### Alert Triggers

```typescript
// Budget Alerts
if (spent >= budget * 0.75 && spent < budget * 0.90) {
  scheduleBudgetAlert('Warning', `${percentage}% used`)
}
else if (spent >= budget * 0.90 && spent < budget) {
  scheduleBudgetAlert('Critical', `${percentage}% used`)
}
else if (spent >= budget) {
  scheduleBudgetAlert('Over Budget', `Exceeded by ₹${spent - budget}`)
}
```

### Notification Deduplication

```typescript
// Track notified categories
const notifiedRef = useRef<Set<string>>(new Set())

// Only notify once per threshold
if (!notifiedRef.current.has(cat.id)) {
  scheduleBudgetAlert(title, body)
  notifiedRef.current.add(cat.id)
}
```

---

## 🎨 UI Component Hierarchy

```
App
├── Router
│   ├── Dashboard
│   │   ├── Header
│   │   ├── MonthSelector
│   │   ├── TotalBudgetCard
│   │   ├── CategoryList
│   │   │   └── CategoryCard (multiple)
│   │   ├── AddCategoryModal
│   │   └── CategoryTransactionsModal
│   │
│   ├── Transactions
│   │   ├── Header
│   │   ├── BudgetSummaryCard
│   │   ├── MonthSelector
│   │   ├── SearchFilter
│   │   ├── TransactionList
│   │   │   ├── ListSkeleton (loading)
│   │   │   ├── TransactionCard (multiple)
│   │   │   ├── NoTransactionsEmpty (empty)
│   │   │   └── NoSearchResultsEmpty (no results)
│   │   ├── ConfirmDialog (delete confirmation)
│   │   └── Toast (notifications with undo)
│   │
│   ├── Insights
│   │   ├── Header
│   │   ├── MonthSelector
│   │   ├── AlertsSection
│   │   ├── QuickStatsGrid
│   │   │   └── StatCardSkeleton (loading)
│   │   ├── ForecastCard
│   │   ├── TopMerchants
│   │   ├── MonthComparison (BarChart)
│   │   │   └── ChartSkeleton (loading)
│   │   ├── CategoryPieChart
│   │   ├── WeeklyTrend (LineChart)
│   │   ├── CategoryTrends
│   │   ├── RecentTransactions
│   │   └── NoDataEmpty (empty)
│   │
│   ├── Jarvis
│   │   ├── Header
│   │   ├── APIKeyInput (conditional)
│   │   ├── MessageList
│   │   │   └── Message (multiple)
│   │   └── InputBar
│   │
│   └── AddTransaction
│       └── TransactionForm
│
├── BottomNav
│   ├── NavItem (Dashboard) - Blue gradient
│   ├── NavItem (Transactions) - Violet gradient
│   ├── FAB (Add) - Blue gradient with glow
│   ├── NavItem (Insights) - Pink gradient
│   └── NavItem (Jarvis) - Cyan gradient
│
└── Shared Components
    ├── ConfirmDialog (delete confirmations)
    ├── Toast (notifications with actions)
    ├── EmptyState (no data states)
    │   ├── NoTransactionsEmpty
    │   ├── NoSearchResultsEmpty
    │   └── NoDataEmpty
    └── Skeleton (loading states)
        ├── TransactionSkeleton
        ├── CategoryCardSkeleton
        ├── StatCardSkeleton
        ├── ChartSkeleton
        ├── ListSkeleton
        ├── DashboardSkeleton
        ├── TransactionsSkeleton
        └── InsightsSkeleton
```

---

## 🔄 Data Synchronization

### Auto-Sync Strategy

```typescript
// On app startup (after 1 second delay)
useEffect(() => {
  const autoSync = async () => {
    const newTxs = await fetchAllSmsTransactions()
    addBulkTransactions(newTxs) // Handles duplicates
  }
  
  const timeoutId = setTimeout(autoSync, 1000)
  return () => clearTimeout(timeoutId)
}, [])
```

### Manual Sync Options

1. **SMS Sync Button**: Transactions page
2. **Statement Upload**: Transactions page
3. **Pull-to-Refresh**: (To be implemented)

---

## 🎯 Key Features Summary

### Core Features
- ✅ Transaction tracking (manual + auto)
- ✅ Budget management per category
- ✅ SMS parsing and auto-categorization
- ✅ Statement upload (XLS)
- ✅ Multi-month tracking
- ✅ Budget alerts and notifications
- ✅ AI-powered insights (Jarvis)
- ✅ Data persistence (secure)
- ✅ Export/share budgets

### Analytics Features
- ✅ Spending by category (pie chart)
- ✅ Weekly trend (line chart)
- ✅ Month-over-month comparison
- ✅ Top merchants
- ✅ Category trends
- ✅ Spending forecast
- ✅ Budget progress tracking

### UX Features
- ✅ Dark mode design
- ✅ Responsive layout
- ✅ Month selector
- ✅ Search and filters
- ✅ Transaction editing
- ✅ Category customization
- ✅ Glassmorphism effects
- ✅ Smooth animations

---

**Last Updated**: November 30, 2025  
**Version**: 2.0.0  
**Status**: ✅ Active Development
