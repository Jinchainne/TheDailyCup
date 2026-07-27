import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../hooks/useShop';
import { Search, Package, Clock, Check, ChefHat, Truck, XCircle, MapPin, ExternalLink, Copy } from 'lucide-react';

const STATUS_STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: Check, color: 'emerald' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'blue' },
  { key: 'shipping', label: 'On the Way', icon: Truck, color: 'purple' },
  { key: 'delivered', label: 'Delivered', icon: Package, color: 'emerald' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'];

export default function OrderTracking() {
  const navigate = useNavigate();
  const { getOrderByCode } = useShop();
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSearch = () => {
    setError('');
    setOrder(null);
    if (!code.trim()) { setError('Please enter an order code'); return; }
    const found = getOrderByCode(code.trim());
    if (found) {
      setOrder(found);
    } else {
      setError('Order not found. Check your code and try again.');
    }
  };

  const copyCode = () => {
    if (order) { navigator.clipboard.writeText(order.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const currentStep = order ? STATUS_ORDER.indexOf(order.status) : 0;
  const isCancelled = order?.status === 'cancelled';

  const formatTime = (ts?: number) => ts ? new Date(ts).toLocaleString() : null;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/shop')} className="text-sm text-slate-500 hover:text-slate-700 mb-4">
          ← Back to Shop
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Track Your Order</h1>
        <p className="text-sm text-slate-400 mb-6">Enter your order code to check status</p>

        {/* Search */}
        <div className="card p-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Enter code (e.g. ARX-K7M2P)"
                className="pl-10 w-full font-mono"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary !px-5">Track</button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-4">
            {/* Order Code Header */}
            <div className="card p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Order Code</p>
                  <p className="text-2xl font-extrabold text-blue-900 font-mono">{order.code}</p>
                </div>
                <button onClick={copyCode} className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  isCancelled ? 'bg-red-100 text-red-700' :
                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {isCancelled ? <XCircle className="w-3 h-3" /> :
                   order.status === 'delivered' ? <Check className="w-3 h-3" /> :
                   <Clock className="w-3 h-3" />}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className="text-xs text-slate-400">{new Date(order.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Progress Tracker */}
            {!isCancelled && (
              <div className="card p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Order Progress</h3>
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, i) => {
                    const stepIdx = STATUS_ORDER.indexOf(step.key);
                    const active = currentStep >= stepIdx;
                    const done = currentStep > stepIdx;
                    const current = currentStep === stepIdx;
                    const timestamp = order[`${step.key}At`];
                    return (
                      <div key={step.key} className="flex gap-3">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            done ? 'bg-emerald-500 text-white' :
                            current ? 'bg-blue-500 text-white animate-pulse' :
                            'bg-slate-200 text-slate-400'
                          }`}>
                            {done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                          )}
                        </div>
                        {/* Content */}
                        <div className="pb-4 flex-1">
                          <p className={`text-sm font-semibold ${active ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                          {timestamp && <p className="text-[11px] text-slate-400">{formatTime(timestamp)}</p>}
                          {current && !done && <p className="text-[11px] text-blue-500 font-medium">Current status</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancelled notice */}
            {isCancelled && (
              <div className="card p-4 border-red-200 bg-red-50">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-bold text-red-900">Order Cancelled</p>
                    {order.cancelReason && <p className="text-xs text-red-600 mt-1">Reason: {order.cancelReason}</p>}
                    {order.cancelledAt && <p className="text-xs text-red-400 mt-1">{formatTime(order.cancelledAt)}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="card p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Items</h3>
              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.product.id} className="flex items-center gap-2">
                    <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-400">×{item.quantity} · ${item.product.price.toFixed(2)} each</p>
                    </div>
                    <span className="text-sm font-bold">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between">
                <span className="text-xs text-slate-500">Shipping: ${order.shippingFee.toFixed(2)}</span>
                <span className="text-sm font-extrabold text-blue-600">${order.total.toFixed(2)} RITUAL</span>
              </div>
            </div>

            {/* Delivery Address */}
            {order.delivery && (
              <div className="card p-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Delivery Address</p>
                    <p className="text-sm text-slate-900">{order.delivery.address}</p>
                    {order.delivery.note && <p className="text-xs text-slate-500 mt-1">📝 {order.delivery.note}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction */}
            {order.txHash && (
              <a href={`https://testnet.explorer.ritualfoundation.org/tx/${order.txHash}`} target="_blank" rel="noreferrer"
                className="card p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-xs text-slate-400">Transaction</p>
                  <p className="text-xs font-mono text-slate-700">{order.txHash.slice(0, 20)}...</p>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-500" />
              </a>
            )}

            {/* Total */}
            <div className="card p-4 bg-slate-50">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-slate-900">Total Paid</span>
                <span className="text-lg font-extrabold text-blue-600">${order.total.toFixed(2)} RITUAL</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Wallet: {order.customerWallet.slice(0, 10)}...{order.customerWallet.slice(-6)}</p>
            </div>
          </div>
        )}

        {/* No order searched yet */}
        {!order && !error && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Enter your order code to track your delivery</p>
          </div>
        )}
      </div>
    </div>
  );
}


