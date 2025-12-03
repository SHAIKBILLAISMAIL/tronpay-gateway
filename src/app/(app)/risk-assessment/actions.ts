'use server';

import { assessTransactionRisk } from '@/ai/ai-risk-assessment';

// Define a more specific type for the transaction object expected by this action
export interface TransactionWithRisk {
    id: string;
    transactionHash: string;
    amount: number;
    currencyType: string;
    status: string;
    timestamp: {
        toDate: () => Date;
    };
    senderWalletId: string;
    receiverWalletId: string;
    [key: string]: any; // Allow other properties
}


export async function getRiskAssessmentForTransaction(transaction: TransactionWithRisk) {
  try {
    const transactionDetails = `
      ID: ${transaction.id},
      Hash: ${transaction.transactionHash},
      Status: ${transaction.status},
      Date: ${transaction.timestamp.toDate().toISOString()},
      Amount: ${transaction.amount} ${transaction.currencyType},
      From: ${transaction.senderWalletId},
      To: ${transaction.receiverWalletId}
    `;

    const assessment = await assessTransactionRisk({
      transactionDetails: transactionDetails,
      userActivity: 'No activity history available.', // Placeholder
      systemHealth: 'System is healthy.', // Placeholder
    });

    return { success: true, data: assessment };
  } catch (error) {
    console.error('Error getting risk assessment:', error);
    return { success: false, error: 'Failed to assess risk.' };
  }
}
