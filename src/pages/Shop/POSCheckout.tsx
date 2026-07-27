import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useShop, MERCHANT_ADDRESS, generateOrderCode, type DeliveryAddress } from '../../hooks/useShop';
import { useAgent } from '../../hooks/useAgent';
import { useSendRitual, useRitualBalance } from '../../hooks/useOnChain';
import { formatCurrency } from '../../utils/format';
import { CHAIN_ID, CURRENCY_SYMBOL, RPC_HTTP_URL } from '../../config/network';
import WalletConnect from '../../components/WalletConnect';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  MapPin,
  Truck,
  ArrowLeft,
  QrCode,
  AlertCircle,
  Wallet,
  Tag,
  X as XIcon,
  ShoppingCart,
} from 'lucide-react';
import PaymentReceipt from '../../components/PaymentReceipt';

async function fetchRitualBalance(address: string): Promise<number> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(RPC_HTTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest'],
        }),
      });
      const json = await resp.json();
      if (json.result) {
        return Number(BigInt(json.result)) / 1e18;
      }
      if (json.error?.code === -32011) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    } catch {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return 0;
}

type PaymentStatus = 'waiting' | 'confirmed' | 'timeout';

export default function POSCheckout() {
  const navigate = useNavigate();
  const { isConnected, address: walletAddress } = useAccount();
  const { cart, cartTotal, cartCount, clearCart, saveOrder, updateOrderStatus, orders, promoCode, promoDiscount, applyPromo, removePromo } = useShop();
  const { processOrder, dispatchDelivery } = useAgent();
  const { send, hash, isSuccess, error: sendError } = useSendRitual();
  const { balance } = useRitualBalance();
  const [step, setStep] = useState<'review' | 'qr' | 'wallet-pay' | 'done'>('review');
  const [, setOrderIdState] = useState('');
  const orderIdRef = useRef('');
  const [orderCode, setOrderCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('waiting');
  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [txHash, setTxHash] = useState('');
  const baselineRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [delivery, setDelivery] = useState<DeliveryAddress | null>(null);
  const [shippingFee, setShippingFee] = useState(1.5);
  const effectiveShipping = promoCode === 'FREESHIP' ? 0 : shippingFee;
  const effectiveDiscount = promoCode === 'FREESHIP' ? 0 : promoDiscount;
  const grandTotal = cartTotal - effectiveDiscount + effectiveShipping;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('arcbank_delivery');
      if (saved) setDelivery(JSON.parse(saved));
      const fee = sessionStorage.getItem('arcbank_shipping_fee');
      if (fee) setShippingFee(parseFloat(fee));
    } catch {}
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(MERCHANT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finalizeOrder = useCallback((id: string, explorerHash?: string) => {
    updateOrderStatus(id, 'confirmed', explorerHash);
    const itemNames = cart.map(i => i.product.name);
    processOrder(itemNames, grandTotal);
    if (delivery) dispatchDelivery(id, delivery.address);
    clearCart();
    sessionStorage.removeItem('arcbank_delivery');
    sessionStorage.removeItem('arcbank_shipping_fee');
    if (delivery) {
      setTimeout(() => updateOrderStatus(id, 'preparing'), 5000);
      setTimeout(() => updateOrderStatus(id, 'shipping'), 15000);
      setTimeout(() => updateOrderStatus(id, 'delivered'), 30000);
    }
  }, [cart, grandTotal, delivery, processOrder, dispatchDelivery, clearCart, updateOrderStatus]);

  const handleWalletPay = useCallback(() => {
    const id = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const code = generateOrderCode();
    setOrderIdState(id);
    orderIdRef.current = id;
    setOrderCode(code);
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
    setStep('wallet-pay');
  }, [cart, grandTotal, delivery, shippingFee, walletAddress, saveOrder, send]);

  useEffect(() => {
    if (isSuccess && step === 'wallet-pay') {
      const id = orderIdRef.current;
      finalizeOrder(id, hash);
      setStep('done');
    }
    if (sendError && step === 'wallet-pay') {
      updateOrderStatus(orderIdRef.current, 'cancelled');
    }
  }, [isSuccess, sendError, step, hash, finalizeOrder, updateOrderStatus]);

  const startPayment = useCallback(async () => {
    const id = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const code = generateOrderCode();
    setOrderIdState(id);
    orderIdRef.current = id;
    setOrderCode(code);
    setStep('qr');
    setPaymentStatus('waiting');
    setElapsed(0);

    saveOrder({
      id,
      code,
      items: cart,
      total: grandTotal,
      status: 'pending',
      timestamp: Date.now(),
      merchantAddress: MERCHANT_ADDRESS,
      customerWallet: 'QR Payment',
      delivery: delivery || undefined,
      shippingFee,
    });

    baselineRef.current = await fetchRitualBalance(MERCHANT_ADDRESS);

    pollRef.current = setInterval(async () => {
      const currentBalance = await fetchRitualBalance(MERCHANT_ADDRESS);
      const diff = currentBalance - baselineRef.current;

      if (diff >= grandTotal * 0.99) {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        setPaymentStatus('confirmed');
        const explorerHash = `ritual-${Date.now().toString(16)}`;
        setTxHash(explorerHash);
        finalizeOrder(id, explorerHash);
        setTimeout(() => setStep('done'), 1200);
      }
    }, 8000);

    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        clearInterval(timerRef.current as ReturnType<typeof setInterval>);
        setPaymentStatus('timeout');
      }
    }, 600000);
  }, [cart, grandTotal, delivery, shippingFee, saveOrder, finalizeOrder]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const paymentURI = `ethereum:${MERCHANT_ADDRESS}@${CHAIN_ID}?value=${(grandTotal * 1e18).toFixed(0)}`;

  if (cart.length === 0 && step !== 'done') {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Cart is empty</p>
          <button onClick={() => navigate('/shop')} className="btn-primary">Browse Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        {step === 'review' && (
          <div className="space-y-4">
            <button onClick={() => navigate('/shop')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-4 h-4" /> Back to Menu
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900">Order Summary</h1>

            {delivery && (
              <div className="card p-3 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-700">Delivery To</p>
                    <p className="text-sm text-blue-900">{delivery.address}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-4">
              <h3 className="text-sm font-bold mb-3">Items ({cartCount})</h3>
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product.id + (item.selectedSize || '') + (item.selectedTemp || '')} className="flex items-center gap-3">
                    <img src={item.product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.product.name}</p>
                      <div className="flex items-center gap-1.5">
                        {item.selectedSize && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{item.selectedSize}</span>}
                        {item.selectedTemp && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{item.selectedTemp}</span>}
                        <span className="text-xs text-slate-400">x{item.quantity}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold">${((item.unitPrice || item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-sm font-bold mb-3">Promo Code</h3>
              {promoCode ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">{promoCode}</span>
                  </div>
                  <button onClick={() => { removePromo(); setPromoMsg(null); }} className="text-slate-400 hover:text-red-500">
                    <XIcon className="w-4 h-4" />
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
              {promoMsg && <p className={`text-xs mt-2 ${promoMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>{promoMsg.text}</p>}
              <p className="text-[10px] text-slate-400 mt-2">Try: WELCOME10, SAVE5, FREESHIP, COFFEE20</p>
            </div>

            <div className="card p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><Tag className="w-3 h-3" /> Discount ({promoCode})</span>
                    <span className="text-emerald-600">-${effectiveDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1"><Truck className="w-3 h-3" /> Shipping</span>
                  <span className={effectiveShipping === 0 ? 'text-emerald-600' : 'text-blue-600'}>
                    {effectiveShipping === 0 ? 'FREE' : `$${effectiveShipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-extrabold text-blue-600">${grandTotal.toFixed(2)} {CURRENCY_SYMBOL}</span>
                </div>
              </div>
            </div>

            {isConnected && (
              <div className={`card p-3 ${grandTotal > balance ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <div className="flex justify-between text-sm">
                  <span className={grandTotal > balance ? 'text-red-700' : 'text-emerald-700'}>Your {CURRENCY_SYMBOL} Balance</span>
                  <span className={`font-bold ${grandTotal > balance ? 'text-red-700' : 'text-emerald-700'}`}>{formatCurrency(balance)}</span>
                </div>
                {grandTotal > balance && <p className="text-xs text-red-600 mt-1">Insufficient balance</p>}
              </div>
            )}

            {isConnected ? (
              <div className="space-y-3">
                <button onClick={handleWalletPay} disabled={grandTotal > balance} className="btn-primary w-full h-14 text-lg">
                  <Wallet className="w-5 h-5" /> Pay ${grandTotal.toFixed(2)} {CURRENCY_SYMBOL} from Wallet
                </button>
                <button onClick={startPayment} className="btn-secondary w-full h-12">
                  <QrCode className="w-4 h-4" /> Or Scan QR Code to Pay
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={startPayment} className="btn-primary w-full h-14 text-lg">
                  <QrCode className="w-5 h-5" /> Scan QR to Pay
                </button>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-2">Or connect wallet to pay directly</p>
                  <WalletConnect />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'qr' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Scan to Pay</h1>
              <p className="text-sm text-slate-400">Open your wallet app and scan the Ritual QR below</p>
            </div>

            <div className="card p-8 text-center">
              <div className="inline-block p-4 bg-white rounded-3xl shadow-lg border-4 border-slate-200">
                <QRCodeSVG value={paymentURI} size={240} level="H" includeMargin={true} />
              </div>

              <div className="mt-6">
                <p className="text-4xl font-extrabold text-slate-900">${grandTotal.toFixed(2)}</p>
                <p className="text-sm text-slate-400">{CURRENCY_SYMBOL} on Ritual</p>
              </div>

              <div className="mt-4 bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase">Send to</p>
                  <p className="text-xs font-mono text-slate-700 break-all">{MERCHANT_ADDRESS}</p>
                </div>
                <button onClick={copyAddress} className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg flex-shrink-0">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className={`card p-5 text-center border-2 ${paymentStatus === 'confirmed' ? 'border-emerald-300 bg-emerald-50' : paymentStatus === 'timeout' ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
              {paymentStatus === 'waiting' && (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-bold text-blue-900">Waiting for payment...</span>
                  </div>
                  <p className="text-xs text-blue-600">Monitoring Ritual for incoming {CURRENCY_SYMBOL}</p>
                  <p className="text-lg font-mono font-bold text-blue-700 mt-2">{formatTime(elapsed)}</p>
                </>
              )}
              {paymentStatus === 'confirmed' && (
                <>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-lg font-extrabold text-emerald-900">Payment Confirmed!</p>
                  <p className="text-sm text-emerald-600">${grandTotal.toFixed(2)} {CURRENCY_SYMBOL} received</p>
                </>
              )}
              {paymentStatus === 'timeout' && (
                <>
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-red-900">Payment Timeout</p>
                  <p className="text-xs text-red-600">No payment detected. Please try again.</p>
                  <button onClick={() => setStep('review')} className="btn-secondary mt-3">Try Again</button>
                </>
              )}
            </div>

            <div className="text-center text-xs text-slate-400">
              <p>Order: <span className="font-mono font-bold text-slate-600">{orderCode}</span></p>
              <p className="mt-1">Network: Ritual ({CHAIN_ID}) · Token: {CURRENCY_SYMBOL} · Native gas settlement</p>
            </div>
          </div>
        )}

        {step === 'wallet-pay' && (
          <div className="space-y-4">
            <div className={`card p-6 border-2 ${isSuccess ? 'border-emerald-200 bg-emerald-50' : sendError ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
              {!isSuccess && !sendError && (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-blue-900">Waiting for wallet...</p>
                  <p className="text-xs text-blue-600 mt-1">Confirm the {CURRENCY_SYMBOL} transfer in your wallet</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-3">${grandTotal.toFixed(2)} {CURRENCY_SYMBOL}</p>
                </div>
              )}
              {sendError && (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-red-900">Payment Failed</p>
                  <p className="text-xs text-red-600 mt-1">{sendError.message?.slice(0, 120)}</p>
                  <button onClick={() => setStep('review')} className="btn-secondary mt-4">Try Again</button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'done' && (() => {
          const completedOrder = orders.find(o => o.id === orderIdRef.current);
          if (!completedOrder) return null;
          return (
            <PaymentReceipt
              order={completedOrder}
              txHash={txHash || hash || undefined}
              onTrack={() => navigate('/shop/track')}
              onClose={() => navigate('/shop')}
            />
          );
        })()}
      </div>
    </div>
  );
}


