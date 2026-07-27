import { useState, useRef, useEffect, useMemo } from 'react';
import { useShop } from '../../hooks/useShop';
import { useAdmin } from '../../hooks/useAdmin';
import {
  Send, Loader2, TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, Package, AlertTriangle, CheckCircle, Clock, Truck,
  Brain, Sparkles, Users, FileText, Percent
} from 'lucide-react';
import { requestMimoChat } from '../../lib/mimo';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: number; }

export function AdminAgentPanel() {
  const { products, orders } = useShop();
  const { finances, totalIncome, totalExpense, profit } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'finance' | 'shipping' | 'chat'>('overview');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ═══════ FULL BUSINESS ANALYSIS ═══════
  const analysis = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');

    // ── Order Stats ──
    const byStatus: Record<string, number> = { pending: 0, confirmed: 0, preparing: 0, shipping: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

    // ── Revenue ──
    const itemsRevenue = validOrders.reduce((s, o) => s + o.items.reduce((s2, i) => s2 + i.product.price * i.quantity, 0), 0);
    const shippingRevenue = validOrders.reduce((s, o) => s + o.shippingFee, 0);
    const totalRevenue = itemsRevenue + shippingRevenue;
    const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // ── Shipping Analysis ──
    const ordersWithDelivery = validOrders.filter(o => o.delivery);
    const deliveryRate = validOrders.length > 0 ? (ordersWithDelivery.length / validOrders.length * 100) : 0;
    const avgShippingFee = ordersWithDelivery.length > 0 ? shippingRevenue / ordersWithDelivery.length : 0;
    const shippingCostEstimate = shippingRevenue * 0.6; // estimated 60% of shipping fee is cost
    const shippingProfit = shippingRevenue - shippingCostEstimate;

    // ── Product Analysis ──
    const productSales: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
    const categorySales: Record<string, { qty: number; revenue: number }> = {};
    validOrders.forEach(o => {
      o.items.forEach(item => {
        const pid = item.product.id;
        if (!productSales[pid]) productSales[pid] = { name: item.product.name, category: item.product.category, qty: 0, revenue: 0 };
        productSales[pid].qty += item.quantity;
        productSales[pid].revenue += item.product.price * item.quantity;
        const cat = item.product.category || 'Other';
        if (!categorySales[cat]) categorySales[cat] = { qty: 0, revenue: 0 };
        categorySales[cat].qty += item.quantity;
        categorySales[cat].revenue += item.product.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const bottomProducts = Object.values(productSales).sort((a, b) => a.revenue - b.revenue).slice(0, 5);
    const topCategories = Object.entries(categorySales).sort((a, b) => b[1].revenue - a[1].revenue);

    // ── Customer Analysis ──
    const walletOrders: Record<string, number> = {};
    validOrders.forEach(o => {
      const w = o.customerWallet || 'anonymous';
      walletOrders[w] = (walletOrders[w] || 0) + 1;
    });
    const uniqueCustomers = Object.keys(walletOrders).length;
    const repeatCustomers = Object.values(walletOrders).filter(c => c > 1).length;

    // ── Time Analysis ──
    const now = Date.now();
    const todayOrders = validOrders.filter(o => now - o.timestamp < 86400000);
    const weekOrders = validOrders.filter(o => now - o.timestamp < 604800000);
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);

    // ── Finance ──
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    finances.forEach(f => {
      if (f.type === 'income') incomeByCategory[f.category] = (incomeByCategory[f.category] || 0) + f.amount;
      else expenseByCategory[f.category] = (expenseByCategory[f.category] || 0) + f.amount;
    });

    // ── Profit Calculation ──
    const grossProfit = totalIncome - totalExpense;
    const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome * 100) : 0;
    const estimatedCOGS = itemsRevenue * 0.35; // estimated 35% cost of goods
    const grossProfitItems = itemsRevenue - estimatedCOGS;
    const netProfit = grossProfitItems + shippingProfit - (totalExpense - estimatedCOGS);
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

    // ── Alerts ──
    const alerts: { type: 'warning' | 'danger' | 'success' | 'info'; message: string }[] = [];
    if (byStatus.pending > 0) alerts.push({ type: 'warning', message: `${byStatus.pending} orders pending review` });
    if (cancelledOrders.length > 0) alerts.push({ type: 'danger', message: `${cancelledOrders.length} cancelled orders — investigate reasons` });
    if (byStatus.shipping > 0) alerts.push({ type: 'info', message: `${byStatus.shipping} orders currently shipping` });
    if (todayOrders.length > 0) alerts.push({ type: 'success', message: `${todayOrders.length} orders today ($${todayRevenue.toFixed(2)})` });
    if (grossMargin < 20) alerts.push({ type: 'warning', message: `Low profit margin: ${grossMargin.toFixed(1)}% — review expenses` });
    if (repeatCustomers > 0) alerts.push({ type: 'success', message: `${repeatCustomers} repeat customers — good retention` });

    return {
      // Orders
      totalOrders: orders.length, validOrders: validOrders.length, byStatus, cancelledOrders,
      // Revenue
      itemsRevenue, shippingRevenue, totalRevenue, avgOrderValue,
      todayOrders: todayOrders.length, todayRevenue, weekOrders: weekOrders.length, weekRevenue,
      // Shipping
      ordersWithDelivery: ordersWithDelivery.length, deliveryRate, avgShippingFee, shippingCostEstimate, shippingProfit,
      // Products
      topProducts, bottomProducts, topCategories,
      // Customers
      uniqueCustomers, repeatCustomers,
      // Finance
      totalIncome, totalExpense, profit, incomeByCategory, expenseByCategory,
      grossProfit, grossMargin, estimatedCOGS, grossProfitItems, netProfit, netMargin,
      // Alerts
      alerts,
    };
  }, [orders, finances, totalIncome, totalExpense, profit]);

  // ═══════ AI CONTEXT ═══════
  const buildContext = () => {
    const a = analysis;
    return `You are a senior business analyst and accountant for The Daily Cup cafe. You have FULL access to all business data.

=== ORDER SUMMARY ===
Total orders: ${a.totalOrders} (${a.validOrders} valid, ${a.cancelledOrders.length} cancelled)
Today: ${a.todayOrders} orders, $${a.todayRevenue.toFixed(2)} revenue
This week: ${a.weekOrders} orders, $${a.weekRevenue.toFixed(2)} revenue
Avg order value: $${a.avgOrderValue.toFixed(2)}

Status pipeline: Pending(${a.byStatus.pending}) → Confirmed(${a.byStatus.confirmed}) → Preparing(${a.byStatus.preparing}) → Shipping(${a.byStatus.shipping}) → Delivered(${a.byStatus.delivered})

=== REVENUE BREAKDOWN ===
Items revenue: $${a.itemsRevenue.toFixed(2)}
Shipping revenue: $${a.shippingRevenue.toFixed(2)}
Total revenue: $${a.totalRevenue.toFixed(2)}

=== SHIPPING & DELIVERY ===
Orders with delivery: ${a.ordersWithDelivery} (${a.deliveryRate.toFixed(1)}% of orders)
Avg shipping fee: $${a.avgShippingFee.toFixed(2)}
Shipping cost (est): $${a.shippingCostEstimate.toFixed(2)}
Shipping profit: $${a.shippingProfit.toFixed(2)}

=== TOP PRODUCTS ===
${a.topProducts.map((p, i) => `${i+1}. ${p.name} (${p.category}): ${p.qty} sold, $${p.revenue.toFixed(2)}`).join('\n')}

=== CATEGORY PERFORMANCE ===
${a.topCategories.map(([cat, d]) => `${cat}: ${d.qty} items, $${d.revenue.toFixed(2)}`).join('\n')}

=== CUSTOMERS ===
Unique customers: ${a.uniqueCustomers}
Repeat customers: ${a.repeatCustomers}
Retention rate: ${a.uniqueCustomers > 0 ? (a.repeatCustomers / a.uniqueCustomers * 100).toFixed(1) : 0}%

=== FINANCIAL REPORT ===
Total income (recorded): $${a.totalIncome.toFixed(2)}
Total expenses (recorded): $${a.totalExpense.toFixed(2)}
Recorded profit: $${a.profit.toFixed(2)}

Income by category: ${Object.entries(a.incomeByCategory).map(([c,v]) => `${c}: $${v.toFixed(2)}`).join(', ')}
Expense by category: ${Object.entries(a.expenseByCategory).map(([c,v]) => `${c}: $${v.toFixed(2)}`).join(', ')}

Estimated COGS (35% of items): $${a.estimatedCOGS.toFixed(2)}
Gross profit (items): $${a.grossProfitItems.toFixed(2)}
Net profit (after shipping costs): $${a.netProfit.toFixed(2)}
Net margin: ${a.netMargin.toFixed(1)}%

=== PRODUCTS CATALOG ===
${products.length} products across ${new Set(products.map(p=>p.category)).size} categories

Respond as a professional business analyst and accountant. Be thorough, use bullet points, tables, and $ amounts. Give actionable recommendations. If asked about specific orders, reference the data above.`;
  };

  const sendMessage = async (msg?: string) => {
    const text = msg || input.trim();
    if (!text || loading) return;
    if (!msg) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    setLoading(true);
    try {
      const content = await requestMimoChat([
        { role: 'system', content: buildContext() },
        ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text }
      ], { temperature: 0.3, maxTokens: 800 });
      setMessages(prev => [...prev, { role: 'assistant', content, timestamp: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.', timestamp: Date.now() }]);
    }
    setLoading(false);
  };

  const quickQuestions = [
    'Generate a full daily business report',
    'Analyze all orders and flag issues',
    'Calculate my profit & loss statement',
    'Which products should I restock or remove?',
    'Analyze shipping performance and costs',
    'What are my biggest expenses? How to reduce?',
    'Customer retention analysis',
    'Give me 5 actionable recommendations to increase profit',
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Sparkles },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingCart },
    { id: 'finance' as const, label: 'Finance', icon: DollarSign },
    { id: 'shipping' as const, label: 'Shipping', icon: Truck },
    { id: 'chat' as const, label: 'AI Chat', icon: Brain },
  ];

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ═══════ OVERVIEW ═══════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Alerts */}
            {analysis.alerts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.alerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex items-start gap-2 ${
                    alert.type === 'danger' ? 'bg-red-50 border-red-200' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                    alert.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    {alert.type === 'danger' && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />}
                    {alert.type === 'warning' && <Clock className="w-4 h-4 text-amber-600 mt-0.5" />}
                    {alert.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />}
                    {alert.type === 'info' && <Truck className="w-4 h-4 text-blue-600 mt-0.5" />}
                    <span className="text-xs font-medium text-slate-800">{alert.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={DollarSign} label="Total Revenue" value={`$${analysis.totalRevenue.toFixed(2)}`} sub={`$${analysis.itemsRevenue.toFixed(2)} items + $${analysis.shippingRevenue.toFixed(2)} shipping`} color="emerald" />
              <MetricCard icon={ShoppingCart} label="Total Orders" value={analysis.totalOrders.toString()} sub={`${analysis.todayOrders} today · ${analysis.weekOrders} this week`} color="blue" />
              <MetricCard icon={TrendingUp} label="Net Profit" value={`$${analysis.netProfit.toFixed(2)}`} sub={`${analysis.netMargin.toFixed(1)}% margin`} color={analysis.netProfit >= 0 ? 'emerald' : 'red'} />
              <MetricCard icon={Users} label="Customers" value={analysis.uniqueCustomers.toString()} sub={`${analysis.repeatCustomers} repeat · ${analysis.uniqueCustomers > 0 ? (analysis.repeatCustomers / analysis.uniqueCustomers * 100).toFixed(0) : 0}% retention`} color="violet" />
            </div>

            {/* P&L Summary */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Profit & Loss Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Items Revenue</span><span className="font-bold">${analysis.itemsRevenue.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Shipping Revenue</span><span className="font-bold">${analysis.shippingRevenue.toFixed(2)}</span></div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-medium"><span>Total Revenue</span><span>${analysis.totalRevenue.toFixed(2)}</span></div>
                <div className="flex justify-between text-red-600"><span>− Estimated COGS (35%)</span><span>−$${analysis.estimatedCOGS.toFixed(2)}</span></div>
                <div className="flex justify-between text-red-600"><span>− Shipping Costs (est)</span><span>−$${analysis.shippingCostEstimate.toFixed(2)}</span></div>
                <div className="flex justify-between text-red-600"><span>− Recorded Expenses</span><span>−$${analysis.totalExpense.toFixed(2)}</span></div>
                <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-lg"><span className="font-extrabold">Net Profit</span><span className={`font-extrabold ${analysis.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${analysis.netProfit.toFixed(2)}</span></div>
              </div>
              <button onClick={() => sendMessage('Give me a detailed profit & loss analysis with recommendations to improve profitability')}
                className="mt-4 w-full p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Get AI Profit Analysis
              </button>
            </div>

            {/* Top Products + Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Top Products</h3>
                <div className="space-y-2">
                  {analysis.topProducts.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.category}</p>
                      </div>
                      <span className="text-xs text-slate-500">{p.qty}×</span>
                      <span className="text-sm font-bold">${p.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                  {analysis.topProducts.length === 0 && <p className="text-sm text-slate-400">No sales yet</p>}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue by Category</h3>
                <div className="space-y-3">
                  {analysis.topCategories.slice(0, 6).map(([cat, d]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">{cat}</span>
                        <span className="text-xs font-bold">${d.revenue.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(d.revenue / analysis.totalRevenue * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  {analysis.topCategories.length === 0 && <p className="text-sm text-slate-400">No data</p>}
                </div>
              </div>
            </div>

            {/* Quick Questions */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" /> Ask the AI Agent
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickQuestions.map((q, i) => (
                  <button key={i} onClick={() => { setInput(q); setActiveTab('chat'); setTimeout(() => sendMessage(q), 200); }}
                    className="text-left p-3 bg-slate-50 hover:bg-indigo-50 rounded-lg text-xs text-slate-700 hover:text-indigo-700 transition-colors border border-slate-200 hover:border-indigo-200">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ORDERS ═══════ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Order Pipeline</h2>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { key: 'pending', label: 'Pending', icon: Clock, color: 'amber' },
                { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'emerald' },
                { key: 'preparing', label: 'Preparing', icon: Package, color: 'blue' },
                { key: 'shipping', label: 'Shipping', icon: Truck, color: 'purple' },
                { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'emerald' },
                { key: 'cancelled', label: 'Cancelled', icon: AlertTriangle, color: 'red' },
              ].map(s => (
                <div key={s.key} className="card p-4 text-center">
                  <s.icon className={`w-5 h-5 text-${s.color}-500 mx-auto mb-1`} />
                  <p className="text-xl font-extrabold text-slate-900">{analysis.byStatus[s.key]}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Detailed order list */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">All Orders ({orders.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        order.status === 'pending' ? 'bg-amber-500' : order.status === 'confirmed' ? 'bg-emerald-500' :
                        order.status === 'preparing' ? 'bg-blue-500' : order.status === 'shipping' ? 'bg-purple-500' :
                        order.status === 'delivered' ? 'bg-emerald-600' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-xs font-mono text-slate-600">{order.code}</p>
                        <p className="text-[10px] text-slate-400">{new Date(order.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${order.total.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">{order.items.length} items · ship ${order.shippingFee.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No orders</p>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ FINANCE ═══════ */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Financial Report</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={TrendingUp} label="Income" value={`$${analysis.totalIncome.toFixed(2)}`} color="emerald" />
              <MetricCard icon={TrendingDown} label="Expenses" value={`$${analysis.totalExpense.toFixed(2)}`} color="red" />
              <MetricCard icon={DollarSign} label="Net Profit" value={`$${analysis.netProfit.toFixed(2)}`} color={analysis.netProfit >= 0 ? 'emerald' : 'red'} />
              <MetricCard icon={Percent} label="Margin" value={`${analysis.netMargin.toFixed(1)}%`} color="violet" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-sm font-bold text-emerald-700 mb-4">Income Breakdown</h3>
                {Object.entries(analysis.incomeByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-700">{cat}</span>
                    <span className="text-sm font-bold text-emerald-600">+${amt.toFixed(2)}</span>
                  </div>
                ))}
                {Object.keys(analysis.incomeByCategory).length === 0 && <p className="text-sm text-slate-400">No income recorded</p>}
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-bold text-red-700 mb-4">Expense Breakdown</h3>
                {Object.entries(analysis.expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-700">{cat}</span>
                    <span className="text-sm font-bold text-red-600">−${amt.toFixed(2)}</span>
                  </div>
                ))}
                {Object.keys(analysis.expenseByCategory).length === 0 && <p className="text-sm text-slate-400">No expenses recorded</p>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ SHIPPING ═══════ */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Shipping & Delivery Analysis</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={Truck} label="Delivery Orders" value={analysis.ordersWithDelivery.toString()} sub={`${analysis.deliveryRate.toFixed(1)}% of orders`} color="purple" />
              <MetricCard icon={DollarSign} label="Shipping Revenue" value={`$${analysis.shippingRevenue.toFixed(2)}`} sub={`Avg $${analysis.avgShippingFee.toFixed(2)}/order`} color="emerald" />
              <MetricCard icon={TrendingDown} label="Shipping Cost (est)" value={`$${analysis.shippingCostEstimate.toFixed(2)}`} color="red" />
              <MetricCard icon={TrendingUp} label="Shipping Profit" value={`$${analysis.shippingProfit.toFixed(2)}`} color={analysis.shippingProfit >= 0 ? 'emerald' : 'red'} />
            </div>
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Shipping Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-600">Delivery Adoption Rate</span>
                    <span className="text-xs font-bold">{analysis.deliveryRate.toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${analysis.deliveryRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-600">Shipping Profit Margin</span>
                    <span className="text-xs font-bold">{analysis.shippingRevenue > 0 ? ((analysis.shippingProfit / analysis.shippingRevenue) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analysis.shippingRevenue > 0 ? (analysis.shippingProfit / analysis.shippingRevenue * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
              <button onClick={() => sendMessage('Analyze my shipping performance. How can I reduce costs and improve delivery?')}
                className="mt-4 w-full p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Get AI Shipping Analysis
              </button>
            </div>
          </div>
        )}

        {/* ═══════ AI CHAT ═══════ */}
        {activeTab === 'chat' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 260px)' }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">AI Business Agent</h3>
                    <p className="text-sm text-slate-500 mb-6">Your personal accountant & business analyst. I have full access to orders, revenue, expenses, shipping data.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                      {quickQuestions.slice(0, 4).map((q, i) => (
                        <button key={i} onClick={() => sendMessage(q)} className="text-left p-3 bg-slate-50 hover:bg-indigo-50 rounded-lg text-xs text-slate-600 hover:text-indigo-600 transition-colors">{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Brain className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}>{msg.content}</div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><Brain className="w-4 h-4 text-indigo-600" /></div>
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3"><Loader2 className="w-4 h-4 text-slate-400 animate-spin" /></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-slate-200 p-3">
                <div className="flex gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                    placeholder="Ask about orders, revenue, profit, shipping, products..."
                    className="flex-1 text-sm" disabled={loading} />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 rounded-xl flex items-center justify-center transition-colors">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card p-4">
      <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 text-${color}-600`} />
      </div>
      <p className="text-xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

