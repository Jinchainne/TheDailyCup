import { useMemo } from 'react';
import { EXPLORER_URL } from '../config/network';

interface TxLog {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  blockNumber: number;
}

export function useRecentTransactions(_limit = 20) {
  const transactions = useMemo<TxLog[]>(() => [], []);
  return { transactions, loading: false, refetch: () => {} };
}

export function useBlockExplorerUrl() {
  return {
    txUrl: (hash: string) => `${EXPLORER_URL}/tx/${hash}`,
    addressUrl: (addr: string) => `${EXPLORER_URL}/address/${addr}`,
    blockUrl: (num: number) => `${EXPLORER_URL}/block/${num}`,
  };
}

