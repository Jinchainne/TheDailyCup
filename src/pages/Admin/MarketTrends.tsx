import { useState } from 'react';
import { useShop } from '../../hooks/useShop';
import {
  TrendingUp, TrendingDown, Search, Loader2, Brain, Sparkles,
  DollarSign, Package, Star, BarChart3, FileText, Download,
  RefreshCw, ChevronRight, Lightbulb, Target, Zap, Coffee
} from 'lucide-react';

const MIMO_API = 'https://api.xiaomimimo.com/v1/chat/completions';
const MIMO_KEY = 'sk-szsjdjw70m8t5bwy8tgx4n0taa4egpnicnidvpt3im9exf3l';

interface TrendResult {
  category: string;
  items: string[];
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface CompetitorInsight {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

interface ProductRecommendation {
  product: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDemand: number;
}

interface TrendReport {
  trendingFlavors: string[];
  seasonalRecs: string[];
  pricingInsights: string[];
  marketGaps: string[];
  generatedAt: string;
}

export default function MarketTrends() {
  const { products } = useShop();
  const [activeTab, setActiveTab] = useState<'trends' | 'competitors' | 'recommendations' | 'report'>('trends');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Trending Products State
  const [trendingCategories, setTrendingCategories] = useState<TrendResult[]>([]);
  const [popularItems, setPopularItems] = useState<string[]>([]);
  const [seasonalTrends, setSeasonalTrends] = useState<string[]>([]);
  const [newProductSuggestions, setNewProductSuggestions] = useState<string[]>([]);

  // Competitor Analysis State
  const [competitorInsights, setCompetitorInsights] = useState<CompetitorInsight[]>([]);
  const [pricingStrategies, setPricingStrategies] = useState<string[]>([]);
  const [menuGaps, setMenuGaps] = useState<string[]>([]);

  // Recommendations State
  const [similarProducts, setSimilarProducts] = useState<ProductRecommendation[]>([]);
  const [improvementSuggestions, setImprovementSuggestions] = useState<string[]>([]);
  const [priceOptimizations, setPriceOptimizations] = useState<{ product: string; currentPrice: number; suggestedPrice: number; reason: string }[]>([]);

  // Report State
  const [trendReport, setTrendReport] = useState<TrendReport | null>(null);

  const buildProductContext = () => {
    const categories = [...new Set(products.map(p => p.category))];
    const topProducts = products.slice(0, 20).map(p => `${p.name} ($${p.price}) - ${p.category}`).join('\n');
    return `Current menu has ${products.length} products across ${categories.length} categories: ${categories.join(', ')}.\n\nTop products:\n${topProducts}`;
  };

  const callMimo = async (prompt: string, systemContext?: string): Promise<string> => {
    try {
      const resp = await fetch(MIMO_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MIMO_KEY}` },
        body: JSON.stringify({
          model: 'mimo-v2.5-pro',
          messages: [
            { role: 'system', content: systemContext || 'You are a market research analyst specializing in food & beverage industry. Provide detailed, actionable insights.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 1200,
        }),
      });
      const data = await resp.json();
      return data.choices?.[0]?.message?.reasoning_content || data.choices?.[0]?.message?.content || 'Unable to analyze. Please try again.';
    } catch {
      throw new Error('Failed to connect to AI service');
    }
  };

  const parseJsonFromResponse = (text: string): any => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return null;
  };

  // ═══════ SCAN MARKET TRENDS ═══════
  const scanMarketTrends = async () => {
    setLoading('trends');
    setError(null);
    try {
      const context = buildProductContext();
      const prompt = `Analyze current food & beverage market trends for a coffee house/cafe. Based on this context:\n${context}\n\nProvide analysis in this exact JSON format:\n{\n  "trendingCategories": [\n    {"category": "name", "items": ["item1", "item2"], "confidence": 85, "trend": "up"}\n  ],\n  "popularItems": ["item1", "item2", ...],\n  "seasonalTrends": ["trend1", "trend2", ...],\n  "newProductSuggestions": ["product1", "product2", ...]\n}\n\nFocus on: specialty coffee, health-conscious options, fusion flavors, plant-based alternatives, premium ingredients. Include 4-6 categories, 8-10 popular items, 4-6 seasonal trends, and 6-8 new product suggestions.`;

      const response = await callMimo(prompt);
      const parsed = parseJsonFromResponse(response);

      if (parsed) {
        setTrendingCategories(parsed.trendingCategories || []);
        setPopularItems(parsed.popularItems || []);
        setSeasonalTrends(parsed.seasonalTrends || []);
        setNewProductSuggestions(parsed.newProductSuggestions || []);
      } else {
        setError('Failed to parse AI response. Please try again.');
      }
    } catch {
      setError('Failed to scan market trends. Please try again.');
    }
    setLoading(null);
  };

  // ═══════ ANALYZE COMPETITORS ═══════
  const analyzeCompetitors = async () => {
    setLoading('competitors');
    setError(null);
    try {
      const context = buildProductContext();
      const prompt = `Analyze competitors for a coffee house/cafe with this menu:\n${context}\n\nAnalyze these competitors: Starbucks, McDonald's McCafé, Vietnamese cafes (Phin Coffee, Cộng Cà Phê), local specialty coffee shops.\n\nProvide analysis in this exact JSON format:\n{\n  "competitorInsights": [\n    {"competitor": "name", "strengths": ["s1", "s2"], "weaknesses": ["w1", "w2"], "opportunities": ["o1", "o2"]}\n  ],\n  "pricingStrategies": ["strategy1", "strategy2", ...],\n  "menuGaps": ["gap1", "gap2", ...]\n}\n\nInclude 4 competitors, 3-4 strengths/weaknesses/opportunities each, 5-6 pricing strategies, and 5-6 menu gaps.`;

      const response = await callMimo(prompt);
      const parsed = parseJsonFromResponse(response);

      if (parsed) {
        setCompetitorInsights(parsed.competitorInsights || []);
        setPricingStrategies(parsed.pricingStrategies || []);
        setMenuGaps(parsed.menuGaps || []);
      } else {
        setError('Failed to parse AI response. Please try again.');
      }
    } catch {
      setError('Failed to analyze competitors. Please try again.');
    }
    setLoading(null);
  };

  // ═══════ GENERATE RECOMMENDATIONS ═══════
  const generateRecommendations = async () => {
    setLoading('recommendations');
    setError(null);
    try {
      const context = buildProductContext();
      const prompt = `Based on this coffee house menu and market data:\n${context}\n\nGenerate product recommendations in this exact JSON format:\n{\n  "similarProducts": [\n    {"product": "name", "reason": "why", "priority": "high|medium|low", "estimatedDemand": 75}\n  ],\n  "improvementSuggestions": ["suggestion1", "suggestion2", ...],\n  "priceOptimizations": [\n    {"product": "name", "currentPrice": 4.99, "suggestedPrice": 5.49, "reason": "why"}\n  ]\n}\n\nInclude 6-8 similar products to add, 5-6 improvement suggestions, and 4-6 price optimizations based on market positioning.`;

      const response = await callMimo(prompt);
      const parsed = parseJsonFromResponse(response);

      if (parsed) {
        setSimilarProducts(parsed.similarProducts || []);
        setImprovementSuggestions(parsed.improvementSuggestions || []);
        setPriceOptimizations(parsed.priceOptimizations || []);
      } else {
        setError('Failed to parse AI response. Please try again.');
      }
    } catch {
      setError('Failed to generate recommendations. Please try again.');
    }
    setLoading(null);
  };

  // ═══════ GENERATE TREND REPORT ═══════
  const generateReport = async () => {
    setLoading('report');
    setError(null);
    try {
      const context = buildProductContext();
      const prompt = `Generate a comprehensive market trend report for a coffee house with this menu:\n${context}\n\nProvide report in this exact JSON format:\n{\n  "trendingFlavors": ["flavor1", "flavor2", ...],\n  "seasonalRecs": ["rec1", "rec2", ...],\n  "pricingInsights": ["insight1", "insight2", ...],\n  "marketGaps": ["gap1", "gap2", ...],\n  "generatedAt": "${new Date().toISOString()}"\n}\n\nInclude 8-10 trending flavors, 6-8 seasonal recommendations, 6-8 pricing insights, and 5-7 market gaps.`;

      const response = await callMimo(prompt);
      const parsed = parseJsonFromResponse(response);

      if (parsed) {
        setTrendReport({
          trendingFlavors: parsed.trendingFlavors || [],
          seasonalRecs: parsed.seasonalRecs || [],
          pricingInsights: parsed.pricingInsights || [],
          marketGaps: parsed.marketGaps || [],
          generatedAt: parsed.generatedAt || new Date().toISOString(),
        });
      } else {
        setError('Failed to parse AI response. Please try again.');
      }
    } catch {
      setError('Failed to generate report. Please try again.');
    }
    setLoading(null);
  };

  const exportReport = () => {
    if (!trendReport) return;
    const reportText = `Market Trend Report - The Daily Cup
Generated: ${new Date(trendReport.generatedAt).toLocaleString()}

═══════════════════════════════════════
TRENDING FLAVORS
═══════════════════════════════════════
${trendReport.trendingFlavors.map((f, i) => `${i + 1}. ${f}`).join('\n')}

═══════════════════════════════════════
SEASONAL RECOMMENDATIONS
═══════════════════════════════════════
${trendReport.seasonalRecs.map((r, i) => `${i + 1}. ${r}`).join('\n')}

═══════════════════════════════════════
PRICING INSIGHTS
═══════════════════════════════════════
${trendReport.pricingInsights.map((p, i) => `${i + 1}. ${p}`).join('\n')}

═══════════════════════════════════════
MARKET GAPS & OPPORTUNITIES
═══════════════════════════════════════
${trendReport.marketGaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

───────────────────────────────────────
Powered by MiMo AI Market Analyzer
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-trend-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReportJson = () => {
    if (!trendReport) return;
    const blob = new Blob([JSON.stringify(trendReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-trend-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'trends' as const, label: 'Trending Products', icon: TrendingUp },
    { id: 'competitors' as const, label: 'Competitor Analysis', icon: Target },
    { id: 'recommendations' as const, label: 'Recommendations', icon: Lightbulb },
    { id: 'report' as const, label: 'Trend Report', icon: FileText },
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <BarChart3 className="w-4 h-4 text-slate-400" />;
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* ═══════ TRENDING PRODUCTS TAB ═══════ */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Trending Products</h2>
              <p className="text-sm text-slate-500">AI-powered market trend analysis for food & beverage</p>
            </div>
            <button
              onClick={scanMarketTrends}
              disabled={loading === 'trends'}
              className="btn-primary flex items-center gap-2"
            >
              {loading === 'trends' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Scan Market Trends
            </button>
          </div>

          {loading === 'trends' && (
            <div className="card p-12 text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-600 font-medium">Analyzing market trends...</p>
              <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
            </div>
          )}

          {!loading && trendingCategories.length === 0 && (
            <div className="card p-12 text-center">
              <Coffee className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Market Trend Analyzer</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Click "Scan Market Trends" to analyze current food & beverage trends, popular items, and seasonal opportunities.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                {['Specialty Coffee', 'Health Foods', 'Fusion Flavors', 'Plant-Based'].map(cat => (
                  <div key={cat} className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-slate-700">{cat}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trendingCategories.length > 0 && (
            <>
              {/* Trending Categories */}
              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> Trending Categories
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendingCategories.map((cat, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(cat.trend)}
                          <h4 className="text-sm font-bold text-slate-900">{cat.category}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{cat.confidence}% confidence</span>
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${cat.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.items.map((item, j) => (
                          <span key={j} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Items + Seasonal Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Popular Items Right Now
                  </h3>
                  <div className="space-y-2">
                    {popularItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                        <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" /> Seasonal Trends
                  </h3>
                  <div className="space-y-2">
                    {seasonalTrends.map((trend, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg">
                        <ChevronRight className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <span className="text-sm text-slate-700">{trend}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* New Product Suggestions */}
              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-600" /> Suggested New Products
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {newProductSuggestions.map((product, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <Package className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-indigo-800 font-medium">{product}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ COMPETITOR ANALYSIS TAB ═══════ */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Competitor Analysis</h2>
              <p className="text-sm text-slate-500">AI-powered competitive intelligence</p>
            </div>
            <button
              onClick={analyzeCompetitors}
              disabled={loading === 'competitors'}
              className="btn-primary flex items-center gap-2"
            >
              {loading === 'competitors' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              Analyze Competitors
            </button>
          </div>

          {loading === 'competitors' && (
            <div className="card p-12 text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-600 font-medium">Analyzing competitors...</p>
              <p className="text-xs text-slate-400 mt-1">Comparing with Starbucks, McDonald's, Vietnamese cafes</p>
            </div>
          )}

          {!loading && competitorInsights.length === 0 && (
            <div className="card p-12 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Competitor Intelligence</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Click "Analyze Competitors" to compare your menu with major competitors and identify market opportunities.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Starbucks', 'McCafé', 'Phin Coffee', 'Cộng Cà Phê'].map(comp => (
                  <div key={comp} className="bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium text-slate-700">
                    {comp}
                  </div>
                ))}
              </div>
            </div>
          )}

          {competitorInsights.length > 0 && (
            <>
              {/* Competitor Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitorInsights.map((insight, i) => (
                  <div key={i} className="card p-5">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold">
                        {insight.competitor.charAt(0)}
                      </span>
                      {insight.competitor}
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Strengths</p>
                        <div className="space-y-1">
                          {insight.strengths.map((s, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-1">+</span>
                              <span className="text-xs text-slate-700">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Weaknesses</p>
                        <div className="space-y-1">
                          {insight.weaknesses.map((w, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">−</span>
                              <span className="text-xs text-slate-700">{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Opportunities</p>
                        <div className="space-y-1">
                          {insight.opportunities.map((o, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <Lightbulb className="w-3 h-3 text-indigo-500 mt-0.5" />
                              <span className="text-xs text-slate-700">{o}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Strategies + Menu Gaps */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Pricing Strategies
                  </h3>
                  <div className="space-y-2">
                    {pricingStrategies.map((strategy, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <ChevronRight className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <span className="text-sm text-emerald-800">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Menu Gaps Identified
                  </h3>
                  <div className="space-y-2">
                    {menuGaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
                        <span className="text-sm text-amber-800">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ RECOMMENDATIONS TAB ═══════ */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Product Recommendations</h2>
              <p className="text-sm text-slate-500">AI-powered suggestions to optimize your menu</p>
            </div>
            <button
              onClick={generateRecommendations}
              disabled={loading === 'recommendations'}
              className="btn-primary flex items-center gap-2"
            >
              {loading === 'recommendations' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              Generate Recommendations
            </button>
          </div>

          {loading === 'recommendations' && (
            <div className="card p-12 text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-600 font-medium">Generating recommendations...</p>
              <p className="text-xs text-slate-400 mt-1">Analyzing best-sellers and customer preferences</p>
            </div>
          )}

          {!loading && similarProducts.length === 0 && (
            <div className="card p-12 text-center">
              <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Recommendations</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Click "Generate Recommendations" to get AI-powered suggestions for new products, improvements, and pricing optimizations.
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {['New Products', 'Improvements', 'Pricing'].map(cat => (
                  <div key={cat} className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-slate-700">{cat}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {similarProducts.length > 0 && (
            <>
              {/* Similar Products to Add */}
              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" /> Recommended Products to Add
                </h3>
                <div className="space-y-3">
                  {similarProducts.map((rec, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{rec.product}</h4>
                          {getPriorityBadge(rec.priority)}
                        </div>
                        <p className="text-xs text-slate-500">{rec.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Est. Demand</p>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${rec.estimatedDemand}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{rec.estimatedDemand}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Suggestions */}
              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Improvement Suggestions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {improvementSuggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-amber-800">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Optimizations */}
              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Price Optimization Suggestions
                </h3>
                <div className="space-y-3">
                  {priceOptimizations.map((opt, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{opt.product}</h4>
                        <p className="text-xs text-slate-500">{opt.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400 line-through">${opt.currentPrice.toFixed(2)}</span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                          <span className={`text-sm font-bold ${opt.suggestedPrice > opt.currentPrice ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${opt.suggestedPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {opt.suggestedPrice > opt.currentPrice ? '+' : ''}
                          {((opt.suggestedPrice - opt.currentPrice) / opt.currentPrice * 100).toFixed(1)}% change
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ TREND REPORT TAB ═══════ */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Market Trend Report</h2>
              <p className="text-sm text-slate-500">Comprehensive AI-generated market analysis</p>
            </div>
            <div className="flex items-center gap-2">
              {trendReport && (
                <>
                  <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export TXT
                  </button>
                  <button onClick={exportReportJson} className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export JSON
                  </button>
                </>
              )}
              <button
                onClick={generateReport}
                disabled={loading === 'report'}
                className="btn-primary flex items-center gap-2"
              >
                {loading === 'report' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Generate Report
              </button>
            </div>
          </div>

          {loading === 'report' && (
            <div className="card p-12 text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-600 font-medium">Generating comprehensive report...</p>
              <p className="text-xs text-slate-400 mt-1">Compiling market data and insights</p>
            </div>
          )}

          {!loading && !trendReport && (
            <div className="card p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Market Trend Report</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Click "Generate Report" to create a comprehensive market trend analysis including trending flavors, seasonal recommendations, and pricing insights.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                {['Trending Flavors', 'Seasonal Recs', 'Pricing Insights', 'Market Gaps'].map(section => (
                  <div key={section} className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-slate-700">{section}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trendReport && (
            <>
              {/* Report Header */}
              <div className="card p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Market Trend Report</h3>
                    <p className="text-sm text-indigo-100">
                      Generated on {new Date(trendReport.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Brain className="w-10 h-10 text-white/30" />
                </div>
              </div>

              {/* Trending Flavors */}
              <div className="card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-indigo-600" /> Trending Flavors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendReport.trendingFlavors.map((flavor, i) => (
                    <span key={i} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100">
                      {flavor}
                    </span>
                  ))}
                </div>
              </div>

              {/* Seasonal + Pricing + Gaps */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" /> Seasonal Recommendations
                  </h3>
                  <div className="space-y-2">
                    {trendReport.seasonalRecs.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded-lg">
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                        <span className="text-xs text-slate-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500" /> Pricing Insights
                  </h3>
                  <div className="space-y-2">
                    {trendReport.pricingInsights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded-lg">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                        <span className="text-xs text-slate-700">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-500" /> Market Gaps
                  </h3>
                  <div className="space-y-2">
                    {trendReport.marketGaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded-lg">
                        <Lightbulb className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                        <span className="text-xs text-slate-700">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

