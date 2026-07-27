import { useState } from 'react';
import { useShop } from '../../hooks/useShop';
import { useSocial } from '../../hooks/useSocial';
import { useAccount } from 'wagmi';
import { Star, MessageSquare, Send, Search } from 'lucide-react';

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' | 'lg' }) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(i)}
          className={`transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'}`}>
          <Star className={`${sz} ${i <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ShopFeedback() {
  const { products } = useShop();
  const { addComment, comments } = useSocial();
  const { address } = useAccount();

  const [selectedProduct, setSelectedProduct] = useState('');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [filterProduct, setFilterProduct] = useState('all');

  const displayComments = filterProduct === 'all'
    ? [...comments].sort((a, b) => b.timestamp - a.timestamp)
    : comments.filter(c => c.productId === filterProduct).sort((a, b) => b.timestamp - a.timestamp);

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  const handleSubmit = () => {
    if (!address) return alert('Please connect your wallet first');
    if (!selectedProduct) return alert('Please select a product');
    if (rating === 0) return alert('Please select a star rating');
    if (!text.trim()) return alert('Please write your feedback');
    addComment(selectedProduct, address, text.trim(), rating);
    setText('');
    setRating(0);
    setSelectedProduct('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <MessageSquare className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">Customer Feedback</h1>
          </div>
          <p className="text-sm text-slate-500 ml-9">Share your experience and help us improve our products</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-5 gap-6">
        {/* Left: Write Feedback */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-32">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Write Feedback
            </h2>

            {submitted && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                ✅ Thank you for your feedback!
              </div>
            )}

            {/* Select Product */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Product</label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-slate-200 text-sm font-medium bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none">
                <option value="">-- Choose a product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.price.toFixed(2)} RITUAL)</option>
                ))}
              </select>
            </div>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your Rating</label>
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  {rating === 1 ? '😞 Poor' : rating === 2 ? '😐 Fair' : rating === 3 ? '🙂 Good' : rating === 4 ? '😊 Great' : '🤩 Excellent'}
                </p>
              )}
            </div>

            {/* Comment Text */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your Feedback</label>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="Tell us what you think about this product..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none" />
            </div>

            {/* Wallet status */}
            {!address && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                ⚠️ Connect your wallet to submit feedback
              </div>
            )}

            <button onClick={handleSubmit} disabled={!address}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Send className="w-4 h-4" />
              Submit Feedback
            </button>
          </div>
        </div>

        {/* Right: All Reviews */}
        <div className="lg:col-span-3">
          {/* Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-12 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:border-amber-400 outline-none" />
              </div>
              <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
                className="h-12 px-4 w-auto min-w-[160px] rounded-lg border border-slate-200 text-sm font-medium bg-white focus:border-amber-400 outline-none">
                <option value="all">All Products</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-slate-900">{comments.length}</p>
                <p className="text-[11px] text-slate-400">Total Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-amber-500">
                  {comments.length > 0 ? (comments.reduce((s, c) => s + c.rating, 0) / comments.length).toFixed(1) : '0.0'}
                </p>
                <p className="text-[11px] text-slate-400">Average Rating</p>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = comments.filter(c => c.rating === star).length;
                  const pct = comments.length > 0 ? (count / comments.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-slate-500 w-3">{star}</span>
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {displayComments.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No feedback yet</p>
                <p className="text-xs text-slate-300 mt-1">Be the first to share your thoughts!</p>
              </div>
            )}
            {displayComments.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900">{getProductName(c.productId)}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                        {c.productId}
                      </span>
                    </div>
                    <StarRating value={c.rating} size="sm" />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{c.text}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  by <span className="font-mono">{c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

