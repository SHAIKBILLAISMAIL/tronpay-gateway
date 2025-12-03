# TronPay Gateway - Architecture Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │  Mobile Web  │  │   Tablet     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                   │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    App Router (/)                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │   Login    │  │   Signup   │  │  Dashboard │         │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │  Wallets   │  │ P2P Transfer│  │Transactions│         │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Components Layer                       │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │   │
│  │  │Header│  │ Nav  │  │Cards │  │Tables│  │Dialogs│      │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Custom Hooks Layer                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  useAuth()   │  │useCollection()│  │  useUser()   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┼───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE SERVICES                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                Firebase Authentication                    │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Email/Password Auth  │  User Sessions  │  Tokens  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Cloud Firestore                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │   Users    │  │  Wallets   │  │Transactions│         │   │
│  │  │ Collection │  │Subcollection│ │Subcollection│        │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  │  ┌────────────┐  ┌────────────┐                          │   │
│  │  │Bank Accounts│ │   Risk     │                          │   │
│  │  │Subcollection│ │Assessments │                          │   │
│  │  └────────────┘  └────────────┘                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### User Authentication Flow
```
┌──────────┐
│  User    │
│ Visits / │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Login Page     │
│  (page.tsx)     │
└────┬────────────┘
     │ Enter credentials
     ▼
┌─────────────────────────┐
│ Firebase Auth           │
│ signInWithEmailPassword │
└────┬────────────────────┘
     │ Success
     ▼
┌─────────────────┐
│ useUser() Hook  │
│ Updates Context │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Redirect to     │
│ /dashboard      │
└─────────────────┘
```

### P2P Transfer Flow
```
┌──────────────┐
│ User selects │
│ sender wallet│
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Enter recipient  │
│ address & amount │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ Validation Layer     │
│ • Balance check      │
│ • Wallet exists      │
│ • Currency match     │
└──────┬───────────────┘
       │ Valid
       ▼
┌──────────────────────┐
│ Firestore Batch      │
│ • Update sender      │
│ • Update receiver    │
│ • Create tx (sender) │
│ • Create tx (receiver)│
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐
│ Success Toast    │
│ & UI Update      │
└──────────────────┘
```

---

## 📊 Database Schema

```
Firestore Database
│
├── users (collection)
│   └── {userId} (document)
│       ├── id: string
│       ├── username: string
│       ├── email: string
│       ├── registrationDate: string
│       ├── securitySettings: object
│       │
│       ├── wallets (subcollection)
│       │   └── {walletId} (document)
│       │       ├── userId: string
│       │       ├── name: string
│       │       ├── walletAddress: string
│       │       ├── currencyType: string
│       │       ├── balance: number
│       │       └── createdAt: timestamp
│       │
│       ├── bankAccounts (subcollection)
│       │   └── {accountId} (document)
│       │       ├── userId: string
│       │       ├── bankName: string
│       │       ├── accountHolder: string
│       │       ├── accountNumber: string (masked)
│       │       ├── routingNumber: string
│       │       ├── balance: number
│       │       └── createdAt: timestamp
│       │
│       └── all_transactions (subcollection)
│           └── {transactionId} (document)
│               ├── initiatorUserId: string
│               ├── senderWalletId: string
│               ├── receiverWalletId: string
│               ├── transactionHash: string
│               ├── amount: number
│               ├── currencyType: string
│               ├── timestamp: timestamp
│               ├── status: string
│               ├── memo: string (optional)
│               ├── fee: number
│               └── type: string
│
└── risk_assessments (collection)
    └── {assessmentId} (document)
        └── [assessment data]
```

---

## 🔐 Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
└─────────────────────────────────────────────────────────────┘

Layer 1: Firebase Authentication
┌─────────────────────────────────────────────────────────────┐
│  • Email/Password verification                               │
│  • JWT token generation                                      │
│  • Session management                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Layer 2: Client-Side Validation
┌─────────────────────────────────────────────────────────────┐
│  • Form validation (Zod schemas)                             │
│  • Balance checks                                            │
│  • Currency matching                                         │
│  • Input sanitization                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Layer 3: Firestore Security Rules
┌─────────────────────────────────────────────────────────────┐
│  • Path-based authorization                                  │
│  • User ownership verification                               │
│  • Read/Write permissions                                    │
│  • Data validation rules                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Layer 4: Business Logic Validation
┌─────────────────────────────────────────────────────────────┐
│  • Transaction amount limits                                 │
│  • Wallet existence verification                             │
│  • Currency compatibility                                    │
│  • Duplicate transaction prevention                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Hierarchy

```
App Layout
│
├── ThemeProvider
│   └── FirebaseClientProvider
│       ├── (auth) Routes
│       │   ├── Login Page (/)
│       │   ├── Signup Page (/signup)
│       │   └── Forgot Password
│       │
│       └── (app) Routes [Protected]
│           ├── Layout
│           │   ├── SidebarProvider
│           │   │   ├── Sidebar
│           │   │   │   └── MainNav
│           │   │   │       ├── Logo
│           │   │   │       ├── Menu Items
│           │   │   │       └── Help Footer
│           │   │   │
│           │   │   └── SidebarInset
│           │   │       ├── Header
│           │   │       │   ├── SidebarTrigger
│           │   │       │   ├── Search
│           │   │       │   ├── ThemeToggle
│           │   │       │   ├── Language Selector
│           │   │       │   ├── Notifications
│           │   │       │   └── User Menu
│           │   │       │
│           │   │       └── Main Content
│           │   │           └── [Page Content]
│           │   │
│           │   └── Toaster
│           │
│           ├── Dashboard
│           │   ├── Metric Cards (4)
│           │   ├── Transaction Chart
│           │   └── Recent Transactions Table
│           │
│           ├── Wallets
│           │   ├── Create Wallet Dialog
│           │   ├── Wallet Cards Grid
│           │   └── Receive Funds Dialog
│           │
│           ├── P2P Transfer
│           │   └── Transfer Form Card
│           │
│           ├── Transactions
│           │   ├── Tabs (All, Sent, Received, etc.)
│           │   └── Transactions Table
│           │
│           └── Bank Accounts
│               ├── Add Account Dialog
│               └── Account Cards Grid
│
└── Analytics (Vercel)
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
└─────────────────────────────────────────────────────────────┘

Global State (React Context)
┌─────────────────────────────────────────────────────────────┐
│  FirebaseClientProvider                                      │
│  ├── auth: Auth                                              │
│  ├── firestore: Firestore                                    │
│  └── user: User | null                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Component State (React Hooks)
┌─────────────────────────────────────────────────────────────┐
│  useState                                                     │
│  ├── isLoading: boolean                                      │
│  ├── isDialogOpen: boolean                                   │
│  └── formData: object                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Firestore Real-time State (Custom Hooks)
┌─────────────────────────────────────────────────────────────┐
│  useCollection(query)                                        │
│  ├── data: DocumentData[]                                    │
│  ├── isLoading: boolean                                      │
│  └── error: Error | null                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Derived State (useMemo)
┌─────────────────────────────────────────────────────────────┐
│  Computed Values                                             │
│  ├── totalBalance                                            │
│  ├── filteredTransactions                                    │
│  └── chartData                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Responsive Design Breakpoints

```
Mobile First Approach
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Mobile (< 640px)                                            │
│  ├── Single column layout                                    │
│  ├── Collapsed sidebar                                       │
│  ├── Stacked cards                                           │
│  └── Simplified tables                                       │
│                                                               │
│  Tablet (640px - 1024px)                                     │
│  ├── Two column layout                                       │
│  ├── Expandable sidebar                                      │
│  ├── Grid cards (2 cols)                                     │
│  └── Full tables                                             │
│                                                               │
│  Desktop (> 1024px)                                          │
│  ├── Multi-column layout                                     │
│  ├── Persistent sidebar                                      │
│  ├── Grid cards (3-4 cols)                                   │
│  └── Enhanced tables                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Theme System

```
Theme Configuration
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Light Mode                     Dark Mode                    │
│  ┌─────────────────┐           ┌─────────────────┐          │
│  │ Background: #fff│           │ Background: #000│          │
│  │ Foreground: #000│           │ Foreground: #fff│          │
│  │ Primary: Blue   │           │ Primary: Blue   │          │
│  │ Muted: Gray-100 │           │ Muted: Gray-900 │          │
│  └─────────────────┘           └─────────────────┘          │
│                                                               │
│  System Preference Detection                                 │
│  └─> Auto-switch based on OS settings                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

**Diagrams Version**: 1.0
**Last Updated**: December 3, 2025
