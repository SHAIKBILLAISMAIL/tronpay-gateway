'use server';
/**
 * @fileOverview An AI-powered risk assessment tool that monitors transactions,
 * evaluates for suspicious activities, and notifies administrators of potential risks.
 *
 * - assessTransactionRisk - A function that assesses the risk of a given transaction.
 * - AssessTransactionRiskInput - The input type for the assessTransactionRisk function.
 * - AssessTransactionRiskOutput - The return type for the assessTransactionRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessTransactionRiskInputSchema = z.object({
  transactionDetails: z.string().describe('Details of the transaction, including sender, receiver, amount, currency, and timestamp.'),
  userActivity: z.string().describe('History of user activity, including past transactions and wallet details. For now, this can be empty.'),
  systemHealth: z.string().describe('Current system health and security metrics. For now, this can be "healthy".'),
});
export type AssessTransactionRiskInput = z.infer<typeof AssessTransactionRiskInputSchema>;

const AssessTransactionRiskOutputSchema = z.object({
  riskScore: z.number().describe('A numerical risk score for the transaction (0-100).'),
  riskLevel: z.string().describe('A qualitative risk level (Low, Medium, High).'),
  riskFactors: z.array(z.string()).describe('A list of factors contributing to the risk score.'),
  recommendations: z.string().describe('Recommendations for handling the transaction (e.g., manual review, block transaction).'),
});
export type AssessTransactionRiskOutput = z.infer<typeof AssessTransactionRiskOutputSchema>;

export async function assessTransactionRisk(input: AssessTransactionRiskInput): Promise<AssessTransactionRiskOutput> {
  return assessTransactionRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessTransactionRiskPrompt',
  input: {schema: AssessTransactionRiskInputSchema},
  output: {schema: AssessTransactionRiskOutputSchema},
  prompt: `You are an AI-powered risk assessment tool for a payment gateway.

  Your task is to analyze transaction details, user activity, and system health to assess the risk of a given transaction.
  Provide a risk score (0-100), a risk level (Low, Medium, High), a list of risk factors, and recommendations for handling the transaction.

  Transaction Details: {{{transactionDetails}}}
  User Activity: {{{userActivity}}}
  System Health: {{{systemHealth}}}

  Format your output as a JSON object with the following keys:
  - riskScore: A numerical risk score for the transaction (0-100).
  - riskLevel: A qualitative risk level (Low, Medium, High).
  - riskFactors: A list of factors contributing to the risk score.
  - recommendations: Recommendations for handling the transaction (e.g., manual review, block transaction).`,
});

const assessTransactionRiskFlow = ai.defineFlow(
  {
    name: 'assessTransactionRiskFlow',
    inputSchema: AssessTransactionRiskInputSchema,
    outputSchema: AssessTransactionRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
