import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useRitualBalance } from '../hooks/useOnChain';
import { useRecentTransactions } from '../hooks/useTransactions';
import WalletConnect from '../components/WalletConnect';
import { CURRENCY_SYMBOL, EXPLORER_URL, FAUCET_URL, NETWORK_NAME, RPC_HTTP_URL } from '../config/network';
import {
  Send,
  QrCode,
  ExternalLink,
  Wallet,
  Activity,
  Sparkles,
  Shield,
  Zap,
  Rocket,
} from 'lucide-react';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { balance, isLoading } = useRitualBalance();
  const { transactions, loading: txLoading } = useRecentTransactions(20);
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-r from-orange-600 to-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl font-extrabold text-white mb-2">THE DAILY CUP</h1>
          <p className="text-orange-100 text-sm mb-8">Merchant coffee flow rebuilt for Ritual-native payments and builder onboarding.</p>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-xl">
            <div className="flex items-center justify-between mb-1">
              <p className="text-orange-100 text-xs">Native Ritual Balance</p>
              {isConnected && <span className="text-[10px] text-emerald-300 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" /> Live on-chain</span>}
            </div>
            <p className="text-3xl font-extrabold text-white mb-4">
              {isConnected ? (isLoading ? '...' : `${balance.toFixed(4)} ${CURRENCY_SYMBOL}`) : '--'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => navigate('/send')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors">
                <Send className="w-4 h-4" /> Send
              </button>
              <button onClick={() => navigate('/receive')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors">
                <QrCode className="w-4 h-4" /> Receive
              </button>
              <button onClick={() => navigate('/ritual')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors">
                <Sparkles className="w-4 h-4" /> Ritual Lab
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!isConnected && (
          <div className="card p-6 border-2 border-dashed border-orange-200 bg-orange-50/60 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Wallet className="w-10 h-10 text-orange-400" />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-sm font-bold text-slate-900">Connect Ritual wallet to get started</h3>
                <p className="text-xs text-slate-500">
                  Add Ritual, claim faucet funds, and try the storefront with native {CURRENCY_SYMBOL}. 
                  <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline ml-1">Open faucet</a>
                </p>
              </div>
              <WalletConnect />
            </div>
          </div>
        )}

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Ritual activity
            </h2>
            {isConnected && address && (
              <a href={`${EXPLORER_URL}/address/${address}`} target="_blank" rel="noreferrer" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                View in explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Connect wallet to view activity</p>
            </div>
          ) : txLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading Ritual activity...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No indexed activity yet</p>
              <p className="text-xs text-slate-400 mt-1">Use Send/Checkout or inspect your wallet in Ritual Explorer.</p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <div className="card p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-500" />
            <div><p className="text-xs font-bold text-slate-700">{NETWORK_NAME}</p><p className="text-[10px] text-slate-400">AI-native execution layer</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <div><p className="text-xs font-bold text-slate-700">Native gas</p><p className="text-[10px] text-slate-400">All payments settle in {CURRENCY_SYMBOL}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-500" />
            <div><p className="text-xs font-bold text-slate-700">RPC ready</p><p className="text-[10px] text-slate-400">{RPC_HTTP_URL}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

