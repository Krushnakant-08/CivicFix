import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI } from '../services/api';
import {
  ANALYTICS_CATEGORIES, CategoryIcon,
  BarChart3, ClipboardList, CheckCircle, Target, Calendar, Sparkles,
  TrendingUp, TrendingDown, ArrowRight, FolderOpen, Zap, Timer,
  Flame, MapPin, Map, Clock, ArrowUpRight, ArrowDownRight,
} from '../constants/icons';

// ─── SVG Mini-Chart helpers ──────────────────────────────
function MiniLineChart({ data, width = 500, height = 180, color = '#2563eb' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (d.count / max) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  // Y-axis labels
  const yTicks = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {yTicks.map((t) => {
        const y = padding.top + chartH - (t / max) * chartH;
        return (
          <g key={t}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{t}</text>
          </g>
        );
      })}
      {/* Area */}
      <path d={areaD} fill="url(#lineGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />
      ))}
      {/* X-axis date labels (show every 5th) */}
      {data.map((d, i) => {
        if (i % 5 !== 0 && i !== data.length - 1) return null;
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
        return (
          <text key={i} x={x} y={height - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {new Date(d._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </text>
        );
      })}
    </svg>
  );
}

function MiniBarChart({ data, width = 400, height = 160, color = '#14b8a6' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const padding = { top: 10, right: 10, bottom: 30, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = Math.min(chartW / data.length * 0.6, 28);
  const gap = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {data.map((d, i) => {
        const barH = (d.count / max) * chartH;
        const x = padding.left + i * gap + (gap - barW) / 2;
        const y = padding.top + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} opacity="0.85" />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">
              {d.count}
            </text>
            <text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {d.label || d._id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ProgressRing({ value, max = 100, size = 120, color = '#2563eb' }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a">
        {value}%
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="11" fontWeight="500" fill="#94a3b8">
        Resolved
      </text>
    </svg>
  );
}

// ─── Category styling ────────────────────────────────────
const CATEGORY_CONFIG = {
  roads: { Icon: ANALYTICS_CATEGORIES.roads.Icon, color: '#ef4444' },
  sanitation: { Icon: ANALYTICS_CATEGORIES.sanitation.Icon, color: '#22c55e' },
  water: { Icon: ANALYTICS_CATEGORIES.water.Icon, color: '#3b82f6' },
  electricity: { Icon: ANALYTICS_CATEGORIES.electricity.Icon, color: '#eab308' },
  parks: { Icon: ANALYTICS_CATEGORIES.parks.Icon, color: '#a855f7' },
  traffic: { Icon: ANALYTICS_CATEGORIES.traffic.Icon, color: '#f97316' },
  other: { Icon: ANALYTICS_CATEGORIES.other.Icon, color: '#64748b' },
};

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const RISK_COLORS = {
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
};

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, predictionsData] = await Promise.all([
        reportsAPI.getAnalytics(),
        reportsAPI.getPredictions(),
      ]);
      setAnalytics(analyticsData);
      setPredictions(predictionsData);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { key: 'analytics', label: 'Analytics', Icon: BarChart3 },
    { key: 'predictions', label: 'Predictions', Icon: Sparkles },
  ];

  const formatHours = (h) => {
    if (!h && h !== 0) return 'N/A';
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${Math.round(h)}h`;
    return `${(h / 24).toFixed(1)}d`;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg shadow-md">
              <BarChart3 size={20} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics & Predictions</h1>
              <p className="text-slate-500">Data-driven insights and predictive hotspot forecasting</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <tab.Icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-slide-up">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/80 rounded-2xl border border-slate-100 p-5">
                <div className="skeleton h-8 w-16 rounded-lg mb-2"></div>
                <div className="skeleton h-4 w-24 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ═══════════ ANALYTICS TAB ═══════════ */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6 animate-slide-up">
                {/* Top Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Total Reports', value: analytics.totalReports, Icon: ClipboardList,
                      color: 'from-teal-600 to-emerald-600',
                    },
                    {
                      label: 'Resolved', value: analytics.resolvedReports, Icon: CheckCircle,
                      color: 'from-green-500 to-emerald-400',
                    },
                    {
                      label: 'Resolution Rate', value: `${analytics.resolutionRate}%`, Icon: Target,
                      color: 'from-indigo-500 to-purple-400',
                    },
                    {
                      label: 'This Month', value: analytics.monthlyComparison?.thisMonth || 0, Icon: Calendar,
                      color: 'from-amber-500 to-orange-400',
                      sub: analytics.monthlyComparison?.change
                        ? `${analytics.monthlyComparison.change > 0 ? '↑' : '↓'} ${Math.abs(analytics.monthlyComparison.change)}%`
                        : null,
                      subColor: analytics.monthlyComparison?.change > 0 ? 'text-red-500' : 'text-green-500',
                    },
                  ].map((stat, i) => (
                    <div key={stat.label} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-5 shadow-sm animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="flex items-center justify-between mb-3">
                        <stat.Icon size={24} className="text-slate-700" aria-hidden="true" />
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} opacity-20`}></div>
                      </div>
                      <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        {stat.sub && <span className={`text-xs font-bold ${stat.subColor}`}>{stat.sub}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trend Chart + Resolution Ring */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <TrendingUp size={16} className="text-slate-500" aria-hidden="true" /> Daily Report Trend
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Reports submitted per day (last 30 days)</p>
                    {analytics.dailyTrend?.length > 0 ? (
                      <MiniLineChart data={analytics.dailyTrend} />
                    ) : (
                      <p className="text-slate-400 text-sm py-8 text-center">No trend data available yet</p>
                    )}
                  </div>
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Target size={16} className="text-slate-500" aria-hidden="true" /> Resolution Rate
                    </h3>
                    <ProgressRing value={analytics.resolutionRate} color="#2563eb" />
                    <p className="text-xs text-slate-400 mt-3">{analytics.resolvedReports} of {analytics.totalReports} reports</p>
                  </div>
                </div>

                {/* Avg Resolution Time by Category & Priority */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Timer size={16} className="text-slate-500" aria-hidden="true" /> Avg. Resolution Time by Category
                    </h3>
                    <div className="space-y-3">
                      {(analytics.avgResolutionByCategory || []).map((item) => {
                        const maxH = Math.max(...analytics.avgResolutionByCategory.map((a) => a.avgHours), 1);
                        const pct = Math.round((item.avgHours / maxH) * 100);
                        const cat = CATEGORY_CONFIG[item._id] || CATEGORY_CONFIG.other;
                        return (
                          <div key={item._id} className="flex items-center gap-3">
                            <cat.Icon size={18} style={{ color: cat.color }} aria-hidden="true" />
                            <span className="text-sm font-medium text-slate-700 capitalize w-20 truncate">{item._id}</span>
                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cat.color }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-12 text-right">{formatHours(item.avgHours)}</span>
                          </div>
                        );
                      })}
                      {(analytics.avgResolutionByCategory || []).length === 0 && (
                        <p className="text-slate-400 text-sm text-center py-4">No resolved reports yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Zap size={16} className="text-slate-500" aria-hidden="true" /> Avg. Resolution Time by Priority
                    </h3>
                    <div className="space-y-3">
                      {(analytics.avgResolutionByPriority || []).map((item) => {
                        const maxH = Math.max(...analytics.avgResolutionByPriority.map((a) => a.avgHours), 1);
                        const pct = Math.round((item.avgHours / maxH) * 100);
                        return (
                          <div key={item._id} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700 capitalize w-20">{item._id}</span>
                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: PRIORITY_COLORS[item._id] || '#64748b' }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-12 text-right">{formatHours(item.avgHours)}</span>
                          </div>
                        );
                      })}
                      {(analytics.avgResolutionByPriority || []).length === 0 && (
                        <p className="text-slate-400 text-sm text-center py-4">No resolved reports yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hourly Distribution */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Clock size={16} className="text-slate-500" aria-hidden="true" /> Hourly Activity Pattern
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">When do citizens report issues most?</p>
                  {analytics.hourlyDistribution?.length > 0 ? (
                    <MiniBarChart
                      data={analytics.hourlyDistribution.map((h) => ({
                        ...h,
                        label: `${h._id}:00`,
                      }))}
                      color="#8b5cf6"
                    />
                  ) : (
                    <p className="text-slate-400 text-sm text-center py-4">No activity data yet</p>
                  )}
                </div>

                {/* Category & Status Breakdown */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <FolderOpen size={16} className="text-slate-500" aria-hidden="true" /> Reports by Category
                    </h3>
                    <div className="space-y-3">
                      {(analytics.byCategory || []).map((item) => {
                        const pct = analytics.totalReports ? Math.round((item.count / analytics.totalReports) * 100) : 0;
                        const cat = CATEGORY_CONFIG[item._id] || CATEGORY_CONFIG.other;
                        return (
                          <div key={item._id} className="flex items-center gap-3">
                            <cat.Icon size={14} style={{ color: cat.color }} aria-hidden="true" />
                            <span className="text-sm font-medium text-slate-700 capitalize w-20 truncate">{item._id}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-10 text-right">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <BarChart3 size={16} className="text-slate-500" aria-hidden="true" /> Reports by Status
                    </h3>
                    <div className="space-y-3">
                      {(analytics.byStatus || []).map((item) => {
                        const colors = {
                          reported: '#ef4444', acknowledged: '#f59e0b', assigned: '#6366f1',
                          in_progress: '#f97316', resolved: '#22c55e', closed: '#64748b', rejected: '#dc2626',
                        };
                        const pct = analytics.totalReports ? Math.round((item.count / analytics.totalReports) * 100) : 0;
                        return (
                          <div key={item._id} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700 capitalize w-24">{(item._id || '').replace('_', ' ')}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[item._id] || '#94a3b8' }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-10 text-right">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Areas */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-slate-500" aria-hidden="true" /> Top Reported Areas
                  </h3>
                  {(analytics.topAreas || []).length > 0 ? (
                    <div className="space-y-2">
                      {analytics.topAreas.slice(0, 8).map((area, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <span className="w-7 h-7 bg-gradient-to-br from-stone-600 to-stone-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-700 truncate flex-1">{area._id}</span>
                          <div className="flex gap-1 shrink-0">
                            {(area.categories || []).slice(0, 3).map((cat) => (
                              <CategoryIcon category={cat} size={12} />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-slate-900 shrink-0">{area.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm text-center py-4">No area data available</p>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════ PREDICTIONS TAB ═══════════ */}
            {activeTab === 'predictions' && predictions && (
              <div className="space-y-6 animate-slide-up">
                {/* Hotspots */}
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-2">
                    <Flame size={18} className="text-orange-500" aria-hidden="true" /> Predicted Hotspots
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">Areas with recurring issues likely to need attention</p>

                  {predictions.hotspots?.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {predictions.hotspots.map((spot, i) => {
                        const risk = RISK_COLORS[spot.riskLevel] || RISK_COLORS.low;
                        const cat = CATEGORY_CONFIG[spot.dominantCategory] || CATEGORY_CONFIG.other;
                        return (
                          <div key={i} className={`${risk.bg} border ${risk.border} rounded-2xl p-5 shadow-sm animate-slide-up`} style={{ animationDelay: `${i * 60}ms` }}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <cat.Icon size={20} style={{ color: cat.color }} aria-hidden="true" />
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${risk.badge}`}>
                                  {spot.riskLevel.toUpperCase()} RISK
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-500">{spot.confidence}% conf</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{spot.address}</h4>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                              <span className="bg-white/60 px-2 py-0.5 rounded-full font-medium">{spot.reportCount} reports</span>
                              <span className="bg-white/60 px-2 py-0.5 rounded-full font-medium">{spot.unresolvedCount} unresolved</span>
                              <span className="bg-white/60 px-2 py-0.5 rounded-full font-medium capitalize">{spot.dominantCategory}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              Last reported: {new Date(spot.lastReported).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white/80 rounded-2xl border border-slate-100 p-12 text-center">
                      <div className="mb-4"><Map size={48} className="text-slate-400 mx-auto" aria-hidden="true" /></div>
                      <p className="text-slate-500">Not enough data to generate hotspot predictions yet.</p>
                      <p className="text-slate-400 text-sm mt-1">Need at least 3 reports in an area within 60 days.</p>
                    </div>
                  )}
                </div>

                {/* Day of Week Trend */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" aria-hidden="true" /> Day-of-Week Pattern
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Which days see the most reports?</p>
                  {predictions.dayOfWeekTrend?.length > 0 ? (
                    <MiniBarChart
                      data={predictions.dayOfWeekTrend.map((d) => ({ ...d, label: d.day, _id: d.day }))}
                      color="#6366f1"
                    />
                  ) : (
                    <p className="text-slate-400 text-sm text-center py-4">No day pattern data yet</p>
                  )}
                </div>

                {/* Category Trends */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-slate-500" aria-hidden="true" /> Category Trends (4-week comparison)
                  </h3>
                  {predictions.categoryTrends?.length > 0 ? (
                    <div className="space-y-3">
                      {predictions.categoryTrends.map((ct) => {
                        const cat = CATEGORY_CONFIG[ct.category] || CATEGORY_CONFIG.other;
                        const TrendArrow = ct.trending === 'up' ? ArrowUpRight : ct.trending === 'down' ? ArrowDownRight : ArrowRight;
                        const trendColor = ct.trending === 'up' ? 'text-red-600' : ct.trending === 'down' ? 'text-green-600' : 'text-slate-500';
                        return (
                          <div key={ct.category} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <cat.Icon size={18} style={{ color: cat.color }} aria-hidden="true" />
                            <span className="text-sm font-medium text-slate-700 capitalize w-24">{ct.category}</span>
                            <div className="flex-1 flex items-center gap-3">
                              <span className="text-xs text-slate-400">Previous: {ct.previousCount}</span>
                              <span className="text-xs text-slate-600 font-medium">→ Current: {ct.recentCount}</span>
                            </div>
                            <span className={`text-sm font-bold ${trendColor} flex items-center gap-1`}>
                              <TrendArrow size={14} aria-hidden="true" /> {ct.changePercent > 0 ? '+' : ''}{ct.changePercent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm text-center py-4">No trend data available</p>
                  )}
                </div>

                {/* Generation Timestamp */}
                <p className="text-xs text-slate-400 text-center">
                  Predictions generated at: {new Date(predictions.generatedAt).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
