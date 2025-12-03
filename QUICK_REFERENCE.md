# TronPay Gateway - Quick Reference Guide

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
# Open http://localhost:3000
```

### Default Credentials
Create an account at `/signup` or use existing Firebase users.

---

## 📁 Project Structure (Simplified)

```
src/
├── app/
│   ├── page.tsx              # Login page (/)
│   ├── (auth)/signup/        # Registration
│   └── (app)/                # Protected routes
│       ├── dashboard/        # Main dashboard
│       ├── wallets/          # Wallet management
│       ├── transactions/     # Transaction history
│       ├── p2p-transfer/     # Send money
│       └── bank-accounts/    # Bank linking
├── components/
│   ├── header.tsx            # Top navigation
│   ├── main-nav.tsx          # Sidebar menu
│   └── ui/                   # Reusable components
└── firebase/
    ├── config.ts             # Firebase settings
    └── firestore/            # Database hooks
```

---

## 🔑 Key Features

### 1. **Wallet Management**
- Create multi-currency wallets (USD, EUR, JPY, GBP, etc.)
- View balances
- Copy wallet addresses
- Send/receive funds

### 2. **P2P Transfers**
- Send money between wallets
- Automatic balance validation
- Currency matching
- Transaction history

### 3. **Dashboard**
- Total balance overview
- Transaction volume charts
- Recent transactions
- Active wallet count

### 4. **Bank Accounts**
- Link bank accounts
- View balances
- Masked account numbers

---

## 💾 Database Structure

### Firestore Collections

```
/users/{userId}
  - User profile data

/users/{userId}/wallets/{walletId}
  - Wallet information
  - Balance tracking

/users/{userId}/bankAccounts/{accountId}
  - Bank account details

/users/{userId}/all_transactions/{transactionId}
  - Transaction history
```

---

## 🔐 Security Rules

**User Ownership Model**:
- Users can only access their own data
- Path must match authenticated user ID
- No public listing of users

**Example**:
```javascript
// ✅ Allowed
/users/abc123/wallets  (if auth.uid == abc123)

// ❌ Denied
/users/xyz789/wallets  (if auth.uid == abc123)
```

---

## 🛠️ Common Tasks

### Create a New Wallet
1. Navigate to `/wallets`
2. Click "Create Wallet"
3. Enter wallet name and currency
4. System generates address automatically

### Send Money (P2P)
1. Go to `/p2p-transfer`
2. Select sender wallet
3. Enter recipient address
4. Enter amount
5. Add memo (optional)
6. Click "Send Transfer"

### View Transactions
1. Navigate to `/transactions`
2. Use tabs to filter (All, Sent, Received, Card, IP)
3. Click actions menu for details

---

## 🎨 UI Components

### Available Components (from Radix UI)
- Button, Card, Dialog
- Input, Select, Label
- Table, Tabs, Badge
- Toast, Tooltip
- And 25+ more...

### Theme Toggle
- Light/Dark mode
- System preference detection
- Located in header

---

## 🔧 Configuration Files

### `firebase/config.ts`
```typescript
export const firebaseConfig = {
  projectId: "studio-711426439-67441",
  appId: "1:630560270207:web:...",
  apiKey: "AIzaSyDvL1sCFHBhQGUMPz42QinPoe3cO6CPNGk",
  // ...
}
```

### `next.config.ts`
- TypeScript errors ignored (for rapid development)
- ESLint disabled during builds
- Remote image patterns configured

---

## 📊 Data Flow

### Transaction Flow
```
User Input → Validation → Firestore Batch Write → Success Toast
```

### Dashboard Data
```
Firestore Query → Real-time Listener → React State → UI Update
```

---

## 🐛 Common Issues

### Issue: "Permission Denied"
**Solution**: Check Firestore rules, ensure user is authenticated

### Issue: "Wallet not found"
**Solution**: Verify wallet address is correct and exists

### Issue: "Insufficient funds"
**Solution**: Check wallet balance before transfer

---

## 📝 Code Snippets

### Using Firebase Hooks
```typescript
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';

const auth = useAuth();
const firestore = useFirestore();

const walletsQuery = useMemoFirebase(() => {
  if (!auth.currentUser) return null;
  return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
}, [firestore, auth.currentUser]);

const { data: wallets, isLoading } = useCollection(walletsQuery);
```

### Creating a Transaction
```typescript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const transactionData = {
  initiatorUserId: userId,
  senderWalletId: fromAddress,
  receiverWalletId: toAddress,
  amount: 100,
  currencyType: 'USD',
  timestamp: serverTimestamp(),
  status: 'completed',
  type: 'p2p_sent',
};

await addDoc(collection(firestore, `users/${userId}/all_transactions`), transactionData);
```

---

## 🎯 Navigation Routes

| Route | Description |
|-------|-------------|
| `/` | Login page |
| `/signup` | Registration |
| `/dashboard` | Main dashboard |
| `/wallets` | Wallet management |
| `/transactions` | Transaction history |
| `/p2p-transfer` | Send money |
| `/bank-accounts` | Bank accounts |
| `/settings` | User settings |
| `/risk-assessment` | Risk analysis |

---

## 🔍 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # TypeScript check

# AI/Genkit
npm run genkit:dev       # Start Genkit dev
npm run genkit:watch     # Watch mode
```

---

## 📚 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework |
| `firebase` | Backend services |
| `@radix-ui/*` | UI components |
| `tailwindcss` | Styling |
| `recharts` | Charts |
| `react-hook-form` | Forms |
| `zod` | Validation |

---

## 🎓 Learning Path

1. **Start Here**: Understand the dashboard (`/dashboard/page.tsx`)
2. **Next**: Explore wallet management (`/wallets/page.tsx`)
3. **Then**: Study P2P transfers (`/p2p-transfer/page.tsx`)
4. **Finally**: Review Firebase integration (`/firebase/`)

---

## 💡 Tips & Tricks

### Performance
- Use `useMemoFirebase` for queries to prevent re-creation
- Memoize expensive calculations with `useMemo`
- Use `useCollection` for real-time updates

### Security
- Always validate user input
- Check authentication before operations
- Use Firestore rules as second layer of security

### UI/UX
- Show loading states for better UX
- Use toast notifications for feedback
- Implement confirmation dialogs for destructive actions

---

## 🆘 Getting Help

1. Check `CODEBASE_ANALYSIS.md` for detailed documentation
2. Review Firestore rules in `firestore.rules`
3. Inspect component code in `/src/components/`
4. Check Firebase console for data

---

**Quick Reference Version**: 1.0
**Last Updated**: December 3, 2025
