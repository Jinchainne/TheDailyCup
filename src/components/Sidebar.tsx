import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Send, QrCode, Clock, Users, Receipt, 
  Globe, ArrowLeftRight, Settings, Wallet, Landmark
} from 'lucide-react';

const sections = [
  {
    label: 'BANKING',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/send', icon: Send, label: 'Send Money' },
      { path: '/receive', icon: QrCode, label: 'Receive' },
      { path: '/history', icon: Clock, label: 'History' },
    ]
  },
  {
    label: 'SPLIT',
    items: [
      { path: '/split', icon: Users, label: 'Groups' },
      { path: '/split/new', icon: Receipt, label: 'New Expense' },
    ]
  },
  {
    label: 'REMIT',
    items: [
      { path: '/remit', icon: Globe, label: 'Transfer' },
      { path: '/remit/history', icon: ArrowLeftRight, label: 'FX History' },
    ]
  },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-white border-r border-slate-200 flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <NavLink to="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">The Daily Cup</h1>
            <p className="text-[10px] text-slate-400 font-medium">Merchant tools on Ritual</p>
          </div>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-5' : 'mt-1'}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">{section.label}</p>
            {section.items.map(item => {
              const active = location.pathname === item.path;
              return (
                <NavLink key={item.path} to={item.path} onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-[13px] font-medium transition-all ${
                    active 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2 px-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
          <span className="text-[11px] text-slate-500">Ritual Testnet connected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-600">
            <Landmark className="w-3.5 h-3.5" />
            Chain 1979
          </div>
          <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

