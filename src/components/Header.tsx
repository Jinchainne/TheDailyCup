import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import WalletConnect from './WalletConnect';

interface HeaderProps { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="pl-10 lg:pl-0">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {searchOpen ? (
          <input autoFocus onBlur={() => setSearchOpen(false)} placeholder="Search..." className="w-52 text-sm !py-2" />
        ) : (
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        )}
        <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-white" />
        </button>
        <WalletConnect />
      </div>
    </header>
  );
}

