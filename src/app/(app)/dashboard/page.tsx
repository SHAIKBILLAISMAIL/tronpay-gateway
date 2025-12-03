
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  DollarSign,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  useAuth,
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, limit, orderBy, collectionGroup } from 'firebase/firestore';
import { useMemo } from 'react';
import { subDays, format, startOfDay } from 'date-fns';

const chartConfig = {
  transactions: {
    label: 'Transactions',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const auth = useAuth();
  const firestore = useFirestore();

  const walletsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
  }, [firestore, auth.currentUser]);
  const { data: wallets } = useCollection(walletsQuery);

  const transactionsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return query(
        collection(firestore, 'users', auth.currentUser.uid, 'all_transactions'),
        orderBy('timestamp', 'desc')
    );
  }, [firestore, auth.currentUser]);

  const { data: allTransactions } = useCollection(transactionsQuery);

  const recentTransactions = useMemo(() => {
    return allTransactions?.slice(0, 5) || [];
  }, [allTransactions]);

  const totalBalanceByCurrency = useMemo(() => {
    if (!wallets) return {};
    return wallets.reduce((acc, wallet) => {
      const currency = wallet.currencyType || 'USD';
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += wallet.balance;
      return acc;
    }, {} as Record<string, number>);
  }, [wallets]);
  

  const transactionVolumeData = useMemo(() => {
    if (!allTransactions) return [];
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
    
    return days.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        
        const dailyTotal = allTransactions
            .filter(tx => tx.timestamp && format(tx.timestamp.toDate(), 'yyyy-MM-dd') === dateString && tx.currencyType === 'USD')
            .reduce((sum, tx) => sum + tx.amount, 0);

        return {
            date: dateString,
            transactions: dailyTotal,
        };
    });
}, [allTransactions]);

  const totalTransactionsCount = allTransactions?.length || 0;
  
  const totalVolumeUSD = useMemo(() => {
    return allTransactions?.filter(tx => tx.currencyType === 'USD').reduce((sum, tx) => sum + tx.amount, 0) || 0;
  }, [allTransactions]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {Object.keys(totalBalanceByCurrency).map(currency => (
              <div key={currency} className="text-2xl font-bold">
                {totalBalanceByCurrency[currency].toLocaleString('en-US', {
                  style: 'currency',
                  currency: currency,
                })}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transaction Volume (USD)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVolumeUSD.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total value of all USD transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalTransactionsCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all transaction types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{wallets?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Wallets you currently own
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Transaction volume (USD) over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                accessibilityLayer
                data={transactionVolumeData}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                    })
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="transactions"
                  fill="var(--color-transactions)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your 5 most recent transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {recentTransactions && recentTransactions.length > 0 ? (
            <Table>
              <TableBody>
                {recentTransactions.map((tx: any) => {
                 const isSent = tx.type === 'p2p_sent' || tx.type === 'card' || tx.type === 'ip';
                return(
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                        {isSent ? (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {isSent ? 'Sent' : 'Received'}{' '}
                        {tx.currencyType}
                      </div>
                      <div className="hidden text-sm text-muted-foreground md:inline max-w-[150px] truncate">
                        {isSent
                          ? `To: ${tx.receiverWalletId}`
                          : `From: ${tx.senderWalletId}`}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {isSent ? '-' : '+'}
                      {tx.amount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: tx.currencyType,
                      })}
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
            ) : (
                <p className="text-sm text-muted-foreground">No recent transactions found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    