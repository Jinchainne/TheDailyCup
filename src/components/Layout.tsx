import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { CHAIN_ID, DOCS_URL, EXPLORER_URL, FAUCET_URL } from '../config/network';

const AIChat = lazy(() => import('./AIChat'));
const SocialShare = lazy(() => import('./SocialShare'));
const Onboarding = lazy(() => import('./Onboarding'));
const RitualDinoGame = lazy(() => import('./RitualDinoGame'));

function WidgetLoader({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
      {label}
    </div>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>
      <Suspense fallback={null}>
        <AIChat />
        <SocialShare />
      </Suspense>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src="/logo.png" alt="The Daily Cup" className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-extrabold text-sm">THE DAILY CUP</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Fresh drinks, Ritual-native checkout, and a playful Ritual Lab for builders.</p>
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Shop</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/shop" className="hover:text-white transition-colors">Menu</a></li>
                <li><a href="/shop/orders" className="hover:text-white transition-colors">My Orders</a></li>
                <li><a href="/shop/track" className="hover:text-white transition-colors">Track Order</a></li>
                <li><a href="/ritual" className="hover:text-white transition-colors">Ritual Lab</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Ritual</h4>
              <ul className="space-y-2 text-xs">
                <li>Native RITUAL payments</li>
                <li>Chain ID: {CHAIN_ID}</li>
                <li>AI-native testnet</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Resources</h4>
              <ul className="space-y-2 text-xs">
                <li><a href={DOCS_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Ritual Docs</a></li>
                <li><a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Block Explorer</a></li>
                <li><a href={FAUCET_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">RITUAL Faucet</a></li>
              </ul>
            </div>
          </div>
          <div className="mb-8">
            <Suspense fallback={<WidgetLoader label="Loading Ritual Runner..." />}>
              <RitualDinoGame />
            </Suspense>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-xs text-slate-500">&copy; 2026 The Daily Cup. Built for Ritual Testnet builders, payers, and players.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

