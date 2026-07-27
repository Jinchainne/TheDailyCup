import { useContacts } from '../hooks/useContacts';
import { useToast } from '../components/UI';
import { useState } from 'react';
import { isAddress } from 'viem';
import { UserPlus, Trash2, Copy, Check, Search } from 'lucide-react';

export default function Contacts() {
  const { contacts, addContact, removeContact } = useContacts();
  const { showToast, ToastUI } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!name || !address) return;
    if (!isAddress(address)) { showToast('Invalid address', 'error'); return; }
    addContact(name, address);
    showToast('Contact added!');
    setName(''); setAddress(''); setShowForm(false);
  };

  const handleCopy = (addr: string, id: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Contacts</h1>
            <p className="text-sm text-slate-400">{contacts.length} saved contacts</p>
          </div>
          <button onClick={() => { setShowForm(true); setName(''); setAddress(''); }} className="btn-primary">
            <UserPlus className="w-4 h-4" /> Add Contact
          </button>
        </div>

        {showForm && (
          <div className="card p-5 mb-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add New Contact</h3>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Contact name" />
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="0x... wallet address" className="font-mono text-sm" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSubmit} disabled={!name || !address} className="btn-primary flex-1">Add Contact</button>
              </div>
            </div>
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search contacts..." className="pl-11" />
        </div>

        <div className="card divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No contacts yet</p>
              <p className="text-xs text-slate-300 mt-1">Add contacts to quickly send RITUAL</p>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{c.address}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCopy(c.address, c.id)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors">
                  {copiedId === c.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={() => { removeContact(c.id); showToast('Contact removed'); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {ToastUI}
      </div>
    </div>
  );
}

