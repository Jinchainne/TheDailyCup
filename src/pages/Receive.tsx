import { useAccount } from 'wagmi';
import { useToast } from '../components/UI';
import { Copy, Share2, QrCode as QrIcon, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import WalletConnect from '../components/WalletConnect';

export default function Receive() {
  const { address, isConnected } = useAccount();
  const { showToast, ToastUI } = useToast();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      showToast('Address copied!');
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Receive</h1>
          <p className="text-sm text-slate-400 mb-8">Connect your wallet to receive RITUAL</p>
          <div className="card p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Wallet First</h3>
            <p className="text-sm text-slate-500 mb-5">You need to connect your wallet to view your receive address.</p>
            <WalletConnect />
          </div>
        </div>
        {ToastUI}
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Receive</h1>
        <p className="text-sm text-slate-400 mb-6">Share your address to receive RITUAL</p>
        
        <div className="max-w-md mx-auto space-y-4">
          <div className="card p-6 text-center">
            <div className="bg-white p-4 rounded-2xl inline-block mb-5 border border-slate-100 shadow-sm">
              <QRCodeSVG value={address} size={200} bgColor="#ffffff" fgColor="#0f172a" level="H" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Your Wallet Address</h3>
            <p className="text-xs text-slate-400 mb-4">On Ritual testnet (Chain ID: 1979)</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
              <p className="font-mono text-xs text-slate-600 break-all">{address}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={copyAddress} className="btn-primary flex-1"><Copy className="w-4 h-4" /> Copy Address</button>
              <button className="btn-secondary flex-1"><Share2 className="w-4 h-4" /> Share</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center">
              <Wallet className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-[11px] text-slate-400">Accepted Asset</p>
              <p className="text-sm font-semibold text-slate-900">Native RITUAL</p>
            </div>
            <div className="card p-4 text-center">
              <QrIcon className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-[11px] text-slate-400">Network</p>
              <p className="text-sm font-semibold text-slate-900">Ritual testnet</p>
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-bold text-slate-900 mb-2">How to receive</p>
            <ol className="text-xs text-slate-500 space-y-2 list-decimal list-inside">
              <li>Share your wallet address or QR code with the sender</li>
              <li>Sender transfers RITUAL on Ritual testnet</li>
              <li>Transaction confirms in under 1 second</li>
              <li>Your balance updates automatically</li>
            </ol>
          </div>
        </div>
        {ToastUI}
      </div>
    </div>
  );
}

