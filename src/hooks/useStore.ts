import { useState, useCallback } from 'react';
import type { Transaction, Contact, SplitGroup, SplitExpense, RemitTransfer } from '../types';
import { generateId } from '../utils/format';

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Alice Chen', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
  { id: '2', name: 'Bob Martinez', address: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72' },
  { id: '3', name: 'Carol Wang', address: '0xAb5801a7D398351b8bE11C439e05C5b3259aeC9B' },
  { id: '4', name: 'David Kim', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
  { id: '5', name: 'Emma Johnson', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'receive', amount: 250.00, currency: 'RITUAL', from: 'Alice Chen', to: 'You', status: 'completed', timestamp: Date.now() - 300000, hash: '0xabc123', memo: 'Dinner split' },
  { id: '2', type: 'send', amount: 500.00, currency: 'RITUAL', from: 'You', to: 'Bob Martinez', status: 'completed', timestamp: Date.now() - 3600000, hash: '0xdef456', memo: 'Monthly rent' },
  { id: '3', type: 'split', amount: 85.50, currency: 'RITUAL', from: 'You', to: 'Group: Team Lunch', status: 'completed', timestamp: Date.now() - 7200000, hash: '0xghi789' },
  { id: '4', type: 'send', amount: 1200.00, currency: 'RITUAL', from: 'You', to: 'Carol Wang', status: 'pending', timestamp: Date.now() - 10800000, hash: '0xjkl012', memo: 'Freelance payment' },
  { id: '5', type: 'remit', amount: 950.00, currency: 'RITUAL', from: 'You', to: 'David Kim (UK)', status: 'completed', timestamp: Date.now() - 86400000, hash: '0xmno345' },
  { id: '6', type: 'receive', amount: 320.00, currency: 'RITUAL', from: 'Emma Johnson', to: 'You', status: 'completed', timestamp: Date.now() - 172800000, hash: '0xpqr678' },
  { id: '7', type: 'send', amount: 45.00, currency: 'RITUAL', from: 'You', to: 'Alice Chen', status: 'completed', timestamp: Date.now() - 259200000, hash: '0xstu901', memo: 'Coffee run' },
];

const MOCK_GROUPS: SplitGroup[] = [
  { id: '1', name: 'Team Lunch', members: [MOCK_CONTACTS[0], MOCK_CONTACTS[1], MOCK_CONTACTS[2]], totalExpenses: 256.50, currency: 'RITUAL', createdAt: Date.now() - 604800000 },
  { id: '2', name: 'Weekend Trip', members: [MOCK_CONTACTS[0], MOCK_CONTACTS[3], MOCK_CONTACTS[4]], totalExpenses: 1200.00, currency: 'RITUAL', createdAt: Date.now() - 1209600000 },
  { id: '3', name: 'Office Supplies', members: [MOCK_CONTACTS[1], MOCK_CONTACTS[2]], totalExpenses: 89.99, currency: 'RITUAL', createdAt: Date.now() - 2592000000 },
];

const MOCK_SPLIT_EXPENSES: SplitExpense[] = [
  { id: '1', groupId: '1', description: 'Sushi restaurant', amount: 156.50, paidBy: 'You', splitAmong: ['You', 'Alice Chen', 'Bob Martinez', 'Carol Wang'], timestamp: Date.now() - 86400000 },
  { id: '2', groupId: '1', description: 'Bubble tea', amount: 40.00, paidBy: 'Alice Chen', splitAmong: ['You', 'Alice Chen', 'Bob Martinez', 'Carol Wang'], timestamp: Date.now() - 172800000 },
  { id: '3', groupId: '1', description: 'Taxi', amount: 60.00, paidBy: 'Bob Martinez', splitAmong: ['You', 'Alice Chen', 'Bob Martinez', 'Carol Wang'], timestamp: Date.now() - 259200000 },
  { id: '4', groupId: '2', description: 'Airbnb', amount: 800.00, paidBy: 'You', splitAmong: ['You', 'Alice Chen', 'David Kim', 'Emma Johnson'], timestamp: Date.now() - 604800000 },
  { id: '5', groupId: '2', description: 'Activities', amount: 400.00, paidBy: 'David Kim', splitAmong: ['You', 'Alice Chen', 'David Kim', 'Emma Johnson'], timestamp: Date.now() - 518400000 },
];

const MOCK_REMITS: RemitTransfer[] = [
  { id: '1', fromCurrency: 'RITUAL', toCurrency: 'RITUAL', fromAmount: 500, toAmount: 458.50, recipient: 'David Kim', recipientCountry: 'United Kingdom', status: 'completed', timestamp: Date.now() - 86400000, rate: 0.917 },
  { id: '2', fromCurrency: 'RITUAL', toCurrency: 'RITUAL', fromAmount: 1000, toAmount: 997.50, recipient: 'Emma Johnson', recipientCountry: 'United States', status: 'completed', timestamp: Date.now() - 604800000, rate: 0.9975 },
  { id: '3', fromCurrency: 'RITUAL', toCurrency: 'RITUAL', fromAmount: 250, toAmount: 229.13, recipient: 'Alice Chen', recipientCountry: 'Germany', status: 'pending', timestamp: Date.now() - 3600000, rate: 0.9165 },
];

export function useStore() {
  const [balance] = useState({ usdc: 12847.53, eurc: 2340.80 });
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [contacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [groups] = useState<SplitGroup[]>(MOCK_GROUPS);
  const [expenses] = useState<SplitExpense[]>(MOCK_SPLIT_EXPENSES);
  const [remits, setRemits] = useState<RemitTransfer[]>(MOCK_REMITS);

  const sendRITUAL = useCallback(async (to: string, amount: number, memo?: string) => {
    const tx: Transaction = {
      id: generateId(),
      type: 'send',
      amount,
      currency: 'RITUAL',
      from: 'You',
      to,
      status: 'pending',
      timestamp: Date.now(),
      hash: `0x${generateId()}`,
      memo,
    };
    setTransactions(prev => [tx, ...prev]);
    await new Promise(r => setTimeout(r, 2000));
    setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'completed' } : t));
    return tx;
  }, []);

  const createRemit = useCallback(async (_from: string, to: string, amount: number, rate: number, country: string) => {
    const remit: RemitTransfer = {
      id: generateId(),
      fromCurrency: 'RITUAL',
      toCurrency: 'RITUAL',
      fromAmount: amount,
      toAmount: parseFloat((amount * rate).toFixed(2)),
      recipient: to,
      recipientCountry: country,
      status: 'pending',
      timestamp: Date.now(),
      rate,
    };
    setRemits(prev => [remit, ...prev]);
    await new Promise(r => setTimeout(r, 3000));
    setRemits(prev => prev.map(r => r.id === remit.id ? { ...r, status: 'completed' } : r));
    return remit;
  }, []);

  return { balance, transactions, contacts, groups, expenses, remits, sendRITUAL, createRemit };
}

