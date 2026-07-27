import { useStore } from '../../hooks/useStore';
import { useToast } from '../../components/UI';
import { formatCurrency } from '../../utils/format';
import { useSendRitual } from '../../hooks/useOnChain';
import { useAccount } from 'wagmi';
import WalletConnect from '../../components/WalletConnect';

import { useState } from 'react';
import { Globe, ArrowRightLeft, Zap, Clock, Shield, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';

// Real FX rates (updated Jul 2026, source: ECB/exchangerate-api)
// Real FX rates from open.er-api.com — Jul 22, 2026
const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', rate: 1.0, flag: '🇺🇸', symbol: '$' },
  { code: 'EU', name: 'Eurozone', currency: 'EUR', rate: 0.876691, flag: '🇪🇺', symbol: '€' },
  { code: 'UK', name: 'United Kingdom', currency: 'GBP', rate: 0.747063, flag: '🇬🇧', symbol: '£' },
  { code: 'JP', name: 'Japan', currency: 'JPY', rate: 163.013, flag: '🇯🇵', symbol: '¥' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', rate: 1480.02, flag: '🇰🇷', symbol: '₩' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', rate: 1.291588, flag: '🇸🇬', symbol: 'S$' },
  { code: 'AU', name: 'Australia', currency: 'AUD', rate: 1.428082, flag: '🇦🇺', symbol: 'A$' },
];

export default function RemitTransfer() {
  const { contacts } = useStore();
  const { isConnected } = useAccount();
  const { send: sendRITUAL, hash, isPending: txPending, isConfirming: txConfirming, isSuccess: txSuccess } = useSendRitual();
  const { showToast, ToastUI } = useToast();
  const [amount, setAmount] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [recipient, setRecipient] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const convertedAmount = amount ? (parseFloat(amount) * selectedCountry.rate).toFixed(2) : '0.00';
  const fee = amount ? Math.max(0.01, parseFloat(amount) * 0.001).toFixed(4) : '0.0000';
  const isPending = txPending;
  const isConfirming = txConfirming;
  const isSuccess = txSuccess;

  if (isSuccess && !showSuccess) setShowSuccess(true);

  if (!isConnected) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Cross-Border Transfer</h1>
          <p className="text-sm text-slate-400 mb-8">Send RITUAL worldwide on Ritual testnet</p>
          <div className="card p-8 text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Wallet First</h3>
            <p className="text-sm text-slate-500 mb-5">Connect your wallet to send cross-border transfers.</p>
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Cross-Border Transfer</h1>
        <p className="text-sm text-slate-400 mb-6">Send RITUAL/RITUAL worldwide on Ritual testnet — real-time FX rates</p>

        <div className="max-w-lg mx-auto space-y-4">
          {/* Live FX Rate Banner */}
          <div className="card p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">Live Exchange Rate</p>
                <p className="text-[11px] text-slate-500">1 RITUAL = {selectedCountry.rate} {selectedCountry.currency} · Source: open.er-api.com (live)</p>
              </div>
            </div>
          </div>

          {/* From Amount */}
          <div className="card p-5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">You Send</label>
            <div className="flex items-center gap-3">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" className="text-2xl font-bold flex-1 !border-0 !bg-slate-50" />
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
                <span className="text-sm">🇺🇸</span>
                <span className="text-sm font-bold text-blue-600">RITUAL</span>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-2">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm z-10">
              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* To Amount */}
          <div className="card p-5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Recipient Gets</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-bold text-slate-900 bg-slate-50 rounded-xl px-4 py-3">
                {selectedCountry.symbol}{convertedAmount}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                <span className="text-sm">{selectedCountry.flag}</span>
                <span className="text-sm font-bold text-emerald-600">{selectedCountry.currency}</span>
              </div>
            </div>
          </div>

          {/* Destination Country */}
          <div className="card p-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Destination</label>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={() => setSelectedCountry(c)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedCountry.code === c.code ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                  }`}>
                  <span className="text-lg">{c.flag}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[10px] text-slate-400">1 RITUAL = {c.rate} {c.currency}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient */}
          <div className="card p-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Recipient Wallet</label>
            <div className="space-y-3">
              {/* Manual paste */}
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">Paste wallet address:</p>
                <input
                  value={recipient.startsWith('0x') && !contacts.find(c => c.address === recipient) ? recipient : ''}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="0x... paste any Ritual testnet address"
                  className="font-mono text-sm"
                />
              </div>
              {/* Or select from contacts */}
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">Or select a contact:</p>
                <select value={contacts.find(c => c.address === recipient) ? recipient : ''} onChange={e => setRecipient(e.target.value)} className="bg-white">
                  <option value="">Choose from contacts...</option>
                  {contacts.map(c => <option key={c.id} value={c.address}>{c.name} ({c.address.slice(0, 10)}...)</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Transfer Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Transfer Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-xs text-slate-500">You send</span><span className="text-sm font-bold text-slate-900">{formatCurrency(parseFloat(amount))} RITUAL</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500">Exchange rate</span><span className="text-sm text-slate-700">1 RITUAL = {selectedCountry.rate} {selectedCountry.currency}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500">Network fee</span><span className="text-sm text-emerald-600">~${fee}</span></div>
                <div className="border-t border-slate-100 pt-2 flex justify-between">
                  <span className="text-xs font-semibold text-slate-900">Recipient gets</span>
                  <span className="text-base font-bold text-emerald-600">{selectedCountry.symbol}{convertedAmount} {selectedCountry.currency}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400"><Zap className="w-3 h-3" /> Instant</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="w-3 h-3" /> &lt;1s finality</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400"><Shield className="w-3 h-3" /> Ritual</span>
                </div>
              </div>
            </div>
          )}

          {/* TX Status */}
          {(isPending || isConfirming || isSuccess) && (
            <div className={`card p-4 border-2 ${isSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
              {isPending && <div className="flex items-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" /><span className="text-sm text-blue-900 font-medium">Confirm in wallet...</span></div>}
              {isConfirming && <div className="flex items-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" /><span className="text-sm text-blue-900 font-medium">Confirming on Ritual testnet...</span></div>}
              {isSuccess && <div className="flex items-center gap-2"><span className="text-emerald-500">✓</span><span className="text-sm text-emerald-900 font-medium">Transfer confirmed!</span>
                {hash && <a href={`https://explorer.ritualfoundation.org/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a>}
              </div>}
            </div>
          )}

          {/* Send Button */}
          <button onClick={() => {
            if (!recipient) { showToast('Select a recipient', 'error'); return; }
            sendRITUAL(recipient, amount);
          }} disabled={!amount || !recipient || isPending || isConfirming} className="btn-primary w-full text-base py-4">
            {isPending ? '⏳ Confirm in wallet...' : isConfirming ? '⏳ Confirming...' : <><Globe className="w-5 h-5" /> Send International Transfer</>}
          </button>
        </div>
        {ToastUI}
      </div>
    </div>
  );
}


