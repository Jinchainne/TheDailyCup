import { useLocalStorage } from './useLocalStorage';

export interface SplitMember {
  name: string;
  address: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  members: SplitMember[];
  createdAt: number;
}

export interface SplitExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  timestamp: number;
  settled: boolean;
  txHash?: string;
}

export function useSplitGroups() {
  const [groups, setGroups] = useLocalStorage<SplitGroup[]>('split-groups', []);
  const [expenses, setExpenses] = useLocalStorage<SplitExpense[]>('split-expenses', []);

  const addGroup = (name: string, members: SplitMember[]) => {
    const group: SplitGroup = { id: Date.now().toString(), name, members, createdAt: Date.now() };
    setGroups(prev => [group, ...prev]);
    return group;
  };

  const addExpense = (expense: Omit<SplitExpense, 'id' | 'timestamp' | 'settled'>) => {
    const newExpense: SplitExpense = { ...expense, id: Date.now().toString(), timestamp: Date.now(), settled: false };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const getGroupExpenses = (groupId: string) => expenses.filter(e => e.groupId === groupId);
  const getGroupTotal = (groupId: string) => expenses.filter(e => e.groupId === groupId).reduce((sum, e) => sum + e.amount, 0);

  return { groups, expenses, addGroup, addExpense, getGroupExpenses, getGroupTotal };
}

