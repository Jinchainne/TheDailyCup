import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface WishlistItem {
  productId: string;
  walletAddress: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  productId: string;
  walletAddress: string;
  text: string;
  rating: number; // 1-5
  timestamp: number;
}

export interface OrderLog {
  id: string;
  orderId: string;
  event: 'created' | 'payment_sent' | 'payment_confirmed' | 'payment_failed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
  details: string;
  walletAddress?: string;
  amount?: number;
  txHash?: string;
  timestamp: number;
}

interface SocialCtx {
  wishlist: string[]; // product IDs
  comments: Comment[];
  orderLogs: OrderLog[];
  toggleWishlist: (productId: string, _wallet: string) => void;
  isWishlisted: (productId: string) => boolean;
  addComment: (productId: string, wallet: string, text: string, rating: number) => void;
  getProductComments: (productId: string) => Comment[];
  getProductRating: (productId: string) => number;
  addOrderLog: (log: Omit<OrderLog, 'id' | 'timestamp'>) => void;
  getOrderLogs: (orderId: string) => OrderLog[];
}

const SocialContext = createContext<SocialCtx | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('coffeehouse_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      const saved = localStorage.getItem('coffeehouse_comments');
      return saved ? JSON.parse(saved) : getDefaultComments();
    } catch { return getDefaultComments(); }
  });

  const [orderLogs, setOrderLogs] = useState<OrderLog[]>(() => {
    try {
      const saved = localStorage.getItem('coffeehouse_orderlogs');
      return saved ? JSON.parse(saved) : getDefaultLogs();
    } catch { return getDefaultLogs(); }
  });

  const toggleWishlist = useCallback((productId: string, _wallet: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem('coffeehouse_wishlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isWishlisted = useCallback((productId: string) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const addComment = useCallback((productId: string, wallet: string, text: string, rating: number) => {
    const comment: Comment = {
      id: `CMT-${Date.now().toString(36)}`,
      productId, walletAddress: wallet, text, rating, timestamp: Date.now(),
    };
    setComments(prev => {
      const updated = [comment, ...prev];
      localStorage.setItem('coffeehouse_comments', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getProductComments = useCallback((productId: string) => {
    return comments.filter(c => c.productId === productId).sort((a, b) => b.timestamp - a.timestamp);
  }, [comments]);

  const getProductRating = useCallback((productId: string) => {
    const productComments = comments.filter(c => c.productId === productId);
    if (productComments.length === 0) return 0;
    return productComments.reduce((s, c) => s + c.rating, 0) / productComments.length;
  }, [comments]);

  const addOrderLog = useCallback((log: Omit<OrderLog, 'id' | 'timestamp'>) => {
    const entry: OrderLog = { ...log, id: `LOG-${Date.now().toString(36)}`, timestamp: Date.now() };
    setOrderLogs(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('coffeehouse_orderlogs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getOrderLogs = useCallback((orderId: string) => {
    return orderLogs.filter(l => l.orderId === orderId).sort((a, b) => a.timestamp - b.timestamp);
  }, [orderLogs]);

  return (
    <SocialContext.Provider value={{
      wishlist, comments, orderLogs,
      toggleWishlist, isWishlisted, addComment, getProductComments, getProductRating,
      addOrderLog, getOrderLogs,
    }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within SocialProvider');
  return ctx;
}

function getDefaultComments(): Comment[] {
  const now = Date.now();
  const h = (hours: number) => now - hours * 3600000;
  return [
    { id: 'CMT-1', productId: 'sb1', walletAddress: '0x3637...34bD', text: 'Best latte I have ever had! Smooth and creamy.', rating: 5, timestamp: h(2) },
    { id: 'CMT-2', productId: 'sb1', walletAddress: '0xAb58...9c9B', text: 'Great coffee, will order again!', rating: 4, timestamp: h(5) },
    { id: 'CMT-3', productId: 'sb3', walletAddress: '0x3637...34bD', text: 'Caramel macchiato is perfect. Sweet but not too sweet.', rating: 5, timestamp: h(1) },
    { id: 'CMT-4', productId: 'mc1', walletAddress: '0x742d...bD18', text: 'Classic Big Mac, never disappoints!', rating: 5, timestamp: h(3) },
    { id: 'CMT-5', productId: 'vn1', walletAddress: '0x3637...34bD', text: 'Authentic Vietnamese pho, reminds me of home.', rating: 5, timestamp: h(12) },
    { id: 'CMT-6', productId: 'vn4', walletAddress: '0x1f98...F984', text: 'Bun Bo Hue is spicy and delicious! Real Vietnamese flavor.', rating: 5, timestamp: h(8) },
    { id: 'CMT-7', productId: 'ph1', walletAddress: '0x8Ba1...BA72', text: 'Pepperoni pizza was great. Crispy crust!', rating: 4, timestamp: h(6) },
    { id: 'CMT-8', productId: 'dk5', walletAddress: '0x6B17...d0F', text: 'Glazed donut is so fluffy and sweet. Love it!', rating: 5, timestamp: h(4) },
  ];
}

function getDefaultLogs(): OrderLog[] {
  const now = Date.now();
  const h = (hours: number) => now - hours * 3600000;
  const m = (mins: number) => now - mins * 60000;
  return [
    { id: 'LOG-1', orderId: 'ORD-M1K2P', event: 'created', details: 'Order created with 2 items, total $11.91 RITUAL', walletAddress: '0x3637...34bD', amount: 11.91, timestamp: h(2) },
    { id: 'LOG-2', orderId: 'ORD-M1K2P', event: 'payment_sent', details: 'QR payment initiated, waiting for RITUAL transfer', walletAddress: '0x3637...34bD', amount: 11.91, timestamp: h(2) },
    { id: 'LOG-3', orderId: 'ORD-M1K2P', event: 'payment_confirmed', details: 'RITUAL payment detected on blockchain, amount matches', txHash: '0xabc123...', amount: 11.91, timestamp: h(2) },
    { id: 'LOG-4', orderId: 'ORD-M1K2P', event: 'preparing', details: 'Order is being prepared by kitchen', timestamp: h(2) },
    { id: 'LOG-5', orderId: 'ORD-M1K2P', event: 'shipping', details: 'Order dispatched for delivery', timestamp: h(1) },
    { id: 'LOG-6', orderId: 'ORD-M1K2P', event: 'delivered', details: 'Order delivered successfully to customer', timestamp: m(45) },
    { id: 'LOG-7', orderId: 'ORD-N2L3Q', event: 'created', details: 'Order created with 1 item, total $7.50 RITUAL', walletAddress: '0xAb58...9c9B', amount: 7.50, timestamp: h(5) },
    { id: 'LOG-8', orderId: 'ORD-N2L3Q', event: 'payment_sent', details: 'QR payment initiated', walletAddress: '0xAb58...9c9B', amount: 7.50, timestamp: h(5) },
    { id: 'LOG-9', orderId: 'ORD-N2L3Q', event: 'payment_failed', details: 'Payment timeout - no RITUAL received within 10 minutes', amount: 7.50, timestamp: h(4) },
    { id: 'LOG-10', orderId: 'ORD-N2L3Q', event: 'cancelled', details: 'Order cancelled due to payment failure', timestamp: h(4) },
  ];
}

