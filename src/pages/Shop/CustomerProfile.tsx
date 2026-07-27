import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import {
  User, Wallet, Copy, Check, Coffee, ShoppingBag, Clock,
  ExternalLink, Star, Trophy, TrendingUp, ArrowRight,
  ChevronRight, Gift, Crown, Shield, Package, Truck, ChefHat,
  X, RotateCcw, MapPin, Receipt
} from 'lucide-react';
import PaymentReceipt from '../../components/PaymentReceipt';
import { formatCurrency } from '../../utils/format';

const TIER_ICONS = { Bronze: Shield, Silver: Star, Gold: Crown };
const TIER_COLORS: Record<string, { gradient: string; text: string; bg: string; border: string; ring: string }> = {
  Bronze: { gradient: 'from-amber-500 to-orange-600', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', ring: 'ring-amber-200' },
  Silver: { gradient: 'from-slate-400 to-slate-600', text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-300', ring: 'ring-slate-200' },
  Gold: { gradient: 'from-yellow-400 to-amber-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300', ring: 'ring-yellow-200' },
};

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  confirmed: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', label: 'Confirmed' },
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'Pending' },
  preparing: { icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', label: 'Preparing' },
  shipping: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', label: 'On the Way' },
  delivered: { icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Delivered' },
  cancelled: { icon: X, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'Cancelled' },
  refunded: { icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', label: 'Refunded' },
};

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { customer, isConnected, walletAddress, orders, loyaltyTier, tierProgress, shortenAddress } = useCustomer();
  const [copied, setCopied] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);

  const receiptOrder = viewReceipt ? orders.find(o => o.id === viewReceipt) : null;
  const tierColors = TIER_COLORS[loyaltyTier];
  const TierIcon = TIER_ICONS[loyaltyTier];

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Not Connected ───
  if (!isConnected || !walletAddress) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Connect your wallet to view your profile, track orders, and earn loyalty rewards
            </p>
            <button onClick={() => navigate('/shop')} className="btn-primary">
              Go to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ─── Hero Card ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
          {/* Gradient header */}
          <div className={`h-24 bg-gradient-to-r ${tierColors.gradient}`} />

          <div className="px-5 pb-5 -mt-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center mb-3">
              <div className={`w-full h-full rounded-xl bg-gradient-to-br ${tierColors.gradient} flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">
                  {walletAddress.slice(2, 4).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Name & Address */}
            <div className="flex items-start justify-between mb-3">
              <div>
                {customer?.displayName && (
                  <h2 className="text-lg font-extrabold text-slate-900">{customer.displayName}</h2>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {shortenAddress(walletAddress)}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                    title="Copy address"
                  >
                    {copied
                      ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                      : <Copy className="w-3.5 h-3.5 text-slate-400" />
                    }
                  </button>
                  <a
                    href={`https://testnet.explorer.ritualfoundation.app/address/${walletAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                    title="View on RitualScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Tier Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierColors.bg} ${tierColors.border} border`}>
                <TierIcon className={`w-4 h-4 ${tierColors.text}`} />
                <span className={`text-xs font-bold ${tierColors.text}`}>{loyaltyTier}</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-extrabold text-slate-900">{customer?.totalOrders ?? 0}</p>
                <p className="text-[10px] text-slate-400 font-medium">Orders</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-extrabold text-slate-900">{formatCurrency(customer?.totalSpent ?? 0)}</p>
                <p className="text-[10px] text-slate-400 font-medium">Total Spent</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-extrabold text-slate-900">{customer?.loyaltyPoints ?? 0}</p>
                <p className="text-[10px] text-slate-400 font-medium">Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Loyalty Progress ─── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${tierColors.bg}`}>
                <Trophy className={`w-4 h-4 ${tierColors.text}`} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Loyalty Progress</h3>
            </div>
            {tierProgress.next && (
              <span className="text-[10px] font-semibold text-slate-400">
                {tierProgress.ordersNeeded} order{tierProgress.ordersNeeded !== 1 ? 's' : ''} to {tierProgress.next}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${tierColors.gradient} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(100, tierProgress.progress)}%` }}
            />
          </div>

          {/* Tier Labels */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-600">Bronze</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-semibold text-slate-600">Silver</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-semibold text-yellow-600">Gold</span>
            </div>
          </div>

          {/* Tier Benefits */}
          {loyaltyTier !== 'Gold' && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-blue-700 font-medium">
                  {loyaltyTier === 'Bronze'
                    ? 'Reach Silver (5 orders) for priority support & exclusive offers!'
                    : 'Reach Gold (16 orders) for free shipping & VIP perks!'}
                </p>
              </div>
            </div>
          )}
          {loyaltyTier === 'Gold' && (
            <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-yellow-700 font-medium">
                  🎉 You're a Gold VIP! Enjoy free shipping, priority support & exclusive offers.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Member Since ─── */}
        {customer && (
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Member since</p>
              <p className="text-sm font-semibold text-slate-700">
                {new Date(customer.firstSeen).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {/* ─── Order History ─── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              Order History
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          </div>

          {orders.length === 0 ? (
            <div className="card p-8 text-center">
              <Coffee className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">No orders yet</p>
              <button onClick={() => navigate('/shop')} className="btn-primary !text-xs !px-4 !py-2">
                Browse Menu <ArrowRight className="w-3 h-3 inline ml-1" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map(order => {
                const sc = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                return (
                  <div key={order.id} className="card p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${sc.color}`} />
                        <span className="font-mono text-[11px] text-slate-500">{order.code || order.id}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 mb-2.5">
                      {order.items.slice(0, 3).map(item => (
                        <div
                          key={item.product.id + (item.selectedSize || '') + (item.selectedTemp || '')}
                          className="flex items-center gap-2"
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <span className="flex-1 text-xs text-slate-700 truncate">{item.product.name}</span>
                          <span className="text-[10px] text-slate-400">×{item.quantity}</span>
                          <span className="text-xs font-semibold text-slate-900">
                            {formatCurrency((item.unitPrice || item.product.price) * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-[10px] text-slate-400 pl-9">+{order.items.length - 3} more items</p>
                      )}
                    </div>

                    {/* Delivery address */}
                    {order.delivery && (
                      <div className="flex items-start gap-2 mb-2.5 p-2 bg-slate-50 rounded-lg">
                        <MapPin className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-slate-500 truncate">{order.delivery.address}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {new Date(order.timestamp).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'shipping' || order.status === 'delivered') && (
                          <button
                            onClick={() => setViewReceipt(order.id)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200"
                          >
                            <Receipt className="w-3 h-3" /> Receipt
                          </button>
                        )}
                        <span className="text-sm font-extrabold text-slate-900">{formatCurrency(order.total)}</span>
                        {order.txHash && (
                          <a
                            href={`https://testnet.explorer.ritualfoundation.app/tx/${order.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/shop')}
            className="card p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="p-2 rounded-xl bg-blue-50">
              <Coffee className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900">Order</p>
              <p className="text-[10px] text-slate-400">Browse menu</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
          </button>
          <button
            onClick={() => navigate('/shop/orders')}
            className="card p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="p-2 rounded-xl bg-emerald-50">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900">Orders</p>
              <p className="text-[10px] text-slate-400">Track status</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
          </button>
        </div>
      </div>

      {/* ─── Receipt Overlay ─── */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50">
          <PaymentReceipt
            order={receiptOrder}
            txHash={receiptOrder.txHash}
            onClose={() => setViewReceipt(null)}
          />
          <div className="max-w-md mx-auto px-4 pb-8 -mt-4">
            <button
              onClick={() => setViewReceipt(null)}
              className="w-full bg-white text-slate-700 font-semibold text-sm py-3 rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              ← Back to Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


