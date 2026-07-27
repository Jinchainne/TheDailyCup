import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../hooks/useAdmin';
import { useShop, getShippingConfig, saveShippingConfig, type ShippingConfig } from '../../hooks/useShop';
import { usePOSConfig } from '../../hooks/usePOSConfig';
import MarketTrends from './MarketTrends';
import { formatCurrency } from '../../utils/format';
import {
  LayoutDashboard, ShoppingCart, Receipt, Calculator, LogOut, Plus, Trash2,
  TrendingUp, TrendingDown, DollarSign, Package, ChefHat, Truck, Clock, Check, X, ExternalLink, MapPin,
  Download, Upload, HardDrive, Brain, Settings, Loader2
} from 'lucide-react';

import { AdminAgentPanel } from './AgentDashboard';
import CustomerInsights from './CustomerInsights';

type Tab = 'dashboard' | 'orders' | 'finance' | 'tax' | 'products' | 'ai-agent' | 'customer-insights' | 'market-trends' | 'shipping' | 'pos-config' | 'backup';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, logout, totalExpense, profit } = useAdmin();
  const { orders, products, addProduct, updateProduct, deleteProduct } = useShop();
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!isAdmin) {
    navigate('/admin');
    return null;
  }

  // Stats
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'shipping' || o.status === 'delivered');
  const totalRevenue = confirmedOrders.reduce((s, o) => s + o.total, 0);
  const totalShippingRevenue = confirmedOrders.reduce((s, o) => s + o.shippingFee, 0);
  const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;

  // Tax calculations
  const VAT_RATE = 0.10; // 10% VAT
  const CORPORATE_TAX_RATE = 0.20; // 20% Corporate Income Tax
  const vatAmount = totalRevenue * VAT_RATE;
  const taxableIncome = profit > 0 ? profit : 0;
  const corporateTax = taxableIncome * CORPORATE_TAX_RATE;
  const netProfit = taxableIncome - corporateTax;

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as Tab, label: 'Orders', icon: ShoppingCart },
    { id: 'finance' as Tab, label: 'Finance', icon: Receipt },
    { id: 'tax' as Tab, label: 'Tax', icon: Calculator },
    { id: 'products' as Tab, label: 'Products', icon: Package },
    { id: 'ai-agent' as Tab, label: 'AI Agent', icon: Brain },
    { id: 'customer-insights' as Tab, label: 'Customer Insights', icon: Brain },
    { id: 'market-trends' as Tab, label: 'Market Trends', icon: TrendingUp },
    { id: 'shipping' as Tab, label: 'Shipping', icon: Settings },
    { id: 'pos-config' as Tab, label: 'POS Terminal', icon: Settings },
    { id: 'backup' as Tab, label: 'Backup', icon: HardDrive },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Panel</h1>
              <p className="text-xs text-slate-400">Coffee House Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PublishButton products={products} />
            <button onClick={() => navigate('/shop')} className="text-xs text-slate-400 hover:text-white">View Shop →</button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ═══════ DASHBOARD ═══════ */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} color="blue" />
              <StatCard label="Total Expenses" value={formatCurrency(totalExpense)} icon={TrendingDown} color="red" />
              <StatCard label="Profit" value={formatCurrency(profit)} icon={TrendingUp} color={profit >= 0 ? 'green' : 'red'} />
              <StatCard label="Total Orders" value={totalOrders.toString()} icon={ShoppingCart} color="purple" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Confirmed" value={confirmedOrders.length.toString()} icon={Check} color="green" />
              <StatCard label="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} icon={Receipt} color="orange" />
              <StatCard label="Shipping Revenue" value={formatCurrency(totalShippingRevenue)} icon={Truck} color="cyan" />
            </div>

            {/* Revenue by category */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue by Category</h3>
              <div className="space-y-3">
                {getCategoryRevenue(orders).map(([cat, rev]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-28 truncate">{cat}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(rev / totalRevenue * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 w-20 text-right">${rev.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Orders</h3>
              <div className="space-y-2">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={order.status} />
                      <span className="font-mono text-xs text-slate-500">{order.id}</span>
                    </div>
                    <span className="text-sm font-bold">${order.total.toFixed(2)}</span>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-sm text-slate-400">No orders yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ORDERS ═══════ */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">All Orders ({orders.length})</h2>
            </div>
            {orders.length === 0 ? (
              <div className="card p-8 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={order.status} />
                        <span className="font-mono text-xs text-slate-500">{order.id}</span>
                        <span className="text-xs text-slate-400">{new Date(order.timestamp).toLocaleString()}</span>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {order.items.map(item => (
                        <div key={item.product.id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg">
                          <img src={item.product.image} alt="" className="w-8 h-8 rounded object-cover" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold truncate">{item.product.name}</p>
                            <p className="text-[10px] text-slate-400">×{item.quantity} · ${(item.product.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.delivery && (
                      <div className="flex items-start gap-2 mb-2 p-2 bg-blue-50 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-blue-900">{order.delivery.address}</p>
                          {order.delivery.note && <p className="text-[10px] text-blue-600">📝 {order.delivery.note}</p>}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Items: ${order.total - order.shippingFee}</span>
                        <span>Ship: ${order.shippingFee.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold">${order.total.toFixed(2)} RITUAL</span>
                        {order.txHash && (
                          <a href={`https://testnet.explorer.ritualfoundation.org/tx/${order.txHash}`} target="_blank" rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ FINANCE (THU CHI) ═══════ */}
        {tab === 'finance' && <FinanceTab />}

        {/* ═══════ TAX ═══════ */}
        {tab === 'tax' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Current Tax Rates</h2>

            {/* Tax Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5 border-l-4 border-blue-500">
                <p className="text-xs text-slate-500 mb-1">VAT (10%)</p>
                <p className="text-2xl font-extrabold text-slate-900">${vatAmount.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">Value-added tax on revenue</p>
              </div>
              <div className="card p-5 border-l-4 border-amber-500">
                <p className="text-xs text-slate-500 mb-1">Corporate Tax (20%)</p>
                <p className="text-2xl font-extrabold text-slate-900">${corporateTax.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">Corporate income tax</p>
              </div>
              <div className="card p-5 border-l-4 border-green-500">
                <p className="text-xs text-slate-500 mb-1">Net Profit</p>
                <p className="text-2xl font-extrabold text-green-600">${netProfit.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">After tax deduction</p>
              </div>
            </div>

            {/* Tax Breakdown */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Tax Calculation Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Revenue</span>
                  <span className="font-bold">${totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Expenses</span>
                  <span className="font-bold text-red-600">-${totalExpense.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="text-slate-900 font-medium">Profit Before Tax</span>
                  <span className="font-bold">${profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>VAT (10% × ${totalRevenue.toFixed(2)})</span>
                  <span className="font-bold">-${vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-600">
                  <span>Corporate Tax (20% × ${taxableIncome.toFixed(2)})</span>
                  <span className="font-bold">-${corporateTax.toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-lg">
                  <span className="font-extrabold">Net Profit</span>
                  <span className="font-extrabold text-green-600">${netProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Tax Reference Info */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Tax Reference Table</h3>
              <div className="space-y-2 text-sm">
                <TaxRow name="VAT" rate="10%" desc="Standard rate for goods/services" />
                <TaxRow name="Corporate Income Tax" rate="20%" desc="Corporate income tax" />
                <TaxRow name="Personal Income Tax" rate="5%-35%" desc="Progressive, 5% for income ≤ $215/month" />
                <TaxRow name="License Fee" rate="$43-$129/year" desc="Based on registered capital" />
                <TaxRow name="Social Insurance (Employer)" rate="17.5%" desc="Social insurance (employer)" />
                <TaxRow name="Social Insurance (Employee)" rate="10.5%" desc="Social insurance (employee)" />
                <TaxRow name="Health Insurance" rate="4.5%" desc="Health insurance (3% + 1.5%)" />
                <TaxRow name="Unemployment Insurance" rate="1%" desc="Unemployment insurance" />
              </div>
            </div>
          </div>
        )}

        {/* ═══════ PRODUCTS ═══════ */}
        {tab === 'products' && (
          <ProductsTab products={products} onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct} />
        )}

        {/* ═══════ AI AGENT ═══════ */}
        {tab === 'ai-agent' && <AdminAgentPanel />}

        {/* ═══════ CUSTOMER INSIGHTS ═══════ */}
        {tab === 'customer-insights' && <CustomerInsights />}

        {/* ═══════ MARKET TRENDS ═══════ */}
        {tab === 'market-trends' && <MarketTrends />}

        {/* ═══════ SHIPPING SETTINGS ═══════ */}
        {tab === 'shipping' && <ShippingSettingsTab />}

        {/* ═══════ POS TERMINAL ═══════ */}
        {tab === 'pos-config' && <POSConfigTab />}

        {/* ═══════ BACKUP ═══════ */}
        {tab === 'backup' && <BackupTab products={products} orders={orders} />}
      </div>
    </div>
  );
}

// ═══════ FINANCE TAB ═══════
function FinanceTab() {
  const { finances, addFinance, removeFinance, totalIncome, totalExpense, profit } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const filtered = filterType === 'all' ? finances : finances.filter(f => f.type === filterType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description || !amount) return;
    addFinance({ type, category, description, amount: parseFloat(amount), date, note });
    setShowForm(false);
    setCategory(''); setDescription(''); setAmount(''); setNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Income & Expense Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary !text-sm">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs text-slate-500">Total Income</p>
          <p className="text-xl font-extrabold text-green-600">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <p className="text-xs text-slate-500">Total Expense</p>
          <p className="text-xl font-extrabold text-red-600">${totalExpense.toFixed(2)}</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-xs text-slate-500">Net</p>
          <p className={`text-xl font-extrabold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${profit.toFixed(2)}</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-3 border-2 border-blue-200">
          <h3 className="text-sm font-bold text-slate-900">Add Income / Expense Entry</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${type === 'income' ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-slate-100 text-slate-500'}`}>
              Income (+)
            </button>
            <button type="button" onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${type === 'expense' ? 'bg-red-100 text-red-700 border-2 border-red-300' : 'bg-slate-100 text-slate-500'}`}>
              Expense (-)
            </button>
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full">
            <option value="">-- Select Category --</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
          <div className="flex gap-2">
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount ($)" className="flex-1" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={!category || !description || !amount} className="btn-primary flex-1">Save</button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filterType === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expense'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Description</th>
              <th className="text-right p-3">Amount</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-slate-500 text-xs">{f.date}</td>
                <td className="p-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {f.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className="p-3 text-slate-700">{f.category}</td>
                <td className="p-3 text-slate-900 font-medium">{f.description}</td>
                <td className={`p-3 text-right font-bold ${f.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {f.type === 'income' ? '+' : '-'}${f.amount.toFixed(2)}
                </td>
                <td className="p-3">
                  <button onClick={() => removeFinance(f.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">No data</p>
        )}
      </div>
    </div>
  );
}

// ═══════ PRODUCTS TAB ═══════
function ProductsTab({ products, onAdd, onUpdate, onDelete }: {
  products: any[];
  onAdd: (p: Omit<any, 'id'>) => void;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<'price' | 'image' | 'name' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [form, setForm] = useState({ name: '', price: '', category: '', image: '', description: '', brand: '' });
  const [filterCat, setFilterCat] = useState('All');
  const [uploading, setUploading] = useState(false);

  const allCategories = [...new Set(products.map(p => p.category))].sort();
  const filtered = filterCat === 'All' ? products : products.filter(p => p.category === filterCat);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return;
    onAdd({
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      image: form.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
      description: form.description || '',
      brand: form.brand || 'Custom',
    });
    setForm({ name: '', price: '', category: '', image: '', description: '', brand: '' });
    setShowForm(false);
  };

  const startEdit = (id: string, field: 'price' | 'image' | 'name', current: string) => {
    setEditingId(id);
    setEditField(field);
    setEditValue(current);
  };

  const saveEdit = () => {
    if (!editingId || !editField) return;
    if (editField === 'price') {
      const num = parseFloat(editValue);
      if (isNaN(num) || num < 0) return;
      onUpdate(editingId, { price: num });
    } else if (editField === 'name') {
      if (!editValue.trim()) return;
      onUpdate(editingId, { name: editValue.trim() });
    } else {
      onUpdate(editingId, { image: editValue });
    }
    setEditingId(null);
    setEditField(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditField(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, productId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }
    setUploading(true);

    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        // Resize to max 600px to keep localStorage small
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        if (productId) { onUpdate(productId, { image: compressed }); }
        else { setForm(f => ({ ...f, image: compressed })); }
        setUploading(false);
      };
      img.onerror = () => { alert('Invalid image file'); setUploading(false); };
      img.src = reader.result as string;
    };
    reader.onerror = () => { alert('Failed to read file'); setUploading(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-slate-900">Product Management ({products.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary !text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilterCat('All')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${filterCat === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
          All
        </button>
        {allCategories.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${filterCat === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-3 border-2 border-blue-200">
          <h3 className="text-sm font-bold text-slate-900">Add New Product</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Product Name *" required />
            <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="Price ($) *" required />
            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Category *" required />
            <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              placeholder="Brand" />
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Product Image</label>
              <div className="flex items-start gap-4">
                <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors">
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] text-slate-400">{uploading ? 'Uploading...' : 'Click to Upload'}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e)} disabled={uploading} />
                </label>
                <div className="flex-1 space-y-2">
                  <input value={form.image.startsWith('data:') ? '' : form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="Or paste image URL here (optional)" className="!text-xs" />
                  <p className="text-[10px] text-slate-400">Upload from computer (JPG, PNG, WebP). Auto-resized to 600px. Max 10MB.</p>
                  {form.image && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="text-[10px] text-red-500 hover:text-red-700">Remove image</button>
                  )}
                </div>
              </div>
            </div>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description" className="sm:col-span-2" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={!form.name || !form.price || !form.category} className="btn-primary flex-1">Add Product</button>
          </div>
        </form>
      )}

      {/* Products table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
              <th className="text-left p-3 w-14">Image</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Brand</th>
              <th className="text-center p-3">Stock</th>
              <th className="text-right p-3">Price</th>
              <th className="p-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                {/* Image */}
                <td className="p-2">
                  {editingId === p.id && editField === 'image' ? (
                    <div className="flex gap-1">
                      <input value={editValue} onChange={e => setEditValue(e.target.value)}
                        className="!text-[10px] !p-1 w-28" onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                      <button onClick={saveEdit} className="text-green-600"><Check className="w-3 h-3" /></button>
                      <button onClick={cancelEdit} className="text-slate-400"><X className="w-3 h-3" /></button>
                      <label className="text-blue-500 cursor-pointer" title="Upload from computer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <input type="file" accept="image/*" className="hidden" onChange={e => { handleFileUpload(e, p.id); cancelEdit(); }} />
                      </label>
                    </div>
                  ) : (
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover cursor-pointer hover:ring-2 hover:ring-blue-300"
                      onClick={() => startEdit(p.id, 'image', p.image)} title="Click to edit image" />
                  )}
                </td>
                {/* Name + Description */}
                <td className="p-3">
                  {editingId === p.id && editField === 'name' ? (
                    <div className="flex items-center gap-1">
                      <input value={editValue} onChange={e => setEditValue(e.target.value)}
                        className="!text-sm !p-1 flex-1" onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                      <button onClick={saveEdit} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={cancelEdit} className="text-slate-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <p className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600"
                      onClick={() => startEdit(p.id, 'name', p.name)} title="Click to edit name">
                      {p.name}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{p.description}</p>
                </td>
                {/* Category */}
                <td className="p-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.category}</span>
                </td>
                {/* Brand */}
                <td className="p-3 text-xs text-slate-500">{p.brand}</td>
                {/* Stock */}
                <td className="p-3 text-center">
                  <button onClick={() => {
                    const current = p.stock ?? -1;
                    const input = prompt(`Set stock for "${p.name}"\n-1 = unlimited, 0 = out of stock, >0 = limited`, current.toString());
                    if (input !== null) { const v = parseInt(input); if (!isNaN(v)) onUpdate(p.id, { stock: v }); }
                  }} className={`text-xs font-bold px-2 py-1 rounded-full ${
                    (p.stock ?? -1) === 0 ? 'bg-red-100 text-red-700' :
                    (p.stock ?? -1) > 0 && p.stock <= 5 ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-50 text-emerald-600'
                  }`} title="Click to edit stock">
                    {(p.stock ?? -1) === 0 ? 'Out' : (p.stock ?? -1) === -1 ? '∞' : p.stock}
                  </button>
                </td>
                {/* Price */}
                <td className="p-3 text-right">
                  {editingId === p.id && editField === 'price' ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-slate-400">$</span>
                      <input type="number" step="0.01" value={editValue} onChange={e => setEditValue(e.target.value)}
                        className="!text-sm !p-1 w-20 text-right" onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                      <button onClick={saveEdit} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={cancelEdit} className="text-slate-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900 cursor-pointer hover:text-blue-600"
                      onClick={() => startEdit(p.id, 'price', p.price.toString())}
                      title="Click to edit price">
                      ${p.price.toFixed(2)}
                    </span>
                  )}
                </td>
                {/* Actions */}
                <td className="p-3 text-center">
                  <button onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) onDelete(p.id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors" title="Delete product">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">No products found</p>
        )}
      </div>
    </div>
  );
}

// ═══════ PUBLISH BUTTON ═══════
function PublishButton({ products }: { products: any[] }) {
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!confirm(`Publish ${products.length} products to the live shop?\n\nThis will update coffeehouse-shop.vercel.app/shop for all visitors.`)) return;
    setPublishing(true);
    setResult(null);
    try {
      // Filter out base64 images (too large for GitHub)
      const cleanProducts = products.map(p => ({
        ...p,
        image: p.image?.startsWith('data:') ? '(uploaded-image-needs-url)' : p.image,
      }));
      const resp = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: cleanProducts }),
      });
      const data = await resp.json();
      if (data.success) {
        setResult(`✅ Published! Deploying in ~30s. Commit: ${data.commit}`);
      } else {
        setResult(`❌ ${data.error}`);
      }
    } catch (err) {
      setResult(`❌ Connection error`);
    }
    setPublishing(false);
    setTimeout(() => setResult(null), 8000);
  };

  return (
    <div className="relative">
      <button onClick={handlePublish} disabled={publishing}
        className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-white font-semibold">
        {publishing ? (
          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        )}
        {publishing ? 'Publishing...' : 'Publish to Site'}
      </button>
      {result && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap z-50">
          {result}
        </div>
      )}
    </div>
  );
}

// ═══════ POS TERMINAL CONFIG TAB ═══════
function POSConfigTab() {
  const { config, updateConfig, logs, clearLogs, testing, testResult, runTest } = usePOSConfig();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">POS Terminal Configuration</h2>
          <p className="text-sm text-slate-500">Connect your POS machine to receive payment notifications</p>
        </div>
        {saved && (
          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Saved!</span>
        )}
      </div>

      {/* Connection Status */}
      <div className={`card p-5 border-2 ${config.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">POS Terminal</p>
              <p className={`text-xs ${config.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {config.enabled ? 'Active — monitoring for payments' : 'Disabled'}
              </p>
            </div>
          </div>
          <button onClick={() => updateConfig({ enabled: !config.enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Configuration Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <label className="block text-xs font-bold text-slate-500 mb-2">Terminal URL / IP Address</label>
          <input value={config.terminalUrl} onChange={e => updateConfig({ terminalUrl: e.target.value })}
            placeholder="http://192.168.1.100:8080" className="w-full text-sm mb-3" />
          <p className="text-[10px] text-slate-400">IP address or URL of your POS terminal on local network</p>
        </div>
        <div className="card p-5">
          <label className="block text-xs font-bold text-slate-500 mb-2">Merchant ID</label>
          <input value={config.merchantId} onChange={e => updateConfig({ merchantId: e.target.value })}
            placeholder="MERCHANT_001" className="w-full text-sm mb-3" />
          <p className="text-[10px] text-slate-400">Your merchant identifier on the POS system</p>
        </div>
        <div className="card p-5">
          <label className="block text-xs font-bold text-slate-500 mb-2">API Key</label>
          <input type="password" value={config.apiKey} onChange={e => updateConfig({ apiKey: e.target.value })}
            placeholder="sk_live_xxxxx" className="w-full text-sm mb-3" />
          <p className="text-[10px] text-slate-400">Authentication key for POS API</p>
        </div>
        <div className="card p-5">
          <label className="block text-xs font-bold text-slate-500 mb-2">Webhook URL (Payment Callback)</label>
          <input value={config.webhookUrl} onChange={e => updateConfig({ webhookUrl: e.target.value })}
            placeholder="https://your-domain.com/api/pos-webhook" className="w-full text-sm mb-3" />
          <p className="text-[10px] text-slate-400">URL the POS will call when payment is received</p>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Advanced Settings</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Poll Interval (seconds)</label>
            <div className="flex items-center gap-2">
              <input type="number" min={5} max={60} value={config.pollIntervalSec}
                onChange={e => updateConfig({ pollIntervalSec: parseInt(e.target.value) || 10 })}
                className="w-24 text-center font-bold" />
              <span className="text-xs text-slate-400">How often to check for new payments</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Auto-Confirm Orders</label>
            <div className="flex items-center gap-3">
              <button onClick={() => updateConfig({ autoConfirm: !config.autoConfirm })}
                className={`relative w-10 h-5 rounded-full transition-colors ${config.autoConfirm ? 'bg-blue-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.autoConfirm ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs text-slate-500">{config.autoConfirm ? 'ON — auto-confirm when POS reports payment' : 'OFF — manual confirmation required'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Connection */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Test Connection</h3>
          <button onClick={runTest} disabled={testing || !config.terminalUrl}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
            {testing ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...</>
            ) : (
              <><Settings className="w-3.5 h-3.5" /> Test Now</>
            )}
          </button>
        </div>
        {testResult && (
          <div className={`p-3 rounded-xl text-sm font-medium ${testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </div>
        )}
        {!config.terminalUrl && (
          <p className="text-xs text-slate-400">Enter a terminal URL above to test the connection</p>
        )}
      </div>

      {/* POS API Format */}
      <div className="card p-5 bg-slate-50 border-dashed">
        <h3 className="text-sm font-bold text-slate-900 mb-3">POS Integration Guide</h3>
        <div className="space-y-2 text-xs text-slate-600">
          <p><strong>Payment Notification Endpoint:</strong> <code className="bg-slate-200 px-1.5 py-0.5 rounded">POST {config.webhookUrl || 'YOUR_WEBHOOK_URL'}</code></p>
          <p><strong>Expected Payload:</strong></p>
          <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-[11px] overflow-x-auto">{`{
  "event": "payment_received",
  "amount": 11.61,
  "currency": "RITUAL",
  "merchant_id": "${config.merchantId || 'MERCHANT_ID'}",
  "tx_hash": "0xabc123...",
  "customer_wallet": "0x...",
  "timestamp": ${Date.now()},
  "status": "confirmed"
}`}</pre>
          <p className="text-[10px] text-slate-400 mt-2">Configure your POS to send a POST request to the webhook URL above when a payment is received.</p>
        </div>
      </div>

      {/* Action */}
      <button onClick={handleSave} className="w-full bg-slate-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-amber-700 transition-colors">
        Save POS Configuration
      </button>

      {/* Logs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">POS Activity Log ({logs.length})</h3>
          {logs.length > 0 && (
            <button onClick={clearLogs} className="text-xs text-red-500 hover:text-red-700">Clear All</button>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No POS activity yet</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.slice(0, 50).map(log => (
              <div key={log.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.type === 'payment_received' ? 'bg-emerald-500' : log.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800">{log.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    {log.amount && <span className="text-[10px] font-bold text-emerald-600">${log.amount.toFixed(2)}</span>}
                    {log.txHash && <span className="text-[10px] font-mono text-slate-400">{log.txHash.slice(0, 16)}...</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════ SHIPPING SETTINGS TAB ═══════
function ShippingSettingsTab() {
  const [config, setConfig] = useState<ShippingConfig>(getShippingConfig);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveShippingConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults: ShippingConfig = { freeRadiusKm: 10, pricePerKm: 0.1, maxFee: 10 };
    setConfig(defaults);
    saveShippingConfig(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Shipping Fee Settings</h2>
          <p className="text-sm text-slate-500">Configure delivery pricing based on distance from nearest store</p>
        </div>
        {saved && (
          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Saved!</span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Free Radius */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Free Shipping Radius</p>
              <p className="text-sm font-bold text-slate-900">Distance for FREE delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={100} step={1}
              value={config.freeRadiusKm}
              onChange={e => setConfig({ ...config, freeRadiusKm: parseFloat(e.target.value) || 0 })}
              className="flex-1 text-center text-lg font-bold h-12 rounded-xl" />
            <span className="text-sm font-semibold text-slate-500">km</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Orders within this radius get free shipping</p>
        </div>

        {/* Price per km */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Price Per Extra km</p>
              <p className="text-sm font-bold text-slate-900">Beyond free radius</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">$</span>
            <input type="number" min={0} max={5} step={0.01}
              value={config.pricePerKm}
              onChange={e => setConfig({ ...config, pricePerKm: parseFloat(e.target.value) || 0 })}
              className="flex-1 text-center text-lg font-bold h-12 rounded-xl" />
            <span className="text-sm font-semibold text-slate-500">/km</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Fee per km beyond the free radius</p>
        </div>

        {/* Max Fee */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Maximum Fee Cap</p>
              <p className="text-sm font-bold text-slate-900">Shipping fee limit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">$</span>
            <input type="number" min={0} max={50} step={0.5}
              value={config.maxFee}
              onChange={e => setConfig({ ...config, maxFee: parseFloat(e.target.value) || 0 })}
              className="flex-1 text-center text-lg font-bold h-12 rounded-xl" />
            <span className="text-sm font-semibold text-slate-500">max</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Maximum shipping fee regardless of distance</p>
        </div>
      </div>

      {/* Fee Preview Table */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Fee Preview</h3>
        <p className="text-xs text-slate-400 mb-4">How shipping fees look for different distances</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-xs text-slate-400 font-medium">Distance</th>
                <th className="text-right py-2 text-xs text-slate-400 font-medium">Shipping Fee</th>
                <th className="text-right py-2 text-xs text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[0, 5, 10, 15, 20, 30, 50, 80, 100, 150].map(km => {
                const fee = km <= config.freeRadiusKm ? 0 : Math.min(config.maxFee, Math.round((km - config.freeRadiusKm) * config.pricePerKm * 100) / 100);
                return (
                  <tr key={km} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 font-medium">{km} km</td>
                    <td className="py-2 text-right font-bold">{fee === 0 ? 'FREE' : `$${fee.toFixed(2)}`}</td>
                    <td className="py-2 text-right">
                      {fee === 0 ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Free Zone</span>
                      ) : fee >= config.maxFee ? (
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">Max Cap</span>
                      ) : (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">Standard</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave}
          className="flex-1 bg-slate-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-amber-700 transition-colors">
          Save Settings
        </button>
        <button onClick={handleReset}
          className="px-6 bg-white text-slate-700 font-semibold text-sm py-3 rounded-xl border border-slate-200 hover:bg-slate-50">
          Reset to Default
        </button>
      </div>

      {/* Current Formula */}
      <div className="card p-4 bg-slate-50 border-dashed">
        <p className="text-xs font-bold text-slate-500 mb-2">Current Formula</p>
        <p className="text-sm text-slate-700 font-mono">
          if distance ≤ {config.freeRadiusKm}km → <span className="text-emerald-600 font-bold">FREE</span>
        </p>
        <p className="text-sm text-slate-700 font-mono">
          if distance {'>'} {config.freeRadiusKm}km → min(${config.maxFee}, (distance - {config.freeRadiusKm}) × ${config.pricePerKm})
        </p>
        <p className="text-[10px] text-slate-400 mt-2">Distance calculated from customer to nearest COFFEE HOUSE store (63 locations nationwide)</p>
      </div>
    </div>
  );
}

// ═══════ BACKUP TAB ═══════
function BackupTab({ products, orders }: { products: any[]; orders: any[] }) {
  const [importing, setImporting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(() => localStorage.getItem('arcbank_last_backup'));

  const exportBackup = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopName: 'Coffee House',
      products: JSON.parse(localStorage.getItem('arcbank_products') || '[]'),
      orders: JSON.parse(localStorage.getItem('arcbank_orders') || '[]'),
      finances: JSON.parse(localStorage.getItem('arcbank_finances') || '[]'),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coffee-house-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = new Date().toLocaleString();
    localStorage.setItem('arcbank_last_backup', now);
    setLastBackup(now);
  };

  const exportCSV = () => {
    const prods = JSON.parse(localStorage.getItem('arcbank_products') || '[]');
    const header = 'id,name,price,category,brand,description,image\n';
    const rows = prods.map((p: any) =>
      `"${p.id}","${p.name}",${p.price},"${p.category}","${p.brand}","${(p.description || '').replace(/"/g, '""')}","${p.image?.startsWith('data:') ? '(base64-image)' : p.image}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coffee-house-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.products || !Array.isArray(data.products)) {
          alert('Invalid backup file: missing products data');
          setImporting(false);
          return;
        }
        const confirmMsg = `Restore backup from ${data.exportedAt || 'unknown date'}?\n\n` +
          `• ${data.products.length} products\n` +
          `• ${data.orders?.length || 0} orders\n` +
          `• ${data.finances?.length || 0} finance entries\n\n` +
          `This will REPLACE all current data. Continue?`;
        if (!window.confirm(confirmMsg)) { setImporting(false); return; }

        localStorage.setItem('arcbank_products', JSON.stringify(data.products));
        if (data.orders) localStorage.setItem('arcbank_orders', JSON.stringify(data.orders));
        if (data.finances) localStorage.setItem('arcbank_finances', JSON.stringify(data.finances));
        alert('Backup restored successfully! The page will reload.');
        window.location.reload();
      } catch (err) {
        alert('Failed to parse backup file: ' + (err as Error).message);
      }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const publishToSite = async () => {
    const prods = JSON.parse(localStorage.getItem('arcbank_products') || '[]');
    if (!prods.length) { alert('No products to publish'); return; }
    if (!window.confirm(`Publish ${prods.length} products to live site?\n\nThis will update https://coffeehouse-shop.vercel.app/shop for all visitors.`)) return;

    setPublishing(true);
    setPublishStatus(null);
    try {
      const resp = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: prods }),
      });
      const data = await resp.json();
      if (data.success) {
        setPublishStatus('Published! Changes will be live in ~30 seconds.');
        localStorage.setItem('arcbank_last_publish', new Date().toLocaleString());
      } else {
        setPublishStatus('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setPublishStatus('Error: ' + (err as Error).message);
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Data Backup & Restore</h2>

      {/* Publish to Live Site */}
      <div className="card p-6 border-2 border-green-200 bg-green-50/50">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          Publish to Live Site
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Push your current products to <strong>coffeehouse-shop.vercel.app/shop</strong> so all visitors see the latest changes.
        </p>
        <button onClick={publishToSite} disabled={publishing}
          className="btn-primary !bg-green-600 hover:!bg-green-700 !text-sm">
          {publishing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publishing...
            </span>
          ) : 'Publish Products to Site'}
        </button>
        {publishStatus && (
          <p className={`text-xs mt-2 ${publishStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {publishStatus}
          </p>
        )}
      </div>

      {/* Export section */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600" /> Export Backup
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Download all shop data to your computer. Store this file safely — you can use it to restore everything if browser data is cleared.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={exportBackup}
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors text-left">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Full Backup (JSON)</p>
              <p className="text-[10px] text-blue-600">Products, orders, finances — complete data</p>
            </div>
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors text-left">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Products (CSV)</p>
              <p className="text-[10px] text-emerald-600">Spreadsheet format — edit in Excel/Google Sheets</p>
            </div>
          </button>
        </div>
        {lastBackup && (
          <p className="text-[10px] text-slate-400 mt-3">Last backup: {lastBackup}</p>
        )}
      </div>

      {/* Import section */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-amber-600" /> Restore from Backup
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Upload a previously exported JSON backup file to restore all data. <span className="text-red-500 font-semibold">Warning: This will replace all current data.</span>
        </p>
        <label className="flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-400 cursor-pointer transition-colors">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">{importing ? 'Restoring...' : 'Choose Backup File'}</p>
            <p className="text-[10px] text-amber-600">Select a .json backup file to restore</p>
          </div>
          <input type="file" accept=".json" className="hidden" onChange={importBackup} disabled={importing} />
        </label>
      </div>

      {/* Current data summary */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-600" /> Current Data Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-2xl font-extrabold text-slate-900">{products.length}</p>
            <p className="text-xs text-slate-500">Products</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-2xl font-extrabold text-slate-900">{orders.length}</p>
            <p className="text-xs text-slate-500">Orders</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <p className="text-2xl font-extrabold text-slate-900">
              {JSON.parse(localStorage.getItem('arcbank_finances') || '[]').length}
            </p>
            <p className="text-xs text-slate-500">Finance Entries</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-[11px] text-blue-700">
            <strong>Storage used:</strong> ~{(new Blob([JSON.stringify(localStorage)]).size / 1024).toFixed(0)} KB of ~5 MB limit
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════ HELPERS ═══════
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color] || colors.blue}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const icons: Record<string, any> = {
    pending: Clock, confirmed: Check, preparing: ChefHat, shipping: Truck, delivered: Package, failed: X
  };
  const colors: Record<string, string> = {
    pending: 'text-amber-500', confirmed: 'text-emerald-500', preparing: 'text-blue-500',
    shipping: 'text-purple-500', delivered: 'text-emerald-600', failed: 'text-red-500'
  };
  const Icon = icons[status] || Clock;
  return <Icon className={`w-4 h-4 ${colors[status] || 'text-slate-400'}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    preparing: { label: 'Preparing', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    shipping: { label: 'Shipping', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    delivered: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    failed: { label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[status] || config.pending;
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.cls}`}>{c.label}</span>;
}

function TaxRow({ name, rate, desc }: { name: string; rate: string; desc: string }) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
      <div>
        <p className="font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <span className="text-sm font-bold text-blue-600">{rate}</span>
    </div>
  );
}

function getCategoryRevenue(orders: any[]): [string, number][] {
  const catMap: Record<string, number> = {};
  orders.forEach(order => {
    if (order.status === 'failed') return;
    order.items.forEach((item: any) => {
      const cat = item.product.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + item.product.price * item.quantity;
    });
  });
  return Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

