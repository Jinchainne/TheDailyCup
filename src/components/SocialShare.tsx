import { useState, useCallback } from 'react';
import { Share2, Link2, X, Check } from 'lucide-react';

const FACEBOOK_ICON = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const ZALO_ICON = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.93 1.73 5.5 4.38 7.17L5.5 21l3.28-1.72c1.08.28 2.22.44 3.44.44h.02c5.52 0 10.26-3.82 10.26-8.5S17.74 2 12.22 2H12z" />
  </svg>
);

const TWITTER_ICON = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function SocialShare() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = 'The Daily Cup | Ritual-native cafe demo';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const openShare = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    setOpen(false);
  }, []);

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
      {/* Popup */}
      {open && (
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 mb-1 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-2 py-1 mb-1">
            Share
          </div>
          <button
            onClick={() => openShare(facebookUrl)}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <span className="text-[#1877F2]"><FACEBOOK_ICON /></span>
            Facebook
          </button>
          <button
            onClick={() => openShare(zaloUrl)}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <span className="text-[#0068FF]"><ZALO_ICON /></span>
            Zalo
          </button>
          <button
            onClick={() => openShare(twitterUrl)}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="text-black"><TWITTER_ICON /></span>
            Twitter / X
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-slate-800 text-white rotate-45'
            : 'bg-amber-600 text-white hover:bg-amber-700 hover:shadow-xl'
        }`}
        aria-label="Share"
      >
        {open ? <X size={18} /> : <Share2 size={18} />}
      </button>
    </div>
  );
}

