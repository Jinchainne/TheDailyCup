import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../hooks/useShop';
import { useSocial } from '../../hooks/useSocial';
import { useAccount } from 'wagmi';
import { ShoppingBag, Plus, Minus, Search, ShoppingCart, X, Heart, Star, Clock } from 'lucide-react';

const CATEGORY_LIST = [
  { name: 'All', icon: '🍽️' },
  { name: 'Hot Coffee', icon: '☕' },
  { name: 'Cold Coffee', icon: '🧊' },
  { name: 'Tea', icon: '🍵' },
  { name: 'Juice', icon: '🍊' },
  { name: 'Refreshers', icon: '🍹' },
  { name: 'Burgers', icon: '🍔' },
  { name: 'Chicken', icon: '🍗' },
  { name: 'Sandwiches', icon: '🥪' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Pasta', icon: '🍝' },
  { name: 'Sides', icon: '🍟' },
  { name: 'Breakfast', icon: '🥞' },
  { name: 'Bakery', icon: '🥐' },
  { name: 'Desserts', icon: '🍰' },
  { name: 'Drinks', icon: '🥤' },
  { name: 'Pho & Noodles', icon: '🍜' },
  { name: 'Rice', icon: '🍚' },
  { name: 'Hotpot', icon: '🫕' },
  { name: 'Viet Drinks', icon: '☕' },
  { name: 'Viet Desserts', icon: '🍮' },
];

function ProductCard({ product, cartItem, onAdd, onRemove, onRecentlyViewed }: any) {
  const { address } = useAccount();
  const { toggleWishlist, isWishlisted, getProductRating, getProductComments } = useSocial();
  const liked = isWishlisted(product.id);
  const rating = getProductRating(product.id);
  const commentCount = getProductComments(product.id).length;

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes?.[0]?.label
  );
  const [selectedTemp, setSelectedTemp] = useState<string | undefined>(
    product.temperatures?.[0]
  );

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;

  const handleCardClick = () => {
    if (onRecentlyViewed) onRecentlyViewed(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAdd(product, selectedSize, selectedTemp);
  };

  // Calculate display price with size modifier
  const displayPrice = (() => {
    let price = product.price;
    if (selectedSize && product.sizes) {
      const sizeDef = product.sizes.find((s: any) => s.label === selectedSize);
      if (sizeDef) price += sizeDef.priceAdd;
    }
    return price;
  })();

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all duration-300 relative ${isOutOfStock ? 'opacity-70' : ''}`}
    >
      {/* Stock Badge */}
      {isOutOfStock && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
          Out of Stock
        </div>
      )}
      {isLowStock && !isOutOfStock && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
          Only {product.stock} left
        </div>
      )}

      <div className="aspect-square overflow-hidden bg-slate-50 relative">
        <img src={product.image} alt={product.name} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button onClick={(e) => { e.stopPropagation(); if (address) toggleWishlist(product.id, address); }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${liked ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-400 hover:text-red-500'}`}>
          <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">{product.name}</h3>
        <p className="text-[11px] text-slate-400 leading-snug mb-1.5 line-clamp-2">{product.description}</p>

        {/* Size Selector */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-slate-400 font-medium">Size:</span>
            {product.sizes.map((size: any) => (
              <button
                key={size.label}
                onClick={(e) => { e.stopPropagation(); setSelectedSize(size.label); }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  selectedSize === size.label
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {size.label}{size.priceAdd > 0 ? ` +$${size.priceAdd.toFixed(2)}` : ''}
              </button>
            ))}
          </div>
        )}

        {/* Temperature Selector */}
        {product.temperatures && product.temperatures.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {product.temperatures.map((temp: string) => (
              <button
                key={temp}
                onClick={(e) => { e.stopPropagation(); setSelectedTemp(temp); }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  selectedTemp === temp
                    ? temp === 'Hot'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {temp === 'Hot' ? '🔥' : '🧊'} {temp}
              </button>
            ))}
          </div>
        )}

        {rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
            ))}
            <span className="text-[10px] text-slate-400 ml-1">({commentCount})</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-red-600">${displayPrice.toFixed(2)}</span>
          {cartItem ? (
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); onRemove(product.id); }}
                className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold w-6 text-center">{cartItem.quantity}</span>
              <button onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <button onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopMenu() {
  const navigate = useNavigate();
  const { products, cart, cartTotal, cartCount, addToCart, removeFromCart, recentlyViewed, addRecentlyViewed } = useShop();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCount = (cat: string) => cat === 'All' ? products.length : products.filter(p => p.category === cat).length;

  // Build recently viewed products list (preserving order, filtering out missing)
  const recentlyViewedProducts = recentlyViewed
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as typeof products;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-[calc(2.5rem+3.5rem)] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">THE DAILY CUP</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em]">Powered by Ritual</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-slate-50 rounded-lg border border-slate-200 px-3 py-1.5 w-48">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-xs ml-2 !p-0 !shadow-none !border-0" />
            </div>
            <button onClick={() => setShowCart(!showCart)}
              className="relative flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold">
              <ShoppingCart className="w-3.5 h-3.5" /> Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cart Dropdown */}
      {showCart && cartCount > 0 && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowCart(false)}>
          <div className="absolute top-24 right-4 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">Your Cart ({cartCount})</h3>
              <button onClick={() => setShowCart(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto scroll-hide">
              {cart.map(item => (
                <div key={item.product.id + (item.selectedSize || '') + (item.selectedTemp || '')} className="flex items-center gap-3">
                  <img src={item.product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {item.product.name}
                      {item.selectedSize && <span className="text-slate-400"> ({item.selectedSize})</span>}
                      {item.selectedTemp && <span className="text-slate-400"> · {item.selectedTemp}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">${(item.unitPrice || item.product.price).toFixed(2)} x {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold">${((item.unitPrice || item.product.price) * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100">
              <div className="flex justify-between mb-3">
                <span className="text-sm">Total</span>
                <span className="text-lg font-extrabold">${cartTotal.toFixed(2)} RITUAL</span>
              </div>
              <button onClick={() => { setShowCart(false); navigate('/shop/delivery'); }} className="btn-primary w-full">Checkout</button>
            </div>
          </div>
        </div>
      )}

      {/* Main: Sidebar + Grid */}
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-slate-100 hidden lg:block">
          <div className="sticky top-[calc(2.5rem+3.5rem+3.5rem)] p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Categories</p>
            <div className="space-y-0.5">
              {CATEGORY_LIST.map(cat => {
                const count = getCount(cat.name);
                if (count === 0 && cat.name !== 'All') return null;
                return (
                  <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      activeCategory === cat.name
                        ? 'bg-amber-50 text-amber-700 font-bold border-l-2 border-amber-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    <span className="flex items-center gap-2"><span>{cat.icon}</span> {cat.name}</span>
                    <span className="text-[10px] text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
            {cartCount > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Your Cart ({cartCount})</p>
                {cart.map(item => (
                  <div key={item.product.id + (item.selectedSize || '') + (item.selectedTemp || '')} className="flex items-center justify-between text-[11px] py-1">
                    <span className="truncate flex-1 text-slate-700">
                      {item.product.name}
                      {item.selectedSize && <span className="text-slate-400"> ({item.selectedSize})</span>}
                    </span>
                    <span className="text-slate-400 ml-2">x{item.quantity}</span>
                    <span className="font-bold ml-2">${((item.unitPrice || item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between">
                  <span className="text-xs font-medium">Total</span>
                  <span className="text-sm font-extrabold text-amber-700">${cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => navigate('/shop/delivery')} className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg mt-2 hover:bg-slate-800">Checkout</button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Grid */}
        <div className="flex-1 min-w-0 p-4 sm:p-6">
          <div className="lg:hidden relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..." className="pl-10 w-full h-10 rounded-lg text-sm" />
          </div>
          <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto scroll-hide pb-1">
            {CATEGORY_LIST.filter(c => c.name === 'All' || getCount(c.name) > 0).map(cat => (
              <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${activeCategory === cat.name ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400">Home &gt; <span className="text-slate-700 font-medium">{activeCategory}</span></p>
            <p className="text-xs text-slate-500"><span className="font-bold text-slate-900">{filtered.length}</span> products</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product}
                cartItem={cart.find(c => c.product.id === product.id)}
                onAdd={addToCart} onRemove={removeFromCart}
                onRecentlyViewed={addRecentlyViewed} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-400">No products found</p>
            </div>
          )}

          {/* Recently Viewed Section */}
          {recentlyViewedProducts.length > 0 && (
            <div className="mt-10 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900">Recently Viewed</h2>
                <span className="text-[10px] text-slate-400">({recentlyViewedProducts.length})</span>
              </div>
              <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
                {recentlyViewedProducts.map(product => (
                  <div key={product.id} className="flex-shrink-0 w-40">
                    <ProductCard
                      product={product}
                      cartItem={cart.find(c => c.product.id === product.id)}
                      onAdd={addToCart}
                      onRemove={removeFromCart}
                      onRecentlyViewed={addRecentlyViewed}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden z-30 p-3 bg-white border-t border-slate-200 shadow-lg">
          <button onClick={() => navigate('/shop/delivery')}
            className="w-full bg-slate-900 text-white h-12 rounded-xl flex items-center justify-between px-5 font-bold text-sm">
            <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> {cartCount} items</span>
            <span>${cartTotal.toFixed(2)} - Checkout</span>
          </button>
        </div>
      )}
    </div>
  );
}



