import { useState, useMemo, useCallback } from 'react';
import { useShop } from '../../hooks/useShop';

import { formatCurrency } from '../../utils/format';
import type { Order } from '../../hooks/useShop';
import {
  DollarSign, ShoppingCart, TrendingUp, BarChart3, Download,
  ChevronLeft, ChevronRight, FileSpreadsheet, Receipt
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────
type Period = 'daily' | 'weekly' | 'monthly';

function startOfDay(d: Date): Date { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
function endOfDay(d: Date): Date { const r = new Date(d); r.setHours(23, 59, 59, 999); return r; }

function getRange(period: Period, offset: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  if (period === 'daily') {
    const d = new Date(now); d.setDate(d.getDate() + offset);
    const start = startOfDay(d); const end = endOfDay(d);
    return { start, end, label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) };
  }
  if (period === 'weekly') {
    const d = new Date(now); d.setDate(d.getDate() + offset * 7);
    const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d); monday.setDate(diff); monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday, label: `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` };
  }
  // monthly
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = startOfDay(d);
  const end = endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return { start, end, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
}

function toCSV(rows: string[][]): string {
  return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ─── Revenue Chart (CSS bars) ──────────────────────────
function RevenueBars({ orders }: { orders: Order[] }) {
  // Group by day within the period
  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const key = new Date(o.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(key, (map.get(key) || 0) + o.total);
    });
    return Array.from(map.entries());
  }, [orders]);

  if (grouped.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">No data for chart</p>;

  const max = Math.max(...grouped.map(([, v]) => v), 1);

  return (
    <div className="space-y-2">
      {grouped.map(([label, value]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-20 truncate">{label}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-end pr-2 transition-all"
              style={{ width: `${Math.max(8, (value / max) * 100)}%` }}>
              <span className="text-[10px] font-bold text-white">${value.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-600',
  };
  return (
    <div className={`card p-4 border ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function RevenueReport() {
  const { orders } = useShop();

  const [period, setPeriod] = useState<Period>('daily');
  const [offset, setOffset] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  const range = getRange(period, offset);

  // Filter orders
  const filteredOrders = useMemo(() => {
    const start = useCustomRange && dateFrom ? new Date(dateFrom + 'T00:00:00') : range.start;
    const end = useCustomRange && dateTo ? new Date(dateTo + 'T23:59:59') : range.end;
    return orders.filter(o => {
      if (o.status === 'cancelled' || o.status === 'refunded') return false;
      return o.timestamp >= start.getTime() && o.timestamp <= end.getTime();
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, range, useCustomRange, dateFrom, dateTo]);

  // Stats
  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalShipping = filteredOrders.reduce((s, o) => s + o.shippingFee, 0);
  const orderCount = filteredOrders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const key = item.product.id;
        const existing = map.get(key) || { name: item.product.name, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += (item.unitPrice || item.product.price) * item.quantity;
        map.set(key, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredOrders]);

  // Revenue by brand
  const brandRevenue = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const brand = item.product.brand || 'Other';
        map.set(brand, (map.get(brand) || 0) + (item.unitPrice || item.product.price) * item.quantity);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredOrders]);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    const header = ['Order ID', 'Code', 'Date', 'Time', 'Status', 'Items', 'Subtotal', 'Shipping', 'Total (RITUAL)', 'Customer', 'Delivery Address', 'Tx Hash'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.code,
      new Date(o.timestamp).toLocaleDateString(),
      new Date(o.timestamp).toLocaleTimeString(),
      o.status,
      o.items.map(i => `${i.product.name}${i.selectedSize ? ` (${i.selectedSize})` : ''}${i.selectedTemp ? ` ${i.selectedTemp}` : ''} x${i.quantity}`).join('; '),
      (o.total - o.shippingFee).toFixed(2),
      o.shippingFee.toFixed(2),
      o.total.toFixed(2),
      o.customerWallet,
      o.delivery?.address || '',
      o.txHash || '',
    ]);
    const csv = toCSV([header, ...rows]);
    const label = useCustomRange ? `${dateFrom}_to_${dateTo}` : range.label.replace(/[^a-zA-Z0-9]/g, '_');
    downloadCSV(`revenue_${label}.csv`, csv);
  }, [filteredOrders, range, useCustomRange, dateFrom, dateTo]);

  const handleExportTopProductsCSV = useCallback(() => {
    const header = ['Product', 'Quantity Sold', 'Revenue (RITUAL)'];
    const rows = topProducts.map(p => [p.name, p.qty.toString(), p.revenue.toFixed(2)]);
    downloadCSV('top_products.csv', toCSV([header, ...rows]));
  }, [topProducts]);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" /> Revenue Report
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">{range.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Period selector & navigation */}
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => { setPeriod(p); setOffset(0); setUseCustomRange(false); }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                  period === p && !useCustomRange ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}>{p}</button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setOffset(o => o - 1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[200px] text-center">{range.label}</span>
            <button onClick={() => setOffset(o => Math.min(o + 1, 0))} disabled={offset >= 0}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
            {offset !== 0 && (
              <button onClick={() => setOffset(0)} className="text-xs text-blue-600 hover:underline ml-1">Today</button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-slate-400">or custom:</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setUseCustomRange(true); }}
              className="!py-1.5 !px-2 !text-xs border border-slate-200 rounded-lg" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setUseCustomRange(true); }}
              className="!py-1.5 !px-2 !text-xs border border-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} color="blue" />
          <StatCard label="Orders" value={orderCount.toString()} icon={ShoppingCart} color="purple" />
          <StatCard label="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} icon={TrendingUp} color="green" />
          <StatCard label="Shipping Revenue" value={formatCurrency(totalShipping)} icon={Receipt} color="orange" />
          <StatCard label="Items Sold" value={filteredOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0).toString()} icon={BarChart3} color="cyan" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Revenue by Day
            </h3>
            <RevenueBars orders={filteredOrders} />
          </div>

          {/* Revenue by Brand */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue by Brand</h3>
            {brandRevenue.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {brandRevenue.map(([brand, rev]) => {
                  const max = brandRevenue[0]?.[1] || 1;
                  return (
                    <div key={brand} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-24 truncate">{brand}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(10, (rev / max) * 100)}%` }}>
                          <span className="text-[9px] font-bold text-white">${rev.toFixed(0)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-16 text-right">${rev.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Top Products</h3>
            {topProducts.length > 0 && (
              <button onClick={handleExportTopProductsCSV}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                <Download className="w-3 h-3" /> Export
              </button>
            )}
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No products sold in this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Product</th>
                    <th className="text-right p-3">Qty Sold</th>
                    <th className="text-right p-3">Revenue</th>
                    <th className="text-right p-3">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={p.name} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="p-3 font-medium text-slate-900">{p.name}</td>
                      <td className="p-3 text-right text-slate-600">{p.qty}</td>
                      <td className="p-3 text-right font-bold text-slate-900">${p.revenue.toFixed(2)}</td>
                      <td className="p-3 text-right text-slate-500">{totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Orders Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">All Orders ({filteredOrders.length})</h3>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
              <FileSpreadsheet className="w-3 h-3" /> Export All
            </button>
          </div>
          {filteredOrders.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No orders in this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Code</th>
                    <th className="text-left p-3">Items</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Subtotal</th>
                    <th className="text-right p-3">Shipping</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => {
                    const statusColor: Record<string, string> = {
                      confirmed: 'bg-emerald-100 text-emerald-700',
                      pending: 'bg-amber-100 text-amber-700',
                      preparing: 'bg-blue-100 text-blue-700',
                      shipping: 'bg-purple-100 text-purple-700',
                      delivered: 'bg-slate-100 text-slate-600',
                    };
                    return (
                      <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-xs text-slate-500">
                          {new Date(o.timestamp).toLocaleDateString()}<br />
                          <span className="text-slate-400">{new Date(o.timestamp).toLocaleTimeString()}</span>
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-700">{o.code}</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            {o.items.map((item, i) => (
                              <span key={i} className="text-xs text-slate-600">
                                {item.product.name} ×{item.quantity}
                                {item.selectedSize ? ` (${item.selectedSize})` : ''}
                                {item.selectedTemp ? ` ${item.selectedTemp}` : ''}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[o.status] || 'bg-slate-100 text-slate-500'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-600">${(o.total - o.shippingFee).toFixed(2)}</td>
                        <td className="p-3 text-right text-slate-500">${o.shippingFee.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">${o.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <td colSpan={4} className="p-3 text-right text-slate-700">Totals</td>
                    <td className="p-3 text-right text-slate-700">${(totalRevenue - totalShipping).toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-700">${totalShipping.toFixed(2)}</td>
                    <td className="p-3 text-right text-lg text-slate-900">${totalRevenue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

