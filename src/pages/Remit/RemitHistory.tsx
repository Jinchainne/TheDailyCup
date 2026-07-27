import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAccount } from 'wagmi';
import WalletConnect from '../../components/WalletConnect';
import { formatCurrency, formatTime } from '../../utils/format';
import { Globe, ArrowRight, ExternalLink, Wallet } from 'lucide-react';

interface RemitRecord {
  id: string;
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  recipient: string;
  country: string;
  rate: number;
  txHash: string;
  timestamp: number;
}

export default function RemitHistory() {
  const { isConnected } = useAccount();
  const [remits] = useLocalStorage<RemitRecord[]>('remits', []);

  const totalSent = remits.reduce((sum, r) => sum + r.fromAmount, 0);

  if (!isConnected) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">FX History</h1>
          <div className="card p-8 text-center max-w-md mx-auto mt-8">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Wallet</h3>
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">FX History</h1>
        <p className="text-sm text-slate-400 mb-6">{remits.length} transfers · {formatCurrency(totalSent)} sent</p>

        {remits.length === 0 ? (
          <div className="card p-12 text-center">
            <Globe className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm text-slate-500">No transfers yet</p>
            <a href="/remit" className="text-sm text-blue-500 hover:underline mt-2 inline-block">Send your first transfer →</a>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {remits.map(r => (
              <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">To {r.recipient}</p>
                    <p className="text-[11px] text-slate-400">{r.country} · {formatTime(r.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Sent</p>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(r.fromAmount)} {r.fromCurrency}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Received</p>
                    <p className="text-sm font-bold text-emerald-600">{r.toAmount.toLocaleString()} {r.toCurrency}</p>
                  </div>
                  <a href={`https://explorer.ritualfoundation.org/tx/${r.txHash}`} target="_blank" rel="noreferrer"
                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
                    Tx <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

