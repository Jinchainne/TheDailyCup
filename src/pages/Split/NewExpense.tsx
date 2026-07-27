import { useSplitGroups, type SplitMember } from '../../hooks/useSplitGroups';

import { useToast } from '../../components/UI';
import { formatCurrency } from '../../utils/format';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import WalletConnect from '../../components/WalletConnect';
import { Receipt, Users, DollarSign, Plus, X } from 'lucide-react';

export default function NewExpense() {
  const { groups, addGroup, addExpense } = useSplitGroups();
  const { isConnected } = useAccount();
  const { showToast, ToastUI } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'expense' | 'group'>('expense');
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('You');
  const [creating, setCreating] = useState(false);

  // New group form
  const [groupName, setGroupName] = useState('');
  const [newMembers, setNewMembers] = useState<SplitMember[]>([{ name: 'You', address: '' }]);
  const [memberName, setMemberName] = useState('');
  const [memberAddress, setMemberAddress] = useState('');

  const group = groups.find(g => g.id === selectedGroup);

  const handleCreateExpense = async () => {
    if (!description || !amount || !selectedGroup) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 500));
    addExpense({
      groupId: selectedGroup,
      description,
      amount: parseFloat(amount),
      paidBy,
      splitAmong: group?.members.map(m => m.name) || ['You'],
    });
    showToast('Expense created and split!');
    setCreating(false);
    navigate('/split');
  };

  const handleCreateGroup = async () => {
    if (!groupName || newMembers.length < 2) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 500));
    addGroup(groupName, newMembers);
    showToast('Group created!');
    setCreating(false);
    navigate('/split');
  };

  const addMember = () => {
    if (!memberName) return;
    setNewMembers(prev => [...prev, { name: memberName, address: memberAddress }]);
    setMemberName('');
    setMemberAddress('');
  };

  const removeMember = (idx: number) => {
    setNewMembers(prev => prev.filter((_, i) => i !== idx));
  };

  if (!isConnected) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">New Expense / Group</h1>
          <p className="text-sm text-slate-400 mb-8">Create expenses and groups</p>
          <div className="card p-8 text-center max-w-md mx-auto">
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
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">New Expense / Group</h1>
        <p className="text-sm text-slate-400 mb-6">Track expenses and split bills on Ritual Testnet</p>

        {/* Tab switcher */}
        <div className="tab-bar mb-6 max-w-xs">
          <button onClick={() => setTab('expense')} className={`tab-item flex-1 ${tab === 'expense' ? 'active' : ''}`}>New Expense</button>
          <button onClick={() => setTab('group')} className={`tab-item flex-1 ${tab === 'group' ? 'active' : ''}`}>New Group</button>
        </div>

        <div className="max-w-lg mx-auto space-y-4">
          {tab === 'expense' ? (
            <>
              {/* Select Group */}
              <div className="card p-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Select Group</label>
                <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="bg-white">
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.members.length} members)</option>)}
                </select>
              </div>

              {/* Expense Details */}
              <div className="card p-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Expense Details</label>
                <div className="space-y-3">
                  <div className="relative">
                    <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this for? (e.g., Dinner, Taxi)" className="pl-11" />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00 RITUAL" className="pl-11 text-lg font-bold" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">Paid by</label>
                    <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="bg-white">
                      {group?.members.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Split Preview */}
              {amount && group && (
                <div className="card p-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Split Equally</label>
                  <div className="space-y-2">
                    {group.members.map(m => (
                      <div key={m.name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                        <span className="text-sm text-slate-700">{m.name}</span>
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(parseFloat(amount) / group.members.length)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleCreateExpense} disabled={!description || !amount || creating} className="btn-primary w-full">
                {creating ? '⏳ Creating...' : <><Receipt className="w-4 h-4" /> Create Expense</>}
              </button>
            </>
          ) : (
            <>
              {/* New Group Form */}
              <div className="card p-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Group Name</label>
                <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g., Weekend Trip, Office Lunch" />
              </div>

              <div className="card p-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Members ({newMembers.length})</label>
                <div className="space-y-2 mb-4">
                  {newMembers.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[9px] font-bold text-white">
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{m.name}</p>
                        {m.address && <p className="text-[10px] text-slate-400 font-mono">{m.address.slice(0, 14)}...</p>}
                      </div>
                      {i > 0 && (
                        <button onClick={() => removeMember(i)} className="p-1 hover:bg-red-50 rounded-lg">
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Name" className="flex-1" />
                  <input value={memberAddress} onChange={e => setMemberAddress(e.target.value)} placeholder="0x... (optional)" className="flex-1 font-mono text-xs" />
                  <button onClick={addMember} disabled={!memberName} className="btn-secondary !px-3">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button onClick={handleCreateGroup} disabled={!groupName || newMembers.length < 2 || creating} className="btn-primary w-full">
                {creating ? '⏳ Creating...' : <><Users className="w-4 h-4" /> Create Group</>}
              </button>
            </>
          )}
        </div>
        {ToastUI}
      </div>
    </div>
  );
}

function Wallet(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;
}

