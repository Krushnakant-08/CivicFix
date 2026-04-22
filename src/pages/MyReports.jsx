import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import {
  STATUS_CONFIG, CATEGORY_ICONS, StatusIcon, CategoryIcon,
  MapPin, ThumbsUp, ClipboardList, AlertTriangle,
} from '../constants/icons';

const FILTER_TABS = [
  { key: '', label: 'All Reports' },
  { key: 'reported', label: 'Reported' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];


export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const fetchReports = useCallback(async (status = '', page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page', page);
      params.set('limit', '10');

      const data = await reportsAPI.getMyReports(params.toString());
      setReports(data.reports || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load your reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(activeFilter);
  }, [activeFilter, fetchReports]);

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setExpandedId(null);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">My Reports</h1>
          <p className="text-slate-500 text-lg">Track all your submitted civic issues</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="skeleton h-4 w-32 mb-2 rounded-lg"></div>
                    <div className="skeleton h-6 w-64 rounded-lg"></div>
                  </div>
                  <div className="skeleton h-7 w-24 rounded-full"></div>
                </div>
                <div className="skeleton h-4 w-full rounded-lg mb-2"></div>
                <div className="skeleton h-4 w-3/4 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-red-100 p-8 text-center animate-slide-up">
            <div className="mb-4"><AlertTriangle size={40} className="text-red-400 mx-auto" aria-hidden="true" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Couldn't Load Reports</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <Button variant="primary" onClick={() => fetchReports(activeFilter)} className="px-6">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && reports.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-12 text-center shadow-sm animate-slide-up">
            <div className="mb-4"><ClipboardList size={48} className="text-slate-400 mx-auto" aria-hidden="true" /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {activeFilter ? `No ${STATUS_CONFIG[activeFilter]?.label || activeFilter} reports` : 'No reports yet'}
            </h3>
            <p className="text-slate-500 mb-8">
              {activeFilter
                ? 'Try a different filter or submit a new report.'
                : 'Start by reporting a civic issue in your area.'}
            </p>
            <Link to="/report">
              <Button variant="primary">Report an Issue</Button>
            </Link>
          </div>
        )}

        {/* Reports List */}
        {!loading && !error && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report, idx) => {
              const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.reported;
              const isExpanded = expandedId === report._id;

              return (
                <div
                  key={report._id}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 animate-slide-up overflow-hidden"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  {/* Report Header — always visible */}
                  <button
                    onClick={() => toggleExpand(report._id)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">{report.trackingId}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{formatDate(report.createdAt)}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 truncate">{report.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <CategoryIcon category={report.category} size={14} className="text-slate-400" /> {report.category}
                          </span>
                          {report.location?.address && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-sm text-slate-500 truncate max-w-[200px] inline-flex items-center gap-1"><MapPin size={13} className="text-slate-400 shrink-0" aria-hidden="true" /> {report.location.address}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                          <StatusIcon config={statusConfig} size={12} /> {statusConfig.label}
                        </span>
                        <svg
                          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-slate-100 pt-4 animate-slide-up">
                      {/* Description */}
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                        <p className="text-slate-700 leading-relaxed text-sm">{report.description}</p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                          <p className="text-slate-900 font-medium text-sm capitalize">{report.priority}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                          <p className="text-slate-900 font-medium text-sm capitalize">{report.assignedDepartment || 'Pending'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Upvotes</p>
                          <p className="text-slate-900 font-medium text-sm inline-flex items-center gap-1"><ThumbsUp size={13} className="text-slate-400" aria-hidden="true" /> {report.upvotes || 0}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Submitted</p>
                          <p className="text-slate-900 font-medium text-sm">{formatDate(report.createdAt)}</p>
                        </div>
                      </div>

                      {/* Images */}
                      {report.images && report.images.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Attached Images</p>
                          <div className="flex gap-3 flex-wrap">
                            {report.images.map((img, i) => (
                              <img
                                key={i}
                                src={img.url}
                                alt={`Evidence ${i + 1}`}
                                className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status Timeline */}
                      {report.statusHistory && report.statusHistory.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Status Timeline</p>
                          <div className="space-y-3">
                            {report.statusHistory.map((entry, i) => {
                              const entryConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.reported;
                              return (
                                <div key={i} className="flex items-start gap-3">
                                  <div className="mt-1.5">
                                    <div className={`w-3 h-3 rounded-full ${
                                      i === report.statusHistory.length - 1
                                        ? `${entryConfig.dot} ring-4 ring-blue-100`
                                        : 'bg-slate-300'
                                    }`}></div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-slate-900 text-sm capitalize">
                                        {entry.status?.replace('_', ' ')}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        {formatDateTime(entry.changedAt)}
                                      </span>
                                    </div>
                                    {entry.note && (
                                      <p className="text-slate-500 text-sm mt-0.5">{entry.note}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => fetchReports(activeFilter, pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchReports(activeFilter, pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Summary */}
            <p className="text-center text-sm text-slate-400 pt-2">
              Showing {reports.length} of {pagination.total} report{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
