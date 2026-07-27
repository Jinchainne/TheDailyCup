import { useState, useMemo, useRef } from 'react';
import { useShop } from '../../hooks/useShop';
import { useSocial } from '../../hooks/useSocial';
import {
  Users, Repeat, DollarSign, MessageSquare,
  Star, Award, AlertTriangle,
  Brain, Loader2, Download, Upload, FileJson,
  ShoppingBag, Crown, UserCheck, UserMinus,
  BarChart3, ThumbsUp, ThumbsDown, Sparkles
} from 'lucide-react';
import { requestMimoChat } from '../../lib/mimo';

// ─── Interfaces ───
interface CustomerSegment {
  label: string;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Users;
  description: string;
}

interface TopProduct {
  id: string;
  name: string;
  count: number;
  revenue?: number;
  avgRating?: number;
  reviewCount?: number;
}

export default function CustomerInsights() {
  const { orders, products } = useShop();
  const { comments } = useSocial();
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ═══════ COMPUTED ANALYTICS ═══════
  const analytics = useMemo(() => {
    // Customer overview
    const walletSet = new Set<string>();
    const walletOrders: Record<string, number> = {};
    const walletSpent: Record<string, number> = {};

    orders.forEach(o => {
      const w = o.customerWallet || 'anonymous';
      walletSet.add(w);
      walletOrders[w] = (walletOrders[w] || 0) + 1;
      walletSpent[w] = (walletSpent[w] || 0) + o.total;
    });

    const uniqueCustomers = walletSet.size;
    const repeatCustomers = Object.values(walletOrders).filter(c => c > 1).length;
    const avgOrderValue = orders.length > 0
      ? orders.reduce((s, o) => s + o.total, 0) / orders.length
      : 0;
    const totalFeedback = comments.length;

    // Top ordered products
    const productOrderCount: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const pid = item.product.id;
        if (!productOrderCount[pid]) {
          productOrderCount[pid] = { name: item.product.name, count: 0, revenue: 0 };
        }
        productOrderCount[pid].count += item.quantity;
        productOrderCount[pid].revenue += item.product.price * item.quantity;
      });
    });
    const topOrdered: TopProduct[] = Object.entries(productOrderCount)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Highest rated products
    const productRatings: Record<string, { total: number; count: number }> = {};
    comments.forEach(c => {
      if (!productRatings[c.productId]) productRatings[c.productId] = { total: 0, count: 0 };
      productRatings[c.productId].total += c.rating;
      productRatings[c.productId].count += 1;
    });
    const highestRated: TopProduct[] = Object.entries(productRatings)
      .map(([id, data]) => {
        const prod = products.find(p => p.id === id);
        return {
          id,
          name: prod?.name || id,
          count: 0,
          avgRating: data.total / data.count,
          reviewCount: data.count,
        };
      })
      .filter(p => (p.reviewCount || 0) >= 1)
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, 10);

    // Most reviewed products
    const mostReviewed: TopProduct[] = Object.entries(productRatings)
      .map(([id, data]) => {
        const prod = products.find(p => p.id === id);
        return {
          id,
          name: prod?.name || id,
          count: 0,
          avgRating: data.total / data.count,
          reviewCount: data.count,
        };
      })
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 10);

    // Customer segments
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;
    const vipCustomers = Object.entries(walletSpent).filter(([_, spent]) => spent > 100).length;
    const regularCustomers = Object.entries(walletOrders).filter(([_, count]) => count >= 3 && walletSpent[_] <= 100).length;
    const newCustomers = Object.entries(walletOrders).filter(([_, count]) => count >= 1 && count <= 2).length;

    // Inactive: wallet with orders but none in last 7 days
    const inactiveCustomers = Object.keys(walletOrders).filter(w => {
      const lastOrder = orders
        .filter(o => (o.customerWallet || 'anonymous') === w)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      return lastOrder && lastOrder.timestamp < sevenDaysAgo;
    }).length;

    const segments: CustomerSegment[] = [
      { label: 'VIP', count: vipCustomers, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-400', icon: Crown, description: 'Spent > $100' },
      { label: 'Regular', count: regularCustomers, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-400', icon: UserCheck, description: '3+ orders' },
      { label: 'New', count: newCustomers, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-400', icon: Users, description: '1-2 orders' },
      { label: 'Inactive', count: inactiveCustomers, color: 'text-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-400', icon: UserMinus, description: 'No order in 7 days' },
    ];

    // Rating distribution
    const ratingDist = [0, 0, 0, 0, 0];
    comments.forEach(c => {
      if (c.rating >= 1 && c.rating <= 5) ratingDist[c.rating - 1]++;
    });
    const maxRatingCount = Math.max(...ratingDist, 1);

    // Low/high rated products
    const lowRated = Object.entries(productRatings)
      .map(([id, data]) => ({
        id,
        name: products.find(p => p.id === id)?.name || id,
        avgRating: data.total / data.count,
        reviewCount: data.count,
      }))
      .filter(p => p.avgRating <= 3 && p.reviewCount >= 2)
      .sort((a, b) => a.avgRating - b.avgRating)
      .slice(0, 5);

    const highRated = Object.entries(productRatings)
      .map(([id, data]) => ({
        id,
        name: products.find(p => p.id === id)?.name || id,
        avgRating: data.total / data.count,
        reviewCount: data.count,
      }))
      .filter(p => p.avgRating >= 4.5 && p.reviewCount >= 2)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    return {
      uniqueCustomers, repeatCustomers, avgOrderValue, totalFeedback,
      topOrdered, highestRated, mostReviewed,
      segments, ratingDist, maxRatingCount,
      lowRated, highRated,
      walletOrders, walletSpent,
    };
  }, [orders, comments, products]);

  // ═══════ AI ANALYSIS ═══════
  const fetchAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis('');

    const prompt = `Analyze this coffee shop customer data and provide actionable business insights:

**Customer Overview:**
- Total unique customers: ${analytics.uniqueCustomers}
- Repeat customers: ${analytics.repeatCustomers}
- Average order value: $${analytics.avgOrderValue.toFixed(2)}
- Total feedback/reviews: ${analytics.totalFeedback}

**Customer Segments:**
${analytics.segments.map(s => `- ${s.label}: ${s.count} (${s.description})`).join('\n')}

**Top Ordered Products:**
${analytics.topOrdered.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} - ${p.count} orders, $${p.revenue?.toFixed(2)} revenue`).join('\n')}

**Rating Distribution:**
${analytics.ratingDist.map((c, i) => `${i + 1} star: ${c} reviews`).join('\n')}

**Products Needing Improvement (low rated):**
${analytics.lowRated.length > 0 ? analytics.lowRated.map(p => `- ${p.name}: ${p.avgRating.toFixed(1)}★ (${p.reviewCount} reviews)`).join('\n') : 'None identified'}

    **Customer Favorites (high rated):**
${analytics.highRated.length > 0 ? analytics.highRated.map(p => `- ${p.name}: ${p.avgRating.toFixed(1)}★ (${p.reviewCount} reviews)`).join('\n') : 'None identified'}

Please provide:
1. Customer preference patterns and buying behavior insights
2. Top 3 actionable recommendations to increase revenue
3. Customer retention strategies based on segment data
4. Product improvement suggestions for low-rated items
5. Cross-selling opportunities based on order patterns`;

    try {
      const content = await requestMimoChat([
        {
          role: 'system',
          content: 'You are a business analytics AI assistant specializing in restaurant and cafe customer insights. Provide clear, actionable analysis with specific recommendations. Use bullet points and keep the response structured.'
        },
        { role: 'user', content: prompt }
      ], { temperature: 0.7, maxTokens: 2048 });
      setAiAnalysis(content);
    } catch {
      setAiAnalysis('Failed to fetch AI analysis. Please check your connection and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // ═══════ EXPORT / IMPORT ═══════
  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCustomers = () => {
    try {
      const saved = localStorage.getItem('coffeehouse_customers');
      const customers = saved ? JSON.parse(saved) : {};
      downloadJson(customers, `thedailycup_customers_${Date.now()}.json`);
    } catch { downloadJson({}, `thedailycup_customers_${Date.now()}.json`); }
  };

  const exportOrders = () => {
    downloadJson(orders, `thedailycup_orders_${Date.now()}.json`);
  };

  const exportRatings = () => {
    downloadJson(comments, `thedailycup_ratings_${Date.now()}.json`);
  };

  const handleImportCustomers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data === 'object' && data !== null) {
          localStorage.setItem('coffeehouse_customers', JSON.stringify(data));
          setImportStatus(`Successfully imported ${Object.keys(data).length} customers`);
          setTimeout(() => setImportStatus(''), 3000);
        } else {
          setImportStatus('Invalid file format');
        }
      } catch {
        setImportStatus('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* ═══════ CUSTOMER OVERVIEW CARDS ═══════ */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Customer Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Total Customers</p>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{analytics.uniqueCustomers}</p>
            <p className="text-[10px] text-slate-400 mt-1">Unique wallet addresses</p>
          </div>
          <div className="card p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Repeat Customers</p>
              <Repeat className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-extrabold text-green-600">{analytics.repeatCustomers}</p>
            <p className="text-[10px] text-slate-400 mt-1">Ordered more than once</p>
          </div>
          <div className="card p-4 border-l-4 border-amber-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Avg Order Value</p>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600">${analytics.avgOrderValue.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Per order average</p>
          </div>
          <div className="card p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">Total Feedback</p>
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-purple-600">{analytics.totalFeedback}</p>
            <p className="text-[10px] text-slate-400 mt-1">Reviews & ratings</p>
          </div>
        </div>
      </div>

      {/* ═══════ CUSTOMER SEGMENTS ═══════ */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Customer Segments
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.segments.map(seg => (
            <div key={seg.label} className={`card p-4 border-l-4 ${seg.borderColor}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">{seg.label}</p>
                <seg.icon className={`w-4 h-4 ${seg.color}`} />
              </div>
              <p className={`text-2xl font-extrabold ${seg.color}`}>{seg.count}</p>
              <p className="text-[10px] text-slate-400 mt-1">{seg.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ TOP PRODUCTS ANALYSIS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Ordered */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-500" />
            Most Ordered
          </h3>
          {analytics.topOrdered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No order data yet</p>
          ) : (
            <div className="space-y-2.5">
              {analytics.topOrdered.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-900 truncate">{p.name}</span>
                      <span className="text-xs font-bold text-blue-600 ml-2">{p.count}×</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${analytics.topOrdered[0] ? (p.count / analytics.topOrdered[0].count) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Highest Rated */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Highest Rated
          </h3>
          {analytics.highestRated.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No ratings yet</p>
          ) : (
            <div className="space-y-2.5">
              {analytics.highestRated.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-900 truncate">{p.name}</span>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-yellow-600">{p.avgRating?.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">{p.reviewCount} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Reviewed */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            Most Reviewed
          </h3>
          {analytics.mostReviewed.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No reviews yet</p>
          ) : (
            <div className="space-y-2.5">
              {analytics.mostReviewed.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-900 truncate">{p.name}</span>
                      <span className="text-xs font-bold text-purple-600 ml-2">{p.reviewCount} reviews</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${analytics.mostReviewed[0] ? ((p.reviewCount || 0) / (analytics.mostReviewed[0].reviewCount || 1)) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ RATING DISTRIBUTION ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating bars */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = analytics.ratingDist[star - 1];
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-xs font-bold text-slate-700">{star}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${analytics.maxRatingCount > 0 ? (count / analytics.maxRatingCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-900 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            Total: {analytics.totalFeedback} reviews · Average: {analytics.totalFeedback > 0 ? (analytics.ratingDist.reduce((s, c, i) => s + c * (i + 1), 0) / analytics.totalFeedback).toFixed(1) : '0'}★
          </p>
        </div>

        {/* Low & High rated products */}
        <div className="space-y-4">
          {/* Need improvement */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Need Improvement
            </h3>
            {analytics.lowRated.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No low-rated products identified</p>
            ) : (
              <div className="space-y-2">
                {analytics.lowRated.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.reviewCount} reviews</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3 text-red-500" />
                      <span className="text-xs font-bold text-red-600">{p.avgRating?.toFixed(1)}★</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer favorites */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-green-500" />
              Customer Favorites
            </h3>
            {analytics.highRated.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No high-rated products yet</p>
            ) : (
              <div className="space-y-2">
                {analytics.highRated.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.reviewCount} reviews</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-bold text-green-600">{p.avgRating?.toFixed(1)}★</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ AI ANALYSIS BUTTON ═══════ */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            AI Customer Insights
          </h3>
          <button
            onClick={fetchAiAnalysis}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get AI Customer Insights
              </>
            )}
          </button>
        </div>

        {aiLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">AI is analyzing customer data...</p>
              <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
            </div>
          </div>
        )}

        {aiAnalysis && !aiLoading && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700">AI Analysis Report</span>
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">
              {aiAnalysis}
            </div>
          </div>
        )}

        {!aiAnalysis && !aiLoading && (
          <div className="text-center py-6 text-slate-400">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Click the button above to get AI-powered customer insights</p>
          </div>
        )}
      </div>

      {/* ═══════ DATA EXPORT / IMPORT ═══════ */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileJson className="w-4 h-4 text-emerald-500" />
          Data Export & Import
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <button
            onClick={exportCustomers}
            className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <div className="text-left">
              <p className="text-xs font-semibold text-blue-700">Export Customers</p>
              <p className="text-[10px] text-blue-500">Download as JSON</p>
            </div>
          </button>

          <button
            onClick={exportOrders}
            className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            <Download className="w-4 h-4 text-green-500" />
            <div className="text-left">
              <p className="text-xs font-semibold text-green-700">Export Orders</p>
              <p className="text-[10px] text-green-500">Download as JSON</p>
            </div>
          </button>

          <button
            onClick={exportRatings}
            className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
          >
            <Download className="w-4 h-4 text-purple-500" />
            <div className="text-left">
              <p className="text-xs font-semibold text-purple-700">Export Ratings</p>
              <p className="text-[10px] text-purple-500">Download as JSON</p>
            </div>
          </button>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportCustomers}
              className="hidden"
              id="import-customers"
            />
            <label
              htmlFor="import-customers"
              className="flex items-center gap-2 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-500" />
              <div className="text-left">
                <p className="text-xs font-semibold text-amber-700">Import Customers</p>
                <p className="text-[10px] text-amber-500">Upload JSON file</p>
              </div>
            </label>
          </div>
        </div>

        {importStatus && (
          <div className={`text-xs p-2 rounded-lg ${importStatus.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {importStatus}
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-3 mt-3">
          <p className="text-[10px] text-slate-500">
            <strong>Data Storage:</strong> All data is stored locally in your browser's localStorage. 
            Export your data regularly for backup. Import restores customer profiles from a previously exported JSON file.
          </p>
        </div>
      </div>
    </div>
  );
}

