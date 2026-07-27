import { useSplitGroups } from '../../hooks/useSplitGroups';
import { useSendRitual } from '../../hooks/useOnChain';
import { useAccount } from 'wagmi';
import { formatCurrency, formatTime } from '../../utils/format';
import { useNavigate } from 'react-router-dom';
import WalletConnect from '../../components/WalletConnect';
import { Users, Plus, Receipt, Wallet, Check, ExternalLink, Clock } from 'lucide-react';


export default function SplitGroups() {
  const { groups, expenses, getGroupTotal } = useSplitGroups();
  const { isConnected } = useAccount();
  const { hash, isPending, isConfirming, isSuccess } = useSendRitual();
  const navigate = useNavigate();


  if (!isConnected) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Split Groups</h1>
          <p className="text-sm text-slate-400 mb-8">Manage shared expenses with on-chain settlement</p>
          <div className="card p-8 text-center max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Wallet</h3>
            <p className="text-sm text-slate-500 mb-5">Connect to manage split groups and settle on Ritual testnet.</p>
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
            <h1 className="text-2xl font-extrabold text-slate-900">Split Groups</h1>
            <p className="text-sm text-slate-400">Manage shared expenses — settle on-chain with RITUAL</p>
          </div>
          <button onClick={() => navigate('/split/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>

        {/* Settlement status */}
        {(isPending || isConfirming || isSuccess) && (
          <div className={`card p-4 mb-4 border-2 ${isSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
            {isPending && <p className="text-sm text-blue-900 font-medium">⏳ Confirm settlement in MetaMask...</p>}
            {isConfirming && <p className="text-sm text-blue-900 font-medium">⏳ Confirming on Ritual testnet...</p>}
            {isSuccess && (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-emerald-900 font-medium">Settlement confirmed!</p>
                {hash && <a href={`https://explorer.ritualfoundation.org/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a>}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {groups.map(group => {
            const groupExpenses = expenses.filter(e => e.groupId === group.id);
            const total = getGroupTotal(group.id);
            const unsettled = groupExpenses.filter(e => !e.settled);

            return (
              <div key={group.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Users className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{group.name}</h3>
                      <p className="text-xs text-slate-400">{group.members.length} members · {groupExpenses.length} expenses · {formatTime(group.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="flex items-center gap-1 mb-4">
                  {group.members.map((m, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg text-[11px] font-medium text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[8px] font-bold text-white">
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      {m.name}
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400">Total</p>
                    <p className="text-base font-bold text-slate-900">{formatCurrency(total)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-blue-600">Per Person</p>
                    <p className="text-base font-bold text-blue-700">{formatCurrency(total / group.members.length)}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-amber-600">Unsettled</p>
                    <p className="text-base font-bold text-amber-700">{unsettled.length}</p>
                  </div>
                </div>

                {/* Recent Expenses */}
                {groupExpenses.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expenses</p>
                    <div className="space-y-2">
                      {groupExpenses.slice(0, 5).map(exp => (
                        <div key={exp.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <Receipt className="w-4 h-4 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{exp.description}</p>
                            <p className="text-[10px] text-slate-400">Paid by {exp.paidBy} · Split {exp.splitAmong.length} ways · {formatTime(exp.timestamp)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(exp.amount)}</p>
                            {exp.settled ? (
                              <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Settled
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settlement Section */}
                {unsettled.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Settlements Needed</p>
                    <div className="space-y-2">
  
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


