import { useAccount } from 'wagmi';
import { useState } from 'react';
import { ExternalLink, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import WalletConnect from './WalletConnect';
import {
  CHAIN_ID,
  CHAIN_ID_HEX,
  CURRENCY_DECIMALS,
  CURRENCY_NAME,
  CURRENCY_SYMBOL,
  DOCS_URL,
  EXPLORER_URL,
  FAUCET_URL,
  NETWORK_NAME,
  RPC_HTTP_URL,
  SKILLS_URL,
} from '../config/network';

const RITUAL_NETWORK = {
  chainId: CHAIN_ID_HEX,
  chainName: NETWORK_NAME,
  nativeCurrency: { name: CURRENCY_NAME, symbol: CURRENCY_SYMBOL, decimals: CURRENCY_DECIMALS },
  rpcUrls: [RPC_HTTP_URL],
  blockExplorerUrls: [EXPLORER_URL],
};

export default function Onboarding() {
  const { isConnected } = useAccount();
  const [dismissed, setDismissed] = useState(false);
  const [addingNetwork, setAddingNetwork] = useState(false);

  if (dismissed || isConnected) return null;

  const addRitualNetwork = async () => {
    setAddingNetwork(true);
    try {
      await (window as any).ethereum?.request({
        method: 'wallet_addEthereumChain',
        params: [RITUAL_NETWORK],
      });
    } catch (err) {
      console.error('Failed to add Ritual network:', err);
    }
    setAddingNetwork(false);
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="card p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-white">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Get started on Ritual</h3>
                <p className="text-xs text-slate-500">
                  Add the network, claim faucet funds, and start paying or deploying on Ritual testnet.
                </p>
              </div>
            </div>
            <button onClick={() => setDismissed(true)} className="text-xs text-slate-400 hover:text-slate-600">
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">1</div>
                <span className="text-xs font-bold text-slate-900">Install wallet</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">MetaMask, Rabby, OKX, or another EVM wallet</p>
              <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                Download <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">2</div>
                <span className="text-xs font-bold text-slate-900">Add Ritual</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Chain ID: {CHAIN_ID}</p>
              <button onClick={addRitualNetwork} disabled={addingNetwork} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                {addingNetwork ? 'Adding...' : 'Add to wallet'} <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">3</div>
                <span className="text-xs font-bold text-slate-900">Claim faucet</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Get free testnet RITUAL</p>
              <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                Open faucet <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">4</div>
                <span className="text-xs font-bold text-slate-900">Connect wallet</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Pay, deploy, and explore the app</p>
              <WalletConnect />
            </div>
          </div>

          <div className="mt-4 p-4 bg-white rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ritual quick refs</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div><span className="text-slate-400">Chain ID:</span> <span className="font-mono font-bold text-slate-700">{CHAIN_ID}</span></div>
              <div><span className="text-slate-400">RPC:</span> <span className="font-mono text-slate-700">rpc.ritualfoundation.org</span></div>
              <div><span className="text-slate-400">Currency:</span> <span className="font-bold text-slate-700">RITUAL</span></div>
              <div><span className="text-slate-400">Explorer:</span> <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">explorer</a></div>
              <div><span className="text-slate-400">Faucet:</span> <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">faucet</a></div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-[11px]">
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">Docs</a>
              <a href={SKILLS_URL} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">Agent skills</a>
              <a href={EXPLORER_URL + '/agents'} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">Agents explorer</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

