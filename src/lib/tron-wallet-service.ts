import { tronWeb, isValidAddress, toSun, fromSun, getExplorerUrl } from './tronweb';

export class TronWalletService {

    /**
     * Generate a new TRON wallet
     * Returns: { address, privateKey, publicKey }
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
            throw new Error('Failed to generate wallet');
        }
    }

    /**
     * Get wallet balance in TRX
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
            throw new Error('Failed to get balance');
        }
    }

    /**
     * Get account information
     */
    static async getAccountInfo(address: string) {
        try {
            if (!isValidAddress(address)) {
                throw new Error('Invalid TRON address');
            }

            const account = await tronWeb.trx.getAccount(address);
            return account;
        } catch (error) {
            console.error('Error getting account info:', error);
            throw new Error('Failed to get account info');
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
            throw new Error('Failed to get token balance');
        }
    }

    /**
     * Send TRX from one wallet to another
     * Returns: { success, txId, transaction, explorerUrl }
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

            if (amount <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            // Set the private key for signing
            tronWeb.setPrivateKey(fromPrivateKey);

            // Get sender address
            const fromAddress = tronWeb.address.fromPrivateKey(fromPrivateKey);

            // Check balance
            const balance = await this.getBalance(fromAddress);
            if (balance < amount) {
                throw new Error(`Insufficient balance. Have: ${balance} TRX, Need: ${amount} TRX`);
            }

            // Send transaction
            const transaction = await tronWeb.trx.sendTransaction(
                toAddress,
                toSun(amount)
            );

            if (!transaction || !transaction.txid) {
                throw new Error('Transaction failed');
            }

            return {
                success: true,
                txId: transaction.txid,
                transaction,
                explorerUrl: getExplorerUrl(transaction.txid),
            };
        } catch (error: any) {
            console.error('Error sending TRX:', error);
            throw new Error(error.message || 'Failed to send TRX');
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
            if (!isValidAddress(toAddress)) {
                throw new Error('Invalid recipient address');
            }

            tronWeb.setPrivateKey(fromPrivateKey);

            const contract = await tronWeb.contract().at(tokenContractAddress);
            const transaction = await contract.transfer(toAddress, amount).send();

            return {
                success: true,
                txId: transaction,
                transaction,
                explorerUrl: getExplorerUrl(transaction),
            };
        } catch (error: any) {
            console.error('Error sending token:', error);
            throw new Error(error.message || 'Failed to send token');
        }
    }

    /**
     * Get transaction details by transaction ID
     */
    static async getTransaction(txId: string) {
        try {
            const transaction = await tronWeb.trx.getTransaction(txId);
            return transaction;
        } catch (error) {
            console.error('Error getting transaction:', error);
            throw new Error('Failed to get transaction');
        }
    }

    /**
     * Get transaction info (includes confirmation status)
     */
    static async getTransactionInfo(txId: string) {
        try {
            const txInfo = await tronWeb.trx.getTransactionInfo(txId);
            return txInfo;
        } catch (error) {
            console.error('Error getting transaction info:', error);
            throw new Error('Failed to get transaction info');
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
            if (!isValidAddress(address)) {
                throw new Error('Invalid TRON address');
            }

            // Using TronGrid API
            const response = await fetch(
                `https://api.shasta.trongrid.io/v1/accounts/${address}/transactions?limit=${limit}`,
                {
                    headers: {
                        'TRON-PRO-API-KEY': '2d80cc66-077b-4fa1-ad5b-e799c0461474',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch transaction history');
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error getting transaction history:', error);
            throw new Error('Failed to get transaction history');
        }
    }

    /**
     * Monitor transaction confirmation
     * Waits up to 90 seconds (30 attempts x 3 seconds)
     */
    static async waitForConfirmation(
        txId: string,
        maxAttempts: number = 30
    ): Promise<boolean> {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const txInfo = await tronWeb.trx.getTransactionInfo(txId);

                if (txInfo && txInfo.receipt) {
                    if (txInfo.receipt.result === 'SUCCESS') {
                        return true;
                    } else if (txInfo.receipt.result === 'FAILED') {
                        throw new Error('Transaction failed on blockchain');
                    }
                }

                // Wait 3 seconds before next check
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error(`Confirmation check ${i + 1}/${maxAttempts}:`, error);
            }
        }

        return false;
    }

    /**
     * Validate private key format
     */
    static isValidPrivateKey(privateKey: string): boolean {
        try {
            const address = tronWeb.address.fromPrivateKey(privateKey);
            return isValidAddress(address);
        } catch {
            return false;
        }
    }

    /**
     * Get address from private key
     */
    static getAddressFromPrivateKey(privateKey: string): string {
        try {
            return tronWeb.address.fromPrivateKey(privateKey);
        } catch (error) {
            throw new Error('Invalid private key');
        }
    }
}
