# 🌐 TRON Blockchain API Integration Guide

## Real-Time IP-to-IP Wallet Payment APIs

This guide shows you how to integrate **real TRON blockchain APIs** for actual wallet-to-wallet payments.

---

## 🎯 Recommended APIs for TronPay Gateway

### 1. **TronGrid API** (Official - RECOMMENDED)
**Provider**: TRON Foundation  
**Type**: Free & Paid tiers  
**Best for**: Production-ready applications

#### Base URLs
```
Mainnet: https://api.trongrid.io
Testnet (Shasta): https://api.shasta.trongrid.io
Testnet (Nile): https://api.nileex.io
```

#### Get API Key
1. Visit: https://www.trongrid.io/
2. Sign up for free account
3. Get API key from dashboard
4. Free tier: 15,000 requests/day

#### Key Features
✅ Real-time transaction broadcasting  
✅ Wallet balance queries  
✅ Transaction history  
✅ Smart contract interaction  
✅ TRC-20 token support  
✅ Event monitoring  

---

### 2. **TronWeb Library** (JavaScript SDK - RECOMMENDED)
**Provider**: TRON Foundation  
**Type**: Open source library  
**Best for**: Easy integration with your Next.js app

#### Installation
```bash
npm install tronweb
```

#### Basic Setup
```javascript
const TronWeb = require('tronweb');

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": 'your-api-key-here' },
    privateKey: 'your-private-key' // Only for signing transactions
});
```

---

### 3. **Alternative APIs**

#### A. **TronScan API**
```
Base URL: https://apilist.tronscan.org/api
Documentation: https://tronscan.org/
```
- Good for transaction history
- Block explorer data
- No API key required (rate limited)

#### B. **Tatum API**
```
Base URL: https://api.tatum.io/v3/tron
Documentation: https://apidoc.tatum.io/tag/Tron
```
- Multi-blockchain support
- Easy wallet generation
- Paid service with free tier

#### C. **Moralis API**
```
Base URL: https://deep-index.moralis.io/api/v2
Documentation: https://docs.moralis.io/
```
- Web3 infrastructure
- Real-time webhooks
- Free tier available

---

## 🔧 Implementation Guide

### Step 1: Install Dependencies

```bash
npm install tronweb
npm install @types/tronweb --save-dev  # For TypeScript
```

### Step 2: Create TronWeb Configuration

Create `src/lib/tronweb.ts`:

```typescript
import TronWeb from 'tronweb';

// Configuration
const TRON_API_KEY = process.env.NEXT_PUBLIC_TRON_API_KEY || '';
const TRON_NETWORK = process.env.NEXT_PUBLIC_TRON_NETWORK || 'mainnet';

// Network URLs
const NETWORKS = {
  mainnet: 'https://api.trongrid.io',
  shasta: 'https://api.shasta.trongrid.io',
  nile: 'https://api.nileex.io',
};

// Initialize TronWeb
export const tronWeb = new TronWeb({
  fullHost: NETWORKS[TRON_NETWORK as keyof typeof NETWORKS],
  headers: { 'TRON-PRO-API-KEY': TRON_API_KEY },
});

// Helper: Check if address is valid
export const isValidAddress = (address: string): boolean => {
  return TronWeb.isAddress(address);
};

// Helper: Convert TRX to Sun (smallest unit)
export const toSun = (trx: number): number => {
  return TronWeb.toSun(trx);
};

// Helper: Convert Sun to TRX
export const fromSun = (sun: number): number => {
  return TronWeb.fromSun(sun);
};
```

### Step 3: Create Wallet Service

Create `src/lib/tron-wallet-service.ts`:

```typescript
import { tronWeb, isValidAddress, toSun, fromSun } from './tronweb';

export class TronWalletService {
  
  /**
   * Generate a new TRON wallet
   */
  static async generateWallet() {
    try {
      const account = await tronWeb.createAccount();
      return {
        address: account.address.base58,
        privateKey: account.privateKey,
        publicKey: account.publicKey,
      };
    } catch (error) {
      console.error('Error generating wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance (in TRX)
   */
  static async getBalance(address: string): Promise<number> {
    try {
      if (!isValidAddress(address)) {
        throw new Error('Invalid TRON address');
      }
      
      const balance = await tronWeb.trx.getBalance(address);
      return fromSun(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  /**
   * Get TRC-20 token balance
   */
  static async getTokenBalance(
    walletAddress: string,
    tokenContractAddress: string
  ): Promise<number> {
    try {
      const contract = await tronWeb.contract().at(tokenContractAddress);
      const balance = await contract.balanceOf(walletAddress).call();
      return balance.toNumber();
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  /**
   * Send TRX from one wallet to another
   */
  static async sendTRX(
    fromPrivateKey: string,
    toAddress: string,
    amount: number
  ) {
    try {
      if (!isValidAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      // Set the private key for signing
      tronWeb.setPrivateKey(fromPrivateKey);
      
      // Send transaction
      const transaction = await tronWeb.trx.sendTransaction(
        toAddress,
        toSun(amount)
      );

      return {
        success: true,
        txId: transaction.txid,
        transaction,
      };
    } catch (error) {
      console.error('Error sending TRX:', error);
      throw error;
    }
  }

  /**
   * Send TRC-20 tokens
   */
  static async sendToken(
    fromPrivateKey: string,
    toAddress: string,
    tokenContractAddress: string,
    amount: number
  ) {
    try {
      tronWeb.setPrivateKey(fromPrivateKey);
      
      const contract = await tronWeb.contract().at(tokenContractAddress);
      const transaction = await contract.transfer(toAddress, amount).send();

      return {
        success: true,
        txId: transaction,
        transaction,
      };
    } catch (error) {
      console.error('Error sending token:', error);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  static async getTransaction(txId: string) {
    try {
      const transaction = await tronWeb.trx.getTransaction(txId);
      return transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for an address
   */
  static async getTransactionHistory(
    address: string,
    limit: number = 20
  ) {
    try {
      // Using TronGrid API
      const response = await fetch(
        `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=${limit}`,
        {
          headers: {
            'TRON-PRO-API-KEY': process.env.NEXT_PUBLIC_TRON_API_KEY || '',
          },
        }
      );
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Monitor transaction confirmation
   */
  static async waitForConfirmation(
    txId: string,
    maxAttempts: number = 30
  ): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const txInfo = await tronWeb.trx.getTransactionInfo(txId);
        
        if (txInfo && txInfo.receipt && txInfo.receipt.result === 'SUCCESS') {
          return true;
        }
        
        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error checking confirmation:', error);
      }
    }
    
    return false;
  }
}
```

### Step 4: Update Environment Variables

Add to `.env.local`:

```env
# TRON API Configuration
NEXT_PUBLIC_TRON_API_KEY=your-trongrid-api-key-here
NEXT_PUBLIC_TRON_NETWORK=mainnet  # or 'shasta' for testnet

# TRC-20 Token Addresses (USDT example)
NEXT_PUBLIC_USDT_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
```

### Step 5: Update Wallet Creation

Modify `src/app/(app)/wallets/page.tsx`:

```typescript
import { TronWalletService } from '@/lib/tron-wallet-service';

const handleCreateWallet = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsCreating(true);

  const formData = new FormData(e.currentTarget);
  const walletName = formData.get('wallet-name') as string;
  const currencyType = formData.get('currency-type') as string;

  try {
    // Generate real TRON wallet
    const newWallet = await TronWalletService.generateWallet();

    const walletData = {
      userId: auth.currentUser.uid,
      name: walletName,
      walletAddress: newWallet.address,
      privateKeyEncrypted: encryptPrivateKey(newWallet.privateKey), // Implement encryption!
      currencyType: currencyType,
      balance: 0,
      createdAt: serverTimestamp(),
    };

    const walletsRef = collection(firestore, 'users', auth.currentUser.uid, 'wallets');
    await addDoc(walletsRef, walletData);

    toast({
      title: 'Wallet Created!',
      description: `New ${currencyType} wallet created: ${newWallet.address}`,
    });
    
    setIsCreateDialogOpen(false);
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Creation Failed',
      description: error.message,
    });
  } finally {
    setIsCreating(false);
  }
};
```

### Step 6: Update P2P Transfer

Modify `src/app/(app)/p2p-transfer/page.tsx`:

```typescript
import { TronWalletService } from '@/lib/tron-wallet-service';

const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsProcessing(true);

  const formData = new FormData(e.currentTarget);
  const fromWalletAddress = formData.get('from-address') as string;
  const recipientWalletAddress = formData.get('recipient-address') as string;
  const amount = parseFloat(formData.get('amount') as string);

  try {
    // 1. Get sender wallet from Firestore
    const senderWalletsRef = collection(firestore, `users/${userId}/wallets`);
    const senderQuery = query(senderWalletsRef, where('walletAddress', '==', fromWalletAddress));
    const senderSnapshot = await getDocs(senderQuery);
    
    if (senderSnapshot.empty) {
      throw new Error('Sender wallet not found');
    }
    
    const senderWallet = senderSnapshot.docs[0].data();
    
    // 2. Decrypt private key (implement proper encryption!)
    const privateKey = decryptPrivateKey(senderWallet.privateKeyEncrypted);
    
    // 3. Check real blockchain balance
    const realBalance = await TronWalletService.getBalance(fromWalletAddress);
    
    if (realBalance < amount) {
      throw new Error('Insufficient funds on blockchain');
    }
    
    // 4. Send real blockchain transaction
    const result = await TronWalletService.sendTRX(
      privateKey,
      recipientWalletAddress,
      amount
    );
    
    // 5. Wait for confirmation
    const confirmed = await TronWalletService.waitForConfirmation(result.txId);
    
    if (!confirmed) {
      throw new Error('Transaction not confirmed');
    }
    
    // 6. Update Firestore with real transaction hash
    const transactionData = {
      initiatorUserId: userId,
      senderWalletId: fromWalletAddress,
      receiverWalletId: recipientWalletAddress,
      transactionHash: result.txId, // Real blockchain hash!
      amount: amount,
      currencyType: 'TRX',
      timestamp: serverTimestamp(),
      status: 'completed',
      type: 'p2p_sent',
    };
    
    const transactionsRef = collection(firestore, `users/${userId}/all_transactions`);
    await addDoc(transactionsRef, transactionData);
    
    toast({
      title: 'Transfer Successful!',
      description: `Sent ${amount} TRX. TX: ${result.txId}`,
    });
    
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Transfer Failed',
      description: error.message,
    });
  } finally {
    setIsProcessing(false);
  }
};
```

---

## 🔐 Security Implementation

### Private Key Encryption

Create `src/lib/encryption.ts`:

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here!!';
const ALGORITHM = 'aes-256-cbc';

export function encryptPrivateKey(privateKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptPrivateKey(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**⚠️ IMPORTANT**: 
- Never store private keys in plain text
- Use environment variables for encryption keys
- Consider using hardware security modules (HSM) for production
- Implement key rotation policies

---

## 📊 Real-Time Balance Monitoring

Create `src/hooks/use-tron-balance.ts`:

```typescript
import { useState, useEffect } from 'react';
import { TronWalletService } from '@/lib/tron-wallet-service';

export function useTronBalance(address: string | null) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const bal = await TronWalletService.getBalance(address);
        setBalance(bal);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchBalance();

    // Poll every 10 seconds for real-time updates
    intervalId = setInterval(fetchBalance, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [address]);

  return { balance, isLoading, error };
}
```

Usage in component:

```typescript
const { balance, isLoading } = useTronBalance(walletAddress);

return (
  <div>
    <p>Balance: {isLoading ? 'Loading...' : `${balance} TRX`}</p>
  </div>
);
```

---

## 🌐 API Endpoints Summary

### TronGrid API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wallet/createaccount` | POST | Generate new wallet |
| `/wallet/getbalance` | POST | Get TRX balance |
| `/wallet/createtransaction` | POST | Create transaction |
| `/wallet/broadcasttransaction` | POST | Broadcast signed transaction |
| `/walletsolidity/getaccount` | POST | Get account info |
| `/walletsolidity/gettransactionbyid` | POST | Get transaction details |
| `/v1/accounts/{address}/transactions` | GET | Get transaction history |

### Example API Calls

#### Get Balance
```bash
curl -X POST https://api.trongrid.io/wallet/getbalance \
  -H "TRON-PRO-API-KEY: your-api-key" \
  -d '{"address": "TYour-Address-Here", "visible": true}'
```

#### Send Transaction
```bash
curl -X POST https://api.trongrid.io/wallet/createtransaction \
  -H "TRON-PRO-API-KEY: your-api-key" \
  -d '{
    "to_address": "TRecipient-Address",
    "owner_address": "TSender-Address",
    "amount": 1000000,
    "visible": true
  }'
```

---

## 🧪 Testing on Testnet

### Step 1: Switch to Testnet

Update `.env.local`:
```env
NEXT_PUBLIC_TRON_NETWORK=shasta
```

### Step 2: Get Test TRX

Visit: https://www.trongrid.io/shasta/#/
- Enter your wallet address
- Click "Request TRX"
- Receive 10,000 test TRX

### Step 3: Test Transactions

Use the testnet to test all functionality before going to mainnet.

---

## 📈 Rate Limits

### TronGrid Free Tier
- 15,000 requests/day
- 5 requests/second
- Upgrade for higher limits

### Best Practices
1. Cache balance data (don't query on every render)
2. Use webhooks for transaction notifications
3. Implement exponential backoff for retries
4. Monitor API usage in TronGrid dashboard

---

## 🔔 Real-Time Transaction Notifications

### Using TronGrid Event Server

```typescript
// Subscribe to address events
const eventServer = 'https://api.trongrid.io';

async function subscribeToAddress(address: string) {
  const response = await fetch(`${eventServer}/event/contract/${address}`, {
    headers: {
      'TRON-PRO-API-KEY': process.env.NEXT_PUBLIC_TRON_API_KEY,
    },
  });
  
  const events = await response.json();
  return events;
}
```

---

## 📝 Complete Integration Checklist

- [ ] Sign up for TronGrid API key
- [ ] Install TronWeb library
- [ ] Create TronWeb configuration file
- [ ] Implement wallet service
- [ ] Add private key encryption
- [ ] Update wallet creation to use real addresses
- [ ] Update P2P transfer to use blockchain
- [ ] Add real-time balance monitoring
- [ ] Implement transaction confirmation waiting
- [ ] Test on Shasta testnet
- [ ] Add error handling and retries
- [ ] Implement rate limiting
- [ ] Add transaction history sync
- [ ] Deploy to production with mainnet

---

## 🚀 Next Steps

1. **Get API Key**: https://www.trongrid.io/
2. **Read TronWeb Docs**: https://developers.tron.network/docs/tronweb
3. **Test on Shasta**: Get free test TRX
4. **Implement Security**: Encrypt private keys properly
5. **Monitor Usage**: Track API calls and costs

---

**API Integration Version**: 1.0  
**Last Updated**: December 3, 2025  
**Status**: Ready for Implementation
