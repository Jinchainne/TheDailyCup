import { StatusBadge } from '../components/UI';
import { formatTime } from '../utils/format';
import { useRecentTransactions } from '../hooks/useTransactions';
import { useAccount } from 'wagmi';
import WalletConnect from '../components/WalletConnect';
import { ArrowUpRight, ArrowDownLeft, Search, ExternalLink, Clock, Activity, Wallet } from 'lucide-react';
import { useState } from 'react';

export default function History() {
  const { address, isConnected } = useAccount();
  const { transactions, loading } = useRecentTransactions(50);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = transactions.filter(tx => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return tx.hash.toLowerCase().includes(q) || tx.to.toLowerCase().includes(q) || tx.from.toLowerCase().includes(q);
    }
    return true;
  });

  if (!isConnected) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Transaction History</h1>
          <p className="text-sm text-slate-400 mb-8">View your on-chain transactions</p>
          <div className="card p-8 text-center max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Wallet</h3>
            <p className="text-sm text-slate-500 mb-5">Connect to view your real transaction history on Ritual Testnet.</p>
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Transaction History</h1>
            <p className="text-sm text-slate-400">Real-time on-chain data from Ritual Testnet</p>
          </div>
          <a href={`https://explorer.ritualfoundation.org/address/${address}`} target="_blank" rel="noreferrer"
            className="btn-secondary !text-xs flex items-center gap-1">
            View on Ritual Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by hash, address..." className="pl-11" />
          </div>
          <div className="tab-bar">
            {['all', 'sent', 'received'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`tab-item ${filter === f ? 'active' : ''}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading transactions from Ritual Testnet...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No transactions found</p>
              <p className="text-xs text-slate-400 mt-1">Your on-chain transactions will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(tx => {
                const isSent = tx.from.toLowerCase() === address?.toLowerCase();
                return (
                  <div key={tx.hash} className="tx-row">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSent ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {isSent ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate font-mono">
                        {isSent ? `To ${tx.to}` : `From ${tx.from}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400">{formatTime(tx.timestamp)}</span>
                        <span className="text-[10px] text-slate-400">Block #{tx.blockNumber}</span>
                        <StatusBadge status={tx.status === 'success' ? 'completed' : tx.status} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[13px] font-bold ${isSent ? 'text-slate-900' : 'text-emerald-600'}`}>
                        {isSent ? '-' : '+'}{(Number(tx.value) / 1e18).toFixed(4)} RITUAL
                      </p>
                      <a href={`https://explorer.ritualfoundation.org/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                        className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-0.5 justify-end mt-0.5">
                        {tx.hash.slice(0, 10)}... <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

