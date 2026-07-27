import { useState, useEffect, useCallback } from 'react';
import { useShop } from '../../hooks/useShop';
import type { Order } from '../../hooks/useShop';
import { ChefHat, Clock, Check, Printer, MapPin, Coffee, Package, Bell } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────
function elapsed(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

function elapsedClass(ts: number): string {
  const m = (Date.now() - ts) / 60_000;
  if (m < 10) return '';
  if (m < 20) return 'text-amber-600';
  return 'text-red-600 font-bold';
}

// Status priority for sorting: new → preparing → ready
function statusPriority(s: Order['status']): number {
  if (s === 'confirmed' || s === 'pending') return 0;
  if (s === 'preparing') return 1;
  if (s === 'shipping') return 2;
  if (s === 'delivered') return 3;
  return 4;
}

// ─── Kitchen Card ───────────────────────────────────────
function KitchenCard({ order, onStatus }: { order: Order; onStatus: (id: string, s: Order['status']) => void }) {
  const isNew = order.status === 'confirmed' || order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'shipping';

  const borderColor = isNew ? 'border-l-amber-400' : isPreparing ? 'border-l-blue-500' : isReady ? 'border-l-emerald-500' : 'border-l-slate-300';
  const badgeColor = isNew ? 'bg-amber-100 text-amber-800 border-amber-300' : isPreparing ? 'bg-blue-100 text-blue-800 border-blue-300' : isReady ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600';
  const badgeLabel = isNew ? '🆕 NEW' : isPreparing ? '👨‍🍳 PREPARING' : isReady ? '✅ READY' : order.status.toUpperCase();

  const [, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 10_000); return () => clearInterval(i); }, []);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border-l-4 ${borderColor} p-5 break-inside-avoid print:shadow-none print:border print:rounded-lg print:p-3`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-wider print:text-xl">{order.code}</span>
          <p className={`text-xs mt-0.5 ${elapsedClass(order.timestamp)}`}>
            <Clock className="w-3 h-3 inline mr-1" />{elapsed(order.timestamp)} · {new Date(order.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${badgeColor}`}>{badgeLabel}</span>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-2 bg-slate-50 rounded-xl print:bg-white print:border print:border-slate-200 print:rounded print:p-1.5">
            <img src={item.product.image} alt="" className="w-12 h-12 rounded-lg object-cover print:hidden" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-900 print:text-sm">{item.product.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {item.selectedSize && (
                  <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{item.selectedSize}</span>
                )}
                {item.selectedTemp && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.selectedTemp === 'Hot' ? 'bg-red-100 text-red-700' : 'bg-cyan-100 text-cyan-700'}`}>
                    {item.selectedTemp === 'Hot' ? '🔥' : '🧊'} {item.selectedTemp}
                  </span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">×{item.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery */}
      {order.delivery && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl print:bg-white print:border-slate-300">
          <MapPin className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">{order.delivery.address}</p>
            {order.delivery.note && <p className="text-xs text-amber-700 mt-0.5">📝 {order.delivery.note}</p>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 print:hidden">
        {isNew && (
          <button onClick={() => onStatus(order.id, 'preparing')}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all">
            <ChefHat className="w-4 h-4" /> Start Preparing
          </button>
        )}
        {isPreparing && (
          <button onClick={() => onStatus(order.id, 'shipping')}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all">
            <Check className="w-4 h-4" /> Ready for Pickup
          </button>
        )}
        {isReady && (
          <button onClick={() => onStatus(order.id, 'delivered')}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-slate-700 rounded-xl hover:bg-slate-800 active:scale-95 transition-all">
            <Package className="w-4 h-4" /> Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Kitchen View ──────────────────────────────────
export default function KitchenView() {
  const { orders, updateOrderStatus } = useShop();
  const [, setTick] = useState(0);
  const [filter, setFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');

  // Auto-refresh every 10s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Auto-remove delivered orders after 30min
  useEffect(() => {
    const now = Date.now();
    orders.forEach(o => {
      if (o.status === 'delivered' && o.deliveredAt && now - o.deliveredAt > 30 * 60_000) {
        // They stay in localStorage but we hide from kitchen
      }
    });
  }, [orders]);

  const handleStatus = useCallback((id: string, status: Order['status']) => {
    updateOrderStatus(id, status);
  }, [updateOrderStatus]);

  // Filter & sort active kitchen orders
  const kitchenOrders = orders
    .filter(o => {
      if (o.status === 'cancelled' || o.status === 'refunded') return false;
      // Auto-remove delivered after 30 min from kitchen view
      if (o.status === 'delivered' && o.deliveredAt && Date.now() - o.deliveredAt > 30 * 60_000) return false;
      if (filter === 'new') return o.status === 'confirmed' || o.status === 'pending';
      if (filter === 'preparing') return o.status === 'preparing';
      if (filter === 'ready') return o.status === 'shipping';
      return true;
    })
    .sort((a, b) => statusPriority(a.status) - statusPriority(b.status) || a.timestamp - b.timestamp);

  const countNew = orders.filter(o => (o.status === 'confirmed' || o.status === 'pending')).length;
  const countPreparing = orders.filter(o => o.status === 'preparing').length;
  const countReady = orders.filter(o => o.status === 'shipping').length;

  return (
    <div className="bg-slate-100 min-h-screen print:bg-white">
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-slate-900 text-white print:bg-white print:text-slate-900 print:border-b print:border-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center print:bg-amber-400">
              <Coffee className="w-5 h-5 text-white print:text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Kitchen Display</h1>
              <p className="text-xs text-slate-400 print:text-slate-500">
                {kitchenOrders.length} active · Auto-refresh 10s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Status filter bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex gap-2 overflow-x-auto">
          {([
            { id: 'all', label: 'All', count: kitchenOrders.length, icon: Coffee },
            { id: 'new', label: 'New', count: countNew, icon: Bell },
            { id: 'preparing', label: 'Preparing', count: countPreparing, icon: ChefHat },
            { id: 'ready', label: 'Ready', count: countReady, icon: Check },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                filter === f.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              <f.icon className="w-4 h-4" />
              {f.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                filter === f.id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'
              }`}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Order Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-600 mb-1">All Clear! 🎉</h2>
            <p className="text-sm text-slate-400">No active orders right now. New orders will appear automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 print:grid-cols-2 print:gap-3">
            {kitchenOrders.map(order => (
              <KitchenCard key={order.id} order={order} onStatus={handleStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

