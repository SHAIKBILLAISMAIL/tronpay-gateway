// @ts-nocheck
// Robust TronWeb initialization for Next.js 15+
import * as TronWebLib from 'tronweb';

// TRON API Configuration
const TRON_API_KEY = '2d80cc66-077b-4fa1-ad5b-e799c0461474';
const TRON_NETWORK = 'shasta'; // Use 'mainnet' for production

// Network URLs
const NETWORKS = {
  mainnet: 'https://api.trongrid.io',
  shasta: 'https://api.shasta.trongrid.io',
  nile: 'https://api.nileex.io',
};

let TronWebInstance: any;

// Handle different import scenarios (CommonJS vs ESM)
if (typeof TronWebLib === 'function') {
  TronWebInstance = TronWebLib;
} else if (typeof (TronWebLib as any).TronWeb === 'function') {
  TronWebInstance = (TronWebLib as any).TronWeb;
} else if (typeof (TronWebLib as any).default === 'function') {
  TronWebInstance = (TronWebLib as any).default;
} else {
  // Fallback for some environments
  TronWebInstance = require('tronweb');
}

// Initialize TronWeb with your API key
export const tronWeb: any = new TronWebInstance({
  fullHost: NETWORKS[TRON_NETWORK as keyof typeof NETWORKS],
  headers: { 'TRON-PRO-API-KEY': TRON_API_KEY },
});

// Helper: Check if address is valid
export const isValidAddress = (address: string): boolean => {
  try {
    if (!address || typeof address !== 'string') return false;
    return tronWeb.isAddress(address);
  } catch (error) {
    console.error('Error validating address:', error);
    return false;
  }
};

// Helper: Convert TRX to Sun (smallest unit)
// 1 TRX = 1,000,000 SUN
export const toSun = (trx: number): number => {
  try {
    if (typeof trx !== 'number' || trx < 0) {
      throw new Error('Invalid TRX amount');
    }
    return tronWeb.toSun(trx);
  } catch (error) {
    console.error('Error converting to Sun:', error);
    return trx * 1000000; // Fallback calculation
  }
};

// Helper: Convert Sun to TRX
export const fromSun = (sun: number): number => {
  try {
    if (typeof sun !== 'number' || sun < 0) {
      throw new Error('Invalid Sun amount');
    }
    return tronWeb.fromSun(sun);
  } catch (error) {
    console.error('Error converting from Sun:', error);
    return sun / 1000000; // Fallback calculation
  }
};

// Helper: Get current network
export const getCurrentNetwork = (): string => {
  return TRON_NETWORK;
};

// Helper: Get network explorer URL
export const getExplorerUrl = (txId: string): string => {
  const explorers = {
    mainnet: `https://tronscan.org/#/transaction/${txId}`,
    shasta: `https://shasta.tronscan.org/#/transaction/${txId}`,
    nile: `https://nile.tronscan.org/#/transaction/${txId}`,
  };
  return explorers[TRON_NETWORK as keyof typeof explorers];
};

// Helper: Get address explorer URL
export const getAddressExplorerUrl = (address: string): string => {
  const explorers = {
    mainnet: `https://tronscan.org/#/address/${address}`,
    shasta: `https://shasta.tronscan.org/#/address/${address}`,
    nile: `https://nile.tronscan.org/#/address/${address}`,
  };
  return explorers[TRON_NETWORK as keyof typeof explorers];
};

// Export TronWeb for advanced usage
export default tronWeb;
