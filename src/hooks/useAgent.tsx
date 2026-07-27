import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface AgentWallet {
  address: string;
  balance: number;
  label: string;
}

export interface Agent {
  id: string;
  name: string;
  role: 'order' | 'merchant' | 'delivery' | 'ai_advisor';
  wallet: AgentWallet;
  status: 'active' | 'idle' | 'processing';
  decisions: AgentDecision[];
  transactions: AgentTransaction[];
  createdAt: number;
}

export interface AgentDecision {
  id: string;
  agentId: string;
  type: 'recommendation' | 'payment' | 'settlement' | 'routing' | 'risk_check';
  description: string;
  signal: string;
  result: string;
  confidence: number;
  timestamp: number;
}

export interface AgentTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: 'RITUAL';
  type: 'nanopayment' | 'settlement' | 'service_fee' | 'delivery_fee';
  description: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  timestamp: number;
}

export interface NanoPayment {
  id: string;
  fromAgent: string;
  toAgent: string;
  amount: number;
  service: string;
  status: 'pending' | 'paid';
  timestamp: number;
}

interface AgentCtx {
  agents: Agent[];
  nanoPayments: NanoPayment[];
  totalAgentBalance: number;
  totalTransactions: number;
  totalDecisions: number;
  processOrder: (orderItems: string[], total: number) => void;
  settlePayment: (fromAgent: string, toAgent: string, amount: number, desc: string) => void;
  dispatchDelivery: (orderId: string, address: string) => void;
  getAgentById: (id: string) => Agent | undefined;
  addDecision: (agentId: string, decision: Omit<AgentDecision, 'id' | 'timestamp'>) => void;
  sendNanoPayment: (from: string, to: string, amount: number, service: string) => void;
}

const AgentContext = createContext<AgentCtx | null>(null);
const AGENTS_STORAGE_KEY = 'thedailycup_agents';
const LEGACY_AGENTS_STORAGE_KEY = 'coffeehouse_agents';
const NANO_STORAGE_KEY = 'thedailycup_nano';
const LEGACY_NANO_STORAGE_KEY = 'coffeehouse_nano';

// Demo data so dashboard shows real activity on first load
function getDefaultAgents(): Agent[] {
  const now = Date.now();
  const h = (hours: number) => now - hours * 3600000;
  const m = (mins: number) => now - mins * 60000;

  return [
    {
      id: 'agent-order',
      name: 'Order Agent',
      role: 'order',
      wallet: { address: '0xA1B2...order', balance: 49.97, label: 'Order Processing Wallet' },
      status: 'active',
      decisions: [
        { id: 'D-1', agentId: 'agent-order', type: 'risk_check', description: 'Analyzing order of 2 items worth $11.91 RITUAL', signal: 'Order total: $11.91, Items: Caffè Latte, Butter Croissant', result: 'Approved: within normal range', confidence: 95, timestamp: m(15) },
        { id: 'D-2', agentId: 'agent-order', type: 'risk_check', description: 'Analyzing order of 1 item worth $7.50 RITUAL', signal: 'Order total: $7.50, Items: Cơm Tấm Sườn Nướng', result: 'Approved: within normal range', confidence: 97, timestamp: m(45) },
        { id: 'D-3', agentId: 'agent-order', type: 'risk_check', description: 'Analyzing order of 3 items worth $24.50 RITUAL', signal: 'Order total: $24.50, Items: Phở Bò Tái, Bún Bò Huế, Cà Phê Sữa Đá', result: 'Approved: within normal range', confidence: 93, timestamp: h(2) },
      ],
      transactions: [
        { id: 'TX-1', from: 'agent-order', to: 'agent-merchant', amount: 0.01, currency: 'RITUAL', type: 'nanopayment', description: 'Order processing fee', status: 'confirmed', txHash: '0xabc123...', timestamp: m(15) },
        { id: 'TX-2', from: 'agent-order', to: 'agent-merchant', amount: 0.01, currency: 'RITUAL', type: 'nanopayment', description: 'Order processing fee', status: 'confirmed', txHash: '0xdef456...', timestamp: m(45) },
      ],
      createdAt: h(24),
    },
    {
      id: 'agent-merchant',
      name: 'Merchant Agent',
      role: 'merchant',
      wallet: { address: '0xC3D4...merch', balance: 500.04, label: 'Merchant Settlement Wallet' },
      status: 'active',
      decisions: [
        { id: 'D-4', agentId: 'agent-merchant', type: 'settlement', description: 'Settling payment of $11.91 RITUAL for order', signal: 'Payment received: $11.91 RITUAL from customer wallet', result: 'Payment confirmed on Ritual Testnet, order queued for preparation', confidence: 99, timestamp: m(14) },
        { id: 'D-5', agentId: 'agent-merchant', type: 'settlement', description: 'Settling payment of $7.50 RITUAL for order', signal: 'Payment received: $7.50 RITUAL from customer wallet', result: 'Payment confirmed on Ritual Testnet, order queued for preparation', confidence: 99, timestamp: m(44) },
        { id: 'D-6', agentId: 'agent-merchant', type: 'settlement', description: 'Settling payment of $24.50 RITUAL for order', signal: 'Payment received: $24.50 RITUAL from customer wallet', result: 'Payment confirmed on Ritual Testnet, order dispatched', confidence: 99, timestamp: h(2) },
      ],
      transactions: [
        { id: 'TX-3', from: 'agent-merchant', to: 'agent-ai', amount: 0.005, currency: 'RITUAL', type: 'nanopayment', description: 'AI recommendation service', status: 'confirmed', timestamp: m(14) },
        { id: 'TX-4', from: 'agent-merchant', to: 'agent-delivery', amount: 0.50, currency: 'RITUAL', type: 'delivery_fee', description: 'Delivery dispatch fee', status: 'confirmed', timestamp: m(13) },
      ],
      createdAt: h(24),
    },
    {
      id: 'agent-delivery',
      name: 'Delivery Agent',
      role: 'delivery',
      wallet: { address: '0xE5F6...deliv', balance: 25.50, label: 'Delivery Routing Wallet' },
      status: 'active',
      decisions: [
        { id: 'D-7', agentId: 'agent-delivery', type: 'routing', description: 'Routing delivery for order ORD-M1K2P', signal: 'Delivery address: Trường Chinh, Ho Chi Minh City', result: 'Delivery dispatched, ETA 25 minutes', confidence: 90, timestamp: m(13) },
        { id: 'D-8', agentId: 'agent-delivery', type: 'routing', description: 'Routing delivery for order ORD-N2L3Q', signal: 'Delivery address: District 7, Ho Chi Minh City', result: 'Delivery dispatched, ETA 30 minutes', confidence: 88, timestamp: m(43) },
      ],
      transactions: [
        { id: 'TX-5', from: 'agent-merchant', to: 'agent-delivery', amount: 0.50, currency: 'RITUAL', type: 'delivery_fee', description: 'Delivery dispatch fee', status: 'confirmed', timestamp: m(13) },
      ],
      createdAt: h(24),
    },
    {
      id: 'agent-ai',
      name: 'AI Advisor Agent',
      role: 'ai_advisor',
      wallet: { address: '0xG7H8...advisor', balance: 100.01, label: 'AI Service Wallet' },
      status: 'active',
      decisions: [
        { id: 'D-9', agentId: 'agent-ai', type: 'recommendation', description: 'Suggesting complementary items for coffee order', signal: 'Cart contains: Caffè Latte, Butter Croissant', result: 'Recommendation: Add Matcha Latte or Fruit Juice', confidence: 82, timestamp: m(14) },
        { id: 'D-10', agentId: 'agent-ai', type: 'recommendation', description: 'Suggesting complementary items for Vietnamese food', signal: 'Cart contains: Phở Bò Tái, Bún Bò Huế', result: 'Recommendation: Add Cà Phê Sữa Đá for authentic experience', confidence: 88, timestamp: h(2) },
      ],
      transactions: [
        { id: 'TX-6', from: 'agent-merchant', to: 'agent-ai', amount: 0.005, currency: 'RITUAL', type: 'nanopayment', description: 'AI recommendation service', status: 'confirmed', timestamp: m(14) },
      ],
      createdAt: h(24),
    },
  ];
}

function getDefaultNanoPayments(): NanoPayment[] {
  const now = Date.now();
  const m = (mins: number) => now - mins * 60000;
  return [
    { id: 'NP-1', fromAgent: 'agent-order', toAgent: 'agent-merchant', amount: 0.01, service: 'Order processing fee', status: 'paid', timestamp: m(15) },
    { id: 'NP-2', fromAgent: 'agent-merchant', toAgent: 'agent-ai', amount: 0.005, service: 'AI recommendation service', status: 'paid', timestamp: m(14) },
    { id: 'NP-3', fromAgent: 'agent-merchant', toAgent: 'agent-delivery', amount: 0.50, service: 'Delivery dispatch fee', status: 'paid', timestamp: m(13) },
    { id: 'NP-4', fromAgent: 'agent-order', toAgent: 'agent-merchant', amount: 0.01, service: 'Order processing fee', status: 'paid', timestamp: m(45) },
  ];
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      const saved = localStorage.getItem(AGENTS_STORAGE_KEY) || localStorage.getItem(LEGACY_AGENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : getDefaultAgents();
      }
      return getDefaultAgents();
    } catch { return getDefaultAgents(); }
  });

  const [nanoPayments, setNanoPayments] = useState<NanoPayment[]>(() => {
    try {
      const saved = localStorage.getItem(NANO_STORAGE_KEY) || localStorage.getItem(LEGACY_NANO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : getDefaultNanoPayments();
      }
      return getDefaultNanoPayments();
    } catch { return getDefaultNanoPayments(); }
  });

  const saveAgents = (updated: Agent[]) => {
    setAgents(updated);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updated));
  };

  const addDecision = useCallback((agentId: string, decision: Omit<AgentDecision, 'id' | 'timestamp'>) => {
    saveAgents(agents.map(a => {
      if (a.id !== agentId) return a;
      const newDecision: AgentDecision = { ...decision, id: `D-${Date.now().toString(36)}`, timestamp: Date.now() };
      return { ...a, decisions: [newDecision, ...a.decisions].slice(0, 50) };
    }));
  }, [agents]);

  const addTransaction = useCallback((tx: Omit<AgentTransaction, 'id' | 'timestamp'>) => {
    saveAgents(agents.map(a => {
      if (a.id !== tx.from && a.id !== tx.to) return a;
      const newTx: AgentTransaction = { ...tx, id: `TX-${Date.now().toString(36)}`, timestamp: Date.now() };
      const updated = { ...a, transactions: [newTx, ...a.transactions].slice(0, 50) };
      if (a.id === tx.from) updated.wallet = { ...a.wallet, balance: a.wallet.balance - tx.amount };
      if (a.id === tx.to) updated.wallet = { ...a.wallet, balance: a.wallet.balance + tx.amount };
      return updated;
    }));
  }, [agents]);

  const sendNanoPayment = useCallback((from: string, to: string, amount: number, service: string) => {
    const payment: NanoPayment = {
      id: `NP-${Date.now().toString(36)}`,
      fromAgent: from, toAgent: to, amount, service, status: 'paid', timestamp: Date.now(),
    };
    setNanoPayments(prev => {
      const updated = [payment, ...prev];
      localStorage.setItem(NANO_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    addTransaction({ from, to, amount, currency: 'RITUAL', type: 'nanopayment', description: service, status: 'confirmed' });
  }, [addTransaction]);

  const processOrder = useCallback((orderItems: string[], total: number) => {
    addDecision('agent-order', {
      agentId: 'agent-order', type: 'risk_check',
      description: `Analyzing order of ${orderItems.length} items worth $${total.toFixed(2)} RITUAL`,
      signal: `Order total: $${total.toFixed(2)}, Items: ${orderItems.join(', ')}`,
      result: total > 100 ? 'Flagged: high-value order, require confirmation' : 'Approved: within normal range',
      confidence: total > 100 ? 75 : 95,
    });
    addDecision('agent-ai', {
      agentId: 'agent-ai', type: 'recommendation',
      description: `Suggesting complementary items for order`,
      signal: `Cart contains: ${orderItems.slice(0, 3).join(', ')}`,
      result: 'Recommendation: Add a beverage to complement food items',
      confidence: 82,
    });
    addDecision('agent-merchant', {
      agentId: 'agent-merchant', type: 'settlement',
      description: `Settling payment of $${total.toFixed(2)} RITUAL for order`,
      signal: `Payment received: $${total.toFixed(2)} RITUAL from customer wallet`,
      result: 'Payment confirmed on Ritual Testnet, order queued for preparation',
      confidence: 99,
    });
    sendNanoPayment('agent-order', 'agent-merchant', 0.01, 'Order processing fee');
    sendNanoPayment('agent-merchant', 'agent-ai', 0.005, 'AI recommendation service');
  }, [addDecision, sendNanoPayment]);

  const settlePayment = useCallback((fromAgent: string, toAgent: string, amount: number, desc: string) => {
    addTransaction({ from: fromAgent, to: toAgent, amount, currency: 'RITUAL', type: 'settlement', description: desc, status: 'confirmed' });
    addDecision(fromAgent, {
      agentId: fromAgent, type: 'payment',
      description: `Settling $${amount.toFixed(4)} RITUAL to ${toAgent}`,
      signal: `Settlement request: ${desc}`,
      result: 'Transaction confirmed on Ritual Testnet', confidence: 99,
    });
  }, [addTransaction, addDecision]);

  const dispatchDelivery = useCallback((orderId: string, address: string) => {
    addDecision('agent-delivery', {
      agentId: 'agent-delivery', type: 'routing',
      description: `Routing delivery for order ${orderId}`,
      signal: `Delivery address: ${address}`,
      result: 'Delivery dispatched, ETA 25 minutes', confidence: 90,
    });
    sendNanoPayment('agent-merchant', 'agent-delivery', 0.50, 'Delivery dispatch fee');
    saveAgents(agents.map(a => a.id === 'agent-delivery' ? { ...a, status: 'processing' as const } : a));
  }, [agents, addDecision, sendNanoPayment, saveAgents]);

  const getAgentById = useCallback((id: string) => agents.find(a => a.id === id), [agents]);

  const totalAgentBalance = agents.reduce((s, a) => s + a.wallet.balance, 0);
  const totalTransactions = agents.reduce((s, a) => s + a.transactions.length, 0);
  const totalDecisions = agents.reduce((s, a) => s + a.decisions.length, 0);

  return (
    <AgentContext.Provider value={{
      agents, nanoPayments, totalAgentBalance, totalTransactions, totalDecisions,
      processOrder, settlePayment, dispatchDelivery, getAgentById, addDecision, sendNanoPayment,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within AgentProvider');
  return ctx;
}

