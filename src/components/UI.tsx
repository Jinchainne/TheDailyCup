import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    completed: 'badge-success', pending: 'badge-warning', failed: 'badge-danger',
  };
  return <span className={`badge ${cls[status] || 'badge-info'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

export function Avatar({ name, size = 'md', color }: { name: string; size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const sizes: Record<string, string> = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs', lg: 'w-14 h-14 text-base' };
  const bg = color || 'bg-gradient-to-br from-blue-500 to-cyan-500';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return <div className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}>{initials}</div>;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SuccessModal({ open, onClose, txHash, amount, to }: { open: boolean; onClose: () => void; txHash?: string; amount: string; to: string }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-8 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Sent!</h3>
        <p className="text-lg font-semibold text-blue-600 mb-1">{amount}</p>
        <p className="text-sm text-slate-500 mb-5">to {to}</p>
        {txHash && (
          <a href={`https://explorer.ritualfoundation.org/tx/${txHash}`} target="_blank" rel="noreferrer"
            className="text-xs text-blue-500 hover:text-blue-600 font-mono break-all underline">
            View on Ritual Explorer → {txHash.slice(0, 18)}...
          </a>
        )}
        <button onClick={onClose} className="btn-primary w-full mt-6">Done</button>
      </div>
    </div>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 className="animate-spin text-blue-500" style={{ width: size, height: size }} />;
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const ToastUI = toast ? (
    <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-sm font-medium ${
      toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {toast.message}
    </div>
  ) : null;
  return { showToast, ToastUI };
}

