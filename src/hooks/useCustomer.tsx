import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAccount } from 'wagmi';
import type { Order } from './useShop';

// ─── Loyalty Tiers ───
export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold';

const TIER_THRESHOLDS = {
  Bronze: { min: 0, max: 4, color: 'amber', label: 'Bronze' },
  Silver: { min: 5, max: 15, color: 'slate', label: 'Silver' },
  Gold: { min: 16, max: Infinity, color: 'yellow', label: 'Gold' },
} as const;

export function getLoyaltyTier(orderCount: number): LoyaltyTier {
  if (orderCount >= 16) return 'Gold';
  if (orderCount >= 5) return 'Silver';
  return 'Bronze';
}

export function getTierConfig(tier: LoyaltyTier) {
  return TIER_THRESHOLDS[tier];
}

export function getNextTierProgress(orderCount: number): { current: LoyaltyTier; next: LoyaltyTier | null; progress: number; ordersNeeded: number } {
  if (orderCount >= 16) {
    return { current: 'Gold', next: null, progress: 100, ordersNeeded: 0 };
  }
  if (orderCount >= 5) {
    const progress = ((orderCount - 5) / (16 - 5)) * 100;
    return { current: 'Silver', next: 'Gold', progress, ordersNeeded: 16 - orderCount };
  }
  const progress = (orderCount / 5) * 100;
  return { current: 'Bronze', next: 'Silver', progress, ordersNeeded: 5 - orderCount };
}

// ─── Customer Profile ───
export interface CustomerProfile {
  walletAddress: string;
  firstSeen: number;
  lastActive: number;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  displayName?: string;
}

interface CustomerCtx {
  customer: CustomerProfile | null;
  isConnected: boolean;
  walletAddress: string | undefined;
  orders: Order[];
  loyaltyTier: LoyaltyTier;
  tierProgress: ReturnType<typeof getNextTierProgress>;
  addOrder: (order: Order) => void;
  updateDisplayName: (name: string) => void;
  shortenAddress: (addr: string) => string;
}

const CustomerContext = createContext<CustomerCtx | null>(null);

const STORAGE_KEY = 'thedailycup_customers';
const LEGACY_STORAGE_KEY = 'coffeehouse_customers';

function loadCustomers(): Record<string, CustomerProfile> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveCustomers(customers: Record<string, CustomerProfile>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

function loadOrders(): Order[] {
  try {
    const saved = localStorage.getItem('thedailycup_orders');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function shortenAddressFn(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>(loadOrders);

  // Sync orders from localStorage on mount and listen for changes
  useEffect(() => {
    const syncOrders = () => setAllOrders(loadOrders());
    window.addEventListener('storage', syncOrders);
    // Also poll periodically in case same-tab changes happen
    const interval = setInterval(syncOrders, 2000);
    return () => {
      window.removeEventListener('storage', syncOrders);
      clearInterval(interval);
    };
  }, []);

  // Auto-create / update customer profile on wallet connect
  useEffect(() => {
    if (!isConnected || !address) {
      setCustomer(null);
      return;
    }

    const customers = loadCustomers();
    const key = address.toLowerCase();
    const now = Date.now();

    // Calculate stats from existing orders for this wallet
    const walletOrders = allOrders.filter(
      o => o.customerWallet?.toLowerCase() === key
    );
    const totalOrders = walletOrders.length;
    const totalSpent = walletOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, o) => sum + o.total, 0);
    // 1 loyalty point per 1 RITUAL spent
    const loyaltyPoints = Math.floor(totalSpent);

    if (customers[key]) {
      // Existing customer — update stats
      const updated: CustomerProfile = {
        ...customers[key],
        lastActive: now,
        totalOrders,
        totalSpent,
        loyaltyPoints,
      };
      customers[key] = updated;
      saveCustomers(customers);
      setCustomer(updated);
    } else {
      // New customer — create profile
      const newCustomer: CustomerProfile = {
        walletAddress: address,
        firstSeen: now,
        lastActive: now,
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
      };
      customers[key] = newCustomer;
      saveCustomers(customers);
      setCustomer(newCustomer);
    }
  }, [address, isConnected, allOrders]);

  // Filter orders for current wallet
  const customerOrders = address
    ? allOrders.filter(o => o.customerWallet?.toLowerCase() === address.toLowerCase())
    : [];

  const loyaltyTier = customer ? getLoyaltyTier(customer.totalOrders) : 'Bronze';
  const tierProgress = customer ? getNextTierProgress(customer.totalOrders) : getNextTierProgress(0);

  // Register a new order against the customer
  const addOrder = useCallback((order: Order) => {
    setAllOrders(prev => {
      const updated = [order, ...prev];
      localStorage.setItem('thedailycup_orders', JSON.stringify(updated));
      return updated;
    });
    // Refresh customer stats
    if (address) {
      const customers = loadCustomers();
      const key = address.toLowerCase();
      if (customers[key]) {
        customers[key].lastActive = Date.now();
        customers[key].totalOrders += 1;
        customers[key].totalSpent += order.total;
        customers[key].loyaltyPoints += Math.floor(order.total);
        saveCustomers(customers);
        setCustomer({ ...customers[key] });
      }
    }
  }, [address]);

  const updateDisplayName = useCallback((name: string) => {
    if (!address) return;
    const customers = loadCustomers();
    const key = address.toLowerCase();
    if (customers[key]) {
      customers[key].displayName = name;
      saveCustomers(customers);
      setCustomer({ ...customers[key] });
    }
  }, [address]);

  return (
    <CustomerContext.Provider value={{
      customer,
      isConnected,
      walletAddress: address,
      orders: customerOrders,
      loyaltyTier,
      tierProgress,
      addOrder,
      updateDisplayName,
      shortenAddress: shortenAddressFn,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
}

