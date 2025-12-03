# TronPay Gateway - Feature Matrix & API Reference

## 📋 Feature Matrix

### ✅ Implemented Features

| Feature | Status | Page/Component | Description |
|---------|--------|----------------|-------------|
| **Authentication** |
| Email/Password Login | ✅ Complete | `/` | Firebase Auth integration |
| User Registration | ✅ Complete | `/signup` | Create new accounts |
| Password Reset | ⚠️ Partial | `/forgot-password` | UI exists, needs implementation |
| Session Management | ✅ Complete | Firebase | Auto token refresh |
| Protected Routes | ✅ Complete | `(app)/layout.tsx` | Auth guard with redirect |
| **Wallet Management** |
| Create Wallet | ✅ Complete | `/wallets` | Multi-currency support |
| View Wallets | ✅ Complete | `/wallets` | Grid display with balances |
| Delete Wallet | ✅ Complete | `/wallets` | With confirmation dialog |
| Copy Address | ✅ Complete | `/wallets` | Clipboard integration |
| QR Code Display | ✅ Complete | `ReceiveFundsDialog` | For receiving funds |
| Multi-Currency | ✅ Complete | `/wallets` | 9 currencies supported |
| **Transactions** |
| P2P Transfer | ✅ Complete | `/p2p-transfer` | Address-to-address |
| Transaction History | ✅ Complete | `/transactions` | Tabbed interface |
| Transaction Filtering | ✅ Complete | `/transactions` | By type (sent/received/etc) |
| Transaction Details | ⚠️ Partial | `/transactions` | View action exists |
| Real-time Updates | ✅ Complete | Firestore listeners | Auto-refresh |
| **Bank Accounts** |
| Link Bank Account | ✅ Complete | `/bank-accounts` | Add new accounts |
| View Accounts | ✅ Complete | `/bank-accounts` | Card display |
| Account Masking | ✅ Complete | `/bank-accounts` | Last 4 digits shown |
| Delete Account | ⚠️ Partial | `/bank-accounts` | Button exists, needs handler |
| **Dashboard** |
| Balance Overview | ✅ Complete | `/dashboard` | Multi-currency totals |
| Transaction Volume | ✅ Complete | `/dashboard` | USD total |
| Transaction Count | ✅ Complete | `/dashboard` | All types |
| Active Wallets | ✅ Complete | `/dashboard` | Count display |
| 7-Day Chart | ✅ Complete | `/dashboard` | Bar chart (Recharts) |
| Recent Transactions | ✅ Complete | `/dashboard` | Last 5 transactions |
| **UI/UX** |
| Dark Mode | ✅ Complete | Header | Theme toggle |
| Responsive Design | ✅ Complete | All pages | Mobile-first |
| Toast Notifications | ✅ Complete | All actions | Success/error feedback |
| Loading States | ✅ Complete | All async ops | Spinners |
| Empty States | ✅ Complete | Lists/grids | Helpful messages |
| Confirmation Dialogs | ✅ Complete | Destructive actions | AlertDialog |
| **Settings** |
| User Profile | ⚠️ Partial | `/settings` | Page exists |
| Security Settings | ⚠️ Partial | `/settings` | Page exists |
| Notification Prefs | ❌ Not Started | - | - |
| **Advanced** |
| Card Payments | ⚠️ Partial | `/card-payment` | Page exists |
| IP Transfers | ⚠️ Partial | `/ip-transfer` | Page exists |
| Risk Assessment | ⚠️ Partial | `/risk-assessment` | Page exists |
| AI Integration | ⚠️ Partial | Genkit setup | Not used in UI |

**Legend**:
- ✅ Complete: Fully implemented and functional
- ⚠️ Partial: UI exists but functionality incomplete
- ❌ Not Started: Not implemented

---

## 🔌 Firebase API Reference

### Authentication APIs

#### Sign In
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';

const auth = useAuth();
await signInWithEmailAndPassword(auth, email, password);
```

#### Sign Up
```typescript
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const userCredential = await createUserWithEmailAndPassword(auth, email, password);
await updateProfile(userCredential.user, { displayName: fullName });
```

#### Sign Out
```typescript
import { signOut } from 'firebase/auth';

await signOut(auth);
```

#### Get Current User
```typescript
import { useUser } from '@/firebase';

const { user, isUserLoading } = useUser();
// user: User | null
// isUserLoading: boolean
```

---

### Firestore APIs

#### Create Document
```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const firestore = useFirestore();
const collectionRef = collection(firestore, 'users', userId, 'wallets');

await addDoc(collectionRef, {
  name: 'My Wallet',
  balance: 0,
  createdAt: serverTimestamp(),
});
```

#### Read Collection (Real-time)
```typescript
import { collection } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';

const walletsQuery = useMemoFirebase(() => {
  if (!auth.currentUser) return null;
  return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
}, [firestore, auth.currentUser]);

const { data: wallets, isLoading } = useCollection(walletsQuery);
```

#### Update Document
```typescript
import { doc, updateDoc } from 'firebase/firestore';

const docRef = doc(firestore, 'users', userId, 'wallets', walletId);
await updateDoc(docRef, { balance: newBalance });
```

#### Delete Document
```typescript
import { doc, deleteDoc } from 'firebase/firestore';

const docRef = doc(firestore, 'users', userId, 'wallets', walletId);
await deleteDoc(docRef);
```

#### Batch Write
```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(firestore);

batch.update(senderRef, { balance: newSenderBalance });
batch.update(receiverRef, { balance: newReceiverBalance });
batch.set(doc(transactionsRef), transactionData);

await batch.commit();
```

#### Query with Filters
```typescript
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

const q = query(
  collection(firestore, 'users', userId, 'all_transactions'),
  where('status', '==', 'completed'),
  orderBy('timestamp', 'desc'),
  limit(10)
);

const { data } = useCollection(q);
```

#### Collection Group Query
```typescript
import { collectionGroup, query, where } from 'firebase/firestore';

// Find wallet across all users
const q = query(
  collectionGroup(firestore, 'wallets'),
  where('walletAddress', '==', address)
);

const snapshot = await getDocs(q);
```

---

## 🎨 UI Component API

### Button
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="default" disabled={false}>
  Click Me
</Button>

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Dialog
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast
```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: 'Success',
  description: 'Operation completed',
  variant: 'default', // or 'destructive'
});
```

### Table
```tsx
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Select
```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

<Select name="currency" defaultValue="USD">
  <SelectTrigger>
    <SelectValue placeholder="Select currency" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="USD">USD ($)</SelectItem>
    <SelectItem value="EUR">EUR (€)</SelectItem>
  </SelectContent>
</Select>
```

### Input
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    name="email" 
    type="email" 
    placeholder="user@example.com"
    required 
  />
</div>
```

---

## 📊 Data Formatting Utilities

### Currency Formatting
```typescript
const formatted = amount.toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
// Output: "$1,234.56"
```

### Date Formatting
```typescript
import { format, startOfDay, subDays } from 'date-fns';

// Format timestamp
const dateString = format(timestamp.toDate(), 'yyyy-MM-dd');

// Get date range
const today = startOfDay(new Date());
const weekAgo = subDays(today, 7);
```

### Number Formatting
```typescript
// Thousands separator
const formatted = number.toLocaleString('en-US');
// 1000 → "1,000"

// Chart Y-axis
const yAxisFormatter = (value) => `$${value / 1000}k`;
// 5000 → "$5k"
```

---

## 🔐 Security Best Practices

### Input Validation
```typescript
import { z } from 'zod';

const walletSchema = z.object({
  name: z.string().min(1).max(50),
  currency: z.enum(['USD', 'EUR', 'JPY', 'GBP']),
  amount: z.number().positive(),
});

// Use with react-hook-form
const form = useForm({
  resolver: zodResolver(walletSchema),
});
```

### Firestore Rules Validation
```javascript
// In firestore.rules
match /users/{userId}/wallets/{walletId} {
  allow create: if isSignedIn() 
    && isOwner(userId) 
    && request.resource.data.userId == userId
    && request.resource.data.balance >= 0;
}
```

### Error Handling
```typescript
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

try {
  await addDoc(collectionRef, data);
} catch (error) {
  const permissionError = new FirestorePermissionError({
    path: collectionRef.path,
    operation: 'create',
    requestResourceData: data,
  });
  errorEmitter.emit('permission-error', permissionError);
  
  toast({
    variant: 'destructive',
    title: 'Error',
    description: 'Operation failed. Check permissions.',
  });
}
```

---

## 🧪 Testing Scenarios

### Manual Test Cases

#### 1. User Registration
```
Steps:
1. Navigate to /signup
2. Enter full name, email, password
3. Click "Create Account"

Expected:
- User created in Firebase Auth
- User document created in Firestore
- Redirect to /dashboard
- Success toast shown
```

#### 2. Create Wallet
```
Steps:
1. Login and navigate to /wallets
2. Click "Create Wallet"
3. Enter wallet name and select currency
4. Click "Create Wallet"

Expected:
- Wallet document created in Firestore
- Wallet appears in grid
- Success toast shown
- Wallet has balance of 0
```

#### 3. P2P Transfer
```
Steps:
1. Navigate to /p2p-transfer
2. Select sender wallet (with sufficient balance)
3. Enter valid recipient address
4. Enter amount less than balance
5. Click "Send Transfer"

Expected:
- Sender balance decreased
- Receiver balance increased
- Two transaction records created
- Success toast shown
- Form reset
```

#### 4. View Transactions
```
Steps:
1. Navigate to /transactions
2. Click different tabs (All, Sent, Received)

Expected:
- Transactions filtered correctly
- Status badges colored appropriately
- Dates formatted correctly
- Amounts show correct currency
```

---

## 📈 Performance Optimization

### Firestore Query Optimization
```typescript
// ✅ Good: Use indexes
const q = query(
  collection(firestore, 'users', userId, 'all_transactions'),
  where('status', '==', 'completed'),
  orderBy('timestamp', 'desc'),
  limit(20)
);

// ❌ Bad: No limit, fetches all
const q = query(
  collection(firestore, 'users', userId, 'all_transactions'),
  orderBy('timestamp', 'desc')
);
```

### React Optimization
```typescript
// ✅ Good: Memoize expensive calculations
const totalBalance = useMemo(() => {
  return wallets?.reduce((sum, w) => sum + w.balance, 0) || 0;
}, [wallets]);

// ✅ Good: Memoize Firebase queries
const walletsQuery = useMemoFirebase(() => {
  if (!auth.currentUser) return null;
  return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
}, [firestore, auth.currentUser]);

// ❌ Bad: Recreates query on every render
const walletsQuery = collection(firestore, 'users', auth.currentUser.uid, 'wallets');
```

---

## 🔄 Common Workflows

### Workflow 1: New User Onboarding
```
1. User signs up (/signup)
2. User document created
3. Redirect to /dashboard (empty state)
4. User navigates to /wallets
5. Creates first wallet
6. Wallet appears in dashboard
```

### Workflow 2: Sending Money
```
1. User navigates to /wallets
2. Clicks "Send" on wallet card
3. Redirects to /p2p-transfer with pre-filled sender
4. User enters recipient and amount
5. Submits transfer
6. Both wallets updated
7. Transaction records created
8. User can view in /transactions
```

### Workflow 3: Viewing Financial Overview
```
1. User logs in
2. Lands on /dashboard
3. Sees total balance across all wallets
4. Views 7-day transaction chart
5. Checks recent transactions
6. Clicks transaction to view details
```

---

## 🛠️ Troubleshooting Guide

### Issue: "Permission Denied" Error
**Cause**: Firestore rules blocking access
**Solution**: 
1. Check user is authenticated
2. Verify userId in path matches auth.uid
3. Review firestore.rules for the collection
4. Check Firebase console for rule errors

### Issue: Wallet Not Found
**Cause**: Wallet doesn't exist or wrong address
**Solution**:
1. Verify wallet address is correct
2. Check wallet exists in Firestore console
3. Ensure collectionGroup query is working
4. Check for typos in address

### Issue: Real-time Updates Not Working
**Cause**: Firestore listener not attached
**Solution**:
1. Verify useCollection hook is used
2. Check query is not null
3. Ensure component is mounted
4. Check browser console for errors

### Issue: Dark Mode Not Persisting
**Cause**: Theme not saved to localStorage
**Solution**:
1. Check ThemeProvider is wrapping app
2. Verify next-themes is configured
3. Clear browser cache
4. Check for conflicting theme scripts

---

## 📚 Additional Resources

### Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Radix UI Components](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

### Code Examples
- See `CODEBASE_ANALYSIS.md` for detailed architecture
- See `QUICK_REFERENCE.md` for quick snippets
- See `ARCHITECTURE_DIAGRAMS.md` for visual guides

---

**API Reference Version**: 1.0
**Last Updated**: December 3, 2025
