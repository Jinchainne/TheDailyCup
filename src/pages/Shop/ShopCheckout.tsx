import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useShop, MERCHANT_ADDRESS, generateOrderCode, type DeliveryAddress } from '../../hooks/useShop';
import { useAgent } from '../../hooks/useAgent';
import { useSendRitual, useRitualBalance } from '../../hooks/useOnChain';
import { formatCurrency, shortenAddress } from '../../utils/format';
import { CHAIN_ID, CURRENCY_SYMBOL } from '../../config/network';
import WalletConnect from '../../components/WalletConnect';
import { ArrowLeft, AlertCircle, Trash2, Plus, Minus, MapPin, Truck, QrCode, X, Tag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PaymentReceipt from '../../components/PaymentReceipt';

export default function ShopCheckout() {
  const { isConnected, address: walletAddress } = useAccount();
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount, updateQuantity, removeFromCart, clearCart, saveOrder, updateOrderStatus, orders, promoCode, promoDiscount, applyPromo, removePromo } = useShop();
  const { balance } = useRitualBalance();
  const { send, hash, isPending, isConfirming, isSuccess, error: sendError } = useSendRitual();
  const { processOrder, dispatchDelivery } = useAgent();
  const [step, setStep] = useState<'review' | 'pay' | 'done'>('review');
  const [orderId, setOrderId] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [delivery, setDelivery] = useState<DeliveryAddress | null>(null);
  const [shippingFee, setShippingFee] = useState(1.5);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('thedailycup_delivery');
      if (saved) setDelivery(JSON.parse(saved));
      const fee = sessionStorage.getItem('thedailycup_shipping_fee');
      if (fee) setShippingFee(parseFloat(fee));
    } catch {}
  }, []);

  const effectiveShipping = promoCode === 'FREESHIP' ? 0 : shippingFee;
  const effectiveDiscount = promoCode === 'FREESHIP' ? 0 : promoDiscount;
  const grandTotal = cartTotal - effectiveDiscount + effectiveShipping;
  const insufficientBalance = grandTotal > balance;

  // Payment URI for QR code (EIP-681 format)
  const paymentURI = `ethereum:${MERCHANT_ADDRESS}@${CHAIN_ID}?value=${(grandTotal * 1e18).toFixed(0)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(MERCHANT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = () => {
    const id = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const code = generateOrderCode();
    setOrderId(id);
    saveOrder({
      id,
      code,
      items: cart,
      total: grandTotal,
      status: 'pending',
      timestamp: Date.now(),
      merchantAddress: MERCHANT_ADDRESS,
      customerWallet: walletAddress || '',
      delivery: delivery || undefined,
      shippingFee,
    });
    send(MERCHANT_ADDRESS, grandTotal.toFixed(6));
    setStep('pay');
  };

  useEffect(() => {
    if (isSuccess && orderId) {
      updateOrderStatus(orderId, 'confirmed', hash);
      // Trigger agent processing
      const itemNames = cart.map(i => i.product.name);
      processOrder(itemNames, grandTotal);
      if (delivery) {
        dispatchDelivery(orderId, delivery.address);
      }
      clearCart();
      if (delivery) {
        setTimeout(() => updateOrderStatus(orderId, 'preparing'), 5000);
        setTimeout(() => updateOrderStatus(orderId, 'shipping'), 15000);
        setTimeout(() => updateOrderStatus(orderId, 'delivered'), 30000);
      }
      sessionStorage.removeItem('thedailycup_delivery');
      sessionStorage.removeItem('thedailycup_shipping_fee');
      setStep('done');
    }
    if (sendError && orderId) {
      updateOrderStatus(orderId, 'cancelled');
    }
  }, [isSuccess, sendError, orderId, hash]);

  if (!isConnected) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Wallet to Pay</h3>
          <p className="text-sm text-slate-400 mb-4">Connect your wallet to pay with native {CURRENCY_SYMBOL} on Ritual</p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/shop/delivery')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Checkout</h1>
        <p className="text-sm text-slate-400 mb-6">Pay with native {CURRENCY_SYMBOL} on Ritual Testnet</p>

        {/* Step 1: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            {delivery && (
              <div className="card p-4 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-700 mb-1">Delivery To</p>
                    <p className="text-sm text-blue-900">{delivery.address}</p>
                    {delivery.note && <p className="text-xs text-blue-600 mt-1">📝 {delivery.note}</p>}
                  </div>
                  <button onClick={() => navigate('/shop/delivery')} className="text-xs text-blue-600 hover:underline">Change</button>
                </div>
              </div>
            )}

            {!delivery && (
              <button onClick={() => navigate('/shop/delivery')} className="card p-4 w-full text-left border-dashed border-2 border-slate-200 hover:border-blue-300">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Add delivery address</span>
                </div>
              </button>
            )}

            {/* Cart Items */}
            <div className="card p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Order Items ({cartCount})</h3>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id + (item.selectedSize || '') + (item.selectedTemp || '')} className="flex items-center gap-3">
                    <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {item.selectedSize && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{item.selectedSize}</span>}
                        {item.selectedTemp && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{item.selectedTemp}</span>}
                        <span className="text-xs text-slate-400">${(item.unitPrice || item.product.price).toFixed(2)} each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Plus className="w-3 h-3 text-blue-600" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-16 text-right">${((item.unitPrice || item.product.price) * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Code */}
            <div className="card p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Promo Code</h3>
              {promoCode ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">{promoCode}</span>
                  </div>
                  <button onClick={() => { removePromo(); setPromoMsg(null); }} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value); setPromoMsg(null); }}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (!promoInput.trim()) return;
                      const result = applyPromo(promoInput.trim());
                      setPromoMsg({ type: result.success ? 'success' : 'error', text: result.message });
                      if (result.success) setPromoInput('');
                    }}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800"
                  >
                    Apply
                  </button>
                </div>
              )}
              {promoMsg && (
                <p className={`text-xs mt-2 ${promoMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {promoMsg.text}
                </p>
              )}
              <p className="text-[10px] text-slate-400 mt-2">Try: WELCOME10, SAVE5, FREESHIP, COFFEE20</p>
            </div>

            {/* Payment Summary */}
            <div className="card p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><Tag className="w-3 h-3" /> Discount ({promoCode})</span>
                    <span className="text-emerald-600 font-semibold">-${effectiveDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1"><Truck className="w-3 h-3" /> Shipping</span>
                  <span className={`font-semibold ${effectiveShipping === 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {effectiveShipping === 0 ? 'FREE' : `$${effectiveShipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Network Fee</span>
                  <span className="text-emerald-600 font-semibold">~$0.01</span>
                </div>
                <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-lg font-extrabold text-blue-600">${grandTotal.toFixed(2)} {CURRENCY_SYMBOL}</span>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className={`card p-3 ${insufficientBalance ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className="flex justify-between text-sm">
                <span className={insufficientBalance ? 'text-red-700' : 'text-emerald-700'}>Your {CURRENCY_SYMBOL} Balance</span>
                <span className={`font-bold ${insufficientBalance ? 'text-red-700' : 'text-emerald-700'}`}>{formatCurrency(balance)}</span>
              </div>
              {insufficientBalance && <p className="text-xs text-red-600 mt-1">Insufficient balance. Need {formatCurrency(grandTotal - balance)} more.</p>}
            </div>

            {/* Wallet Info */}
            <div className="card p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">From</span>
                <span className="font-mono text-slate-700">{shortenAddress(walletAddress || '')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">To (Merchant)</span>
                <span className="font-mono text-slate-700">{shortenAddress(MERCHANT_ADDRESS)}</span>
              </div>
            </div>

            {/* QR Code Payment */}
            <div className="card p-5 text-center border-2 border-blue-200 bg-blue-50">
              <div className="flex items-center justify-center gap-2 mb-3">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-900">Scan QR to Pay</h3>
              </div>
              <p className="text-xs text-blue-600 mb-4">Open your wallet app and scan this QR code</p>
              
              <div className="inline-block p-3 bg-white rounded-2xl shadow-md">
                <QRCodeSVG
                  value={paymentURI}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between bg-white rounded-xl p-2.5">
                  <span className="text-xs text-slate-500">Amount</span>
                  <span className="text-sm font-bold text-blue-600">${grandTotal.toFixed(2)} {CURRENCY_SYMBOL}</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl p-2.5">
                  <span className="text-xs text-slate-500">Network</span>
                  <span className="text-xs font-semibold text-slate-700">Ritual ({CHAIN_ID})</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl p-2.5">
                  <span className="text-xs text-slate-500">Merchant</span>
                  <span className="text-xs font-mono text-slate-600">{shortenAddress(MERCHANT_ADDRESS)}</span>
                  <button onClick={copyAddress} className="ml-2 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md">
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-blue-500 mt-3">Only send Ritual {CURRENCY_SYMBOL} to this address</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button onClick={handlePay} disabled={insufficientBalance || cartTotal <= 0} className="btn-primary w-full">
              Pay ${grandTotal.toFixed(2)} {CURRENCY_SYMBOL}
            </button>
          </div>
        )}

        {/* Step 2: Paying */}
        {step === 'pay' && (
          <div className="space-y-4">
            <div className={`card p-6 border-2 ${isSuccess ? 'border-emerald-200 bg-emerald-50' : sendError ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
              {isPending && (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-blue-900">Waiting for wallet...</p>
                  <p className="text-xs text-blue-600 mt-1">Confirm the transaction in your wallet</p>
                </div>
              )}
              {isConfirming && (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-blue-900">Confirming on Ritual...</p>
                  <p className="text-xs text-blue-600 mt-1">Usually takes &lt;1 second</p>
                </div>
              )}
              {sendError && (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-red-900">Payment Failed</p>
                  <p className="text-xs text-red-600 mt-1">{sendError.message?.slice(0, 120)}</p>
                </div>
              )}
            </div>

            {sendError && (
              <div className="flex gap-3">
                <button onClick={() => setStep('review')} className="btn-secondary flex-1">Back</button>
                <button onClick={handlePay} className="btn-primary flex-1">Retry</button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Done - Receipt */}
        {step === 'done' && (() => {
          const completedOrder = orders.find(o => o.id === orderId);
          if (!completedOrder) return null;
          return (
            <PaymentReceipt
              order={completedOrder}
              txHash={hash || undefined}
              onTrack={() => navigate('/shop/track')}
              onClose={() => navigate('/shop')}
            />
          );
        })()}

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="px-6 pt-6 pb-2 text-center relative">
                <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
                <h2 className="text-xl font-extrabold text-slate-900">Scan to Pay</h2>
                <p className="text-sm text-slate-400 mt-1">Scan QR code with your wallet app</p>
              </div>

              <div className="px-6 py-4 flex justify-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-200">
                  <QRCodeSVG
                    value={paymentURI}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="px-6 pb-2 text-center">
                <p className="text-xs text-slate-400 mb-2">Send <span className="font-bold text-slate-900">${grandTotal.toFixed(2)} {CURRENCY_SYMBOL}</span> to:</p>
                <p className="text-[11px] text-slate-400 mb-1">Only send <span className="font-semibold">Ritual</span> assets to this address</p>
              </div>

              <div className="px-6 pb-2">
                <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">Merchant Address</p>
                    <p className="text-[11px] font-mono text-slate-500 break-all">{MERCHANT_ADDRESS}</p>
                  </div>
                  <button onClick={copyAddress} className="flex-shrink-0 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg">
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-blue-700">Network: Ritual (Chain {CHAIN_ID})</p>
                  <p className="text-[10px] text-blue-500 mt-1">Token: {CURRENCY_SYMBOL} · Gas paid in native Ritual</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


