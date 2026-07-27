import { useToast } from '../components/UI';
import { formatCurrency, shortenAddress } from '../utils/format';
import { useSendRitual } from '../hooks/useOnChain';
import { useContacts } from '../hooks/useContacts';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import WalletConnect from '../components/WalletConnect';
import { Send as SendIcon, Search, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Send() {
  const { contacts } = useContacts();
  const { isConnected } = useAccount();
  const { send, hash, isPending, isConfirming, isSuccess, error: sendError } = useSendRitual();
  const { showToast, ToastUI } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'recipient' | 'amount' | 'confirm'>('recipient');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.address.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSend = () => {
    if (!address || !amount) return;
    send(address, amount);
    setStep('confirm');
  };

  if (!isConnected) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Send Money</h1>
          <p className="text-sm text-slate-400 mb-8">Transfer RITUAL on Ritual Testnet</p>
          <div className="card p-8 text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
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
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Send Money</h1>
        <p className="text-sm text-slate-400 mb-6">Transfer RITUAL on Ritual Testnet</p>

        <div className="max-w-lg mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-1 mb-6">
            {['Recipient', 'Amount', 'Confirm'].map((label, i) => {
              const active = i === 0 || (i === 1 && step !== 'recipient') || (i === 2 && step === 'confirm');
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {active && i < (step === 'confirm' ? 3 : step === 'amount' ? 2 : 1) ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs ml-2 font-medium ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                  {i < 2 && <div className={`flex-1 h-0.5 mx-2 rounded ${active ? 'bg-blue-200' : 'bg-slate-100'}`} />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Recipient */}
          {step === 'recipient' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search contacts or paste address..." className="pl-11" />
              </div>

              {/* Saved contacts */}
              {filtered.length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Saved Contacts</p>
                  <div className="space-y-1">
                    {filtered.map(c => (
                      <button key={c.id} onClick={() => { setAddress(c.address); setStep('amount'); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{shortenAddress(c.address)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual paste */}
              <div className="card p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {filtered.length > 0 ? 'Or Enter Address' : 'Recipient Address'}
                </p>
                <div className="flex gap-2">
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="0x... paste any Ritual Testnet address" className="flex-1 font-mono text-sm" />
                  <button onClick={() => { if (isAddress(address)) setStep('amount'); else showToast('Invalid address', 'error'); }} disabled={!address} className="btn-primary !px-5">Next</button>
                </div>
              </div>

              {/* Add contact link */}
              <p className="text-xs text-slate-400 text-center">
                Need to save a contact? <button onClick={() => navigate('/contacts')} className="text-blue-500 hover:underline">Manage contacts</button>
              </p>
            </div>
          )}

          {/* Step 2: Amount */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div className="card p-6 text-center">
                <p className="text-xs text-slate-400 mb-6">Sending to <span className="font-mono font-bold text-slate-700">{shortenAddress(address)}</span></p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-slate-900">$</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                    className="!border-0 !bg-transparent !text-center !text-4xl !font-extrabold !text-slate-900 !p-0 !w-48 focus:!shadow-none" />
                </div>
                <p className="text-sm text-slate-400">RITUAL</p>
              </div>
              <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="Note (optional)" />
              <div className="flex gap-3">
                <button onClick={() => setStep('recipient')} className="btn-secondary flex-1">Back</button>
                <button onClick={() => { if (parseFloat(amount) > 0) setStep('confirm'); }} disabled={!amount || parseFloat(amount) <= 0} className="btn-primary flex-1">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm + Sign */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Confirm Transaction</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-xs text-slate-500">To</span><span className="text-sm font-mono text-slate-900">{shortenAddress(address)}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-500">Amount</span><span className="text-sm font-bold text-slate-900">{formatCurrency(parseFloat(amount))}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-500">Network</span><span className="text-sm text-slate-700">Ritual Testnet (1979)</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-500">Fee</span><span className="text-sm text-emerald-600">~$0.01</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-500">Finality</span><span className="text-sm text-slate-700">&lt;1 second</span></div>
                </div>
              </div>

              {/* TX Status */}
              {(isPending || isConfirming || isSuccess || sendError) && (
                <div className={`card p-4 border-2 ${isSuccess ? 'border-emerald-200 bg-emerald-50' : sendError ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                  {isPending && <p className="text-sm text-blue-900 font-medium">Waiting for MetaMask...</p>}
                  {isConfirming && <p className="text-sm text-blue-900 font-medium">Confirming on Ritual Testnet...</p>}
                  {isSuccess && <div className="flex items-center gap-2"><Check className="w-5 h-5 text-emerald-500" /><span className="text-sm text-emerald-900 font-medium">Confirmed!</span>
                    {hash && <a href={`https://explorer.ritualfoundation.org/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">Ritual Explorer <ExternalLink className="w-3 h-3" /></a>}
                  </div>}
                  {sendError && <p className="text-sm text-red-900 font-medium">Failed: {sendError.message?.slice(0, 100)}</p>}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('amount')} disabled={isPending || isConfirming} className="btn-secondary flex-1">Back</button>
                {!isSuccess && !sendError && (
                  <button onClick={handleSend} disabled={isPending || isConfirming} className="btn-primary flex-1">
                    {isPending ? 'Confirm in MetaMask...' : isConfirming ? 'Confirming...' : <><SendIcon className="w-4 h-4" /> Sign & Send</>}
                  </button>
                )}
                {isSuccess && <button onClick={() => { setStep('recipient'); setAddress(''); setAmount(''); setMemo(''); }} className="btn-primary flex-1">Send Another</button>}
              </div>
            </div>
          )}
        </div>
        {ToastUI}
      </div>
    </div>
  );
}


