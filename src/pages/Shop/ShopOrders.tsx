import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useShop } from '../../hooks/useShop';
import { ExternalLink, Clock, Check, X, ShoppingBag, Coffee, MapPin, Truck, Package, ChefHat, Receipt, RotateCcw } from 'lucide-react';
import PaymentReceipt from '../../components/PaymentReceipt';

export default function ShopOrders() {
  const navigate = useNavigate();
  const { orders, requestRefund } = useShop();
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [refundOrder, setRefundOrder] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const receiptOrder = viewReceipt ? orders.find(o => o.id === viewReceipt) : null;

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    confirmed: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', label: 'Confirmed' },
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'Pending' },
    preparing: { icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', label: 'Preparing' },
    shipping: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', label: 'On the Way' },
    delivered: { icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Delivered' },
    failed: { icon: X, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'Failed' },
    refunded: { icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', label: 'Refunded' },
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Order History</h1>
            <p className="text-sm text-slate-400">{orders.length} orders</p>
          </div>
          <button onClick={() => navigate('/shop')} className="btn-primary !px-4 !text-sm flex items-center gap-1.5">
            <Coffee className="w-4 h-4" /> New Order
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="card p-8 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">No orders yet</p>
            <button onClick={() => navigate('/shop')} className="btn-primary">Browse Menu</button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const sc = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              return (
                <div key={order.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${sc.color}`} />
                      <span className="font-mono text-xs text-slate-500">{order.id}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 mb-3">
                    {order.items.map(item => (
                      <div key={item.product.id + (item.selectedSize || '') + (item.selectedTemp || '')} className="flex items-center gap-2">
                        <img src={item.product.image} alt={item.product.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-slate-700 truncate block">{item.product.name}</span>
                          <div className="flex items-center gap-1">
                            {item.selectedSize && <span className="text-[9px] px-1 py-0.5 bg-slate-100 rounded text-slate-400">{item.selectedSize}</span>}
                            {item.selectedTemp && <span className="text-[9px] px-1 py-0.5 bg-slate-100 rounded text-slate-400">{item.selectedTemp}</span>}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">×{item.quantity}</span>
                        <span className="text-xs font-semibold">${((item.unitPrice || item.product.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery address */}
                  {order.delivery && (
                    <div className="flex items-start gap-2 mb-3 p-2 bg-slate-50 rounded-lg">
                      <MapPin className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-600 truncate">{order.delivery.address}</p>
                        {order.delivery.note && <p className="text-[10px] text-slate-400">📝 {order.delivery.note}</p>}
                      </div>
                    </div>
                  )}

                  {/* Delivery progress */}
                  {order.delivery && order.status !== 'cancelled' && (
                    <div className="flex items-center gap-1 mb-3">
                      {['confirmed', 'preparing', 'shipping', 'delivered'].map((s, i) => {
                        const steps = ['confirmed', 'preparing', 'shipping', 'delivered'];
                        const currentIdx = steps.indexOf(order.status);
                        const active = i <= currentIdx;
                        return (
                          <div key={s} className="flex-1 flex flex-col items-center">
                            <div className={`h-1.5 w-full rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-200'} ${i > 0 ? '' : ''}`} />
                            <span className={`text-[9px] mt-0.5 ${active ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                              {s === 'confirmed' ? '✓' : s === 'preparing' ? '👨‍🍳' : s === 'shipping' ? '🛵' : '📦'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {new Date(order.timestamp).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      {order.status === 'confirmed' || order.status === 'preparing' || order.status === 'shipping' || order.status === 'delivered' ? (
                        <button onClick={() => setViewReceipt(order.id)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                          <Receipt className="w-3 h-3" /> Receipt
                        </button>
                      ) : null}
                      {order.status === 'delivered' && (
                        <button onClick={() => { setRefundOrder(order.id); setRefundReason(''); }}
                          className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 hover:text-orange-800 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200">
                          <RotateCcw className="w-3 h-3" /> Refund
                        </button>
                      )}
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-900">${order.total.toFixed(2)} RITUAL</span>
                        {order.shippingFee > 0 && (
                          <p className="text-[10px] text-slate-400">incl. ${order.shippingFee.toFixed(2)} shipping</p>
                        )}
                      </div>
                      {order.txHash && (
                        <a href={`https://testnet.explorer.ritualfoundation.org/tx/${order.txHash}`} target="_blank" rel="noreferrer"
                          className="text-blue-500 hover:text-blue-700">
                          <ExternalLink className="w-3.5 h-3.5" />
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

      {/* Receipt Overlay */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50">
          <PaymentReceipt
            order={receiptOrder}
            txHash={receiptOrder.txHash}
            onClose={() => setViewReceipt(null)}
          />
          <div className="max-w-md mx-auto px-4 pb-8 -mt-4">
            <button onClick={() => setViewReceipt(null)}
              className="w-full bg-white text-slate-700 font-semibold text-sm py-3 rounded-xl border border-slate-200 hover:bg-slate-50">
              ← Back to Orders
            </button>
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      {refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Request Refund</h3>
            <p className="text-sm text-slate-400 mb-4">Order {refundOrder}</p>
            <textarea
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
              placeholder="Reason for refund..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRefundOrder(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (refundReason.trim()) {
                    requestRefund(refundOrder, refundReason.trim());
                    setRefundOrder(null);
                    setRefundReason('');
                  }
                }}
                disabled={!refundReason.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


