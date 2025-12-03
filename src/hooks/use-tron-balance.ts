import { useState, useEffect } from 'react';
import { TronWalletService } from '@/lib/tron-wallet-service';

/**
 * Hook to get real-time TRON balance from blockchain
 * Updates every 10 seconds
 */
export function useTronBalance(address: string | null) {
    const [balance, setBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!address) {
            setIsLoading(false);
            setBalance(0);
            return;
        }

        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchBalance = async () => {
            try {
                setIsLoading(true);
                const bal = await TronWalletService.getBalance(address);

                if (isMounted) {
                    setBalance(bal);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err as Error);
                    console.error('Error fetching balance:', err);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        // Initial fetch
        fetchBalance();

        // Poll every 10 seconds for real-time updates
        intervalId = setInterval(fetchBalance, 10000);

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [address]);

    return { balance, isLoading, error, refetch: () => { } };
}

/**
 * Hook to get account information from blockchain
 */
export function useTronAccount(address: string | null) {
    const [account, setAccount] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!address) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const fetchAccount = async () => {
            try {
                setIsLoading(true);
                const acc = await TronWalletService.getAccountInfo(address);

                if (isMounted) {
                    setAccount(acc);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err as Error);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchAccount();

        return () => {
            isMounted = false;
        };
    }, [address]);

    return { account, isLoading, error };
}
