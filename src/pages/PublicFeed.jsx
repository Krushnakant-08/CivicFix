import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportCard from '../components/reports/ReportCard';
import FilterBar from '../components/reports/FilterBar';
import { Button } from '../components/ui/Button';

export default function PublicFeed() {
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ sort: '-createdAt' });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [upvotingId, setUpvotingId] = useState(null);

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.sort) params.set('sort', filters.sort);
      params.set('page', page);
      params.set('limit', '12');

      const data = await reportsAPI.getAll(params.toString());
      setReports(data.reports || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpvote = async (reportId) => {
    if (!isAuthenticated) return;
    setUpvotingId(reportId);
    try {
      await reportsAPI.upvote(reportId);
      fetchReports(pagination.page);
    } catch { /* silently fail */ } finally {
      setUpvotingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Community Issue Feed</h1>
              <p className="text-slate-500 text-lg mt-1">Browse and upvote civic issues reported by your community</p>
            </div>
            <Link to="/report">
              <Button variant="primary" className="text-sm py-2.5 px-5">
                + Report Issue
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
          <FilterBar filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/80 rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="skeleton h-4 w-32 rounded-lg mb-3"></div>
                <div className="skeleton h-5 w-full rounded-lg mb-2"></div>
                <div className="skeleton h-4 w-3/4 rounded-lg mb-4"></div>
                <div className="skeleton h-3 w-48 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-white/80 rounded-2xl border border-red-100 p-8 text-center animate-slide-up">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-slate-700 font-semibold mb-2">Failed to load feed</p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button onClick={() => fetchReports()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && reports.length === 0 && (
          <div className="bg-white/80 rounded-2xl border border-slate-100 p-12 text-center shadow-sm animate-slide-up">
            <div className="text-5xl mb-4">🏙️</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No issues reported yet</h3>
            <p className="text-slate-500 mb-6">Be the first to report a civic issue in your area!</p>
            <Link to="/report">
              <Button variant="primary">Report an Issue</Button>
            </Link>
          </div>
        )}

        {/* Report Grid */}
        {!loading && !error && reports.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {reports.map((report, idx) => (
                <div key={report._id} className="relative">
                  <ReportCard
                    report={report}
                    animationDelay={idx * 50}
                  />
                  {/* Upvote overlay button */}
                  {isAuthenticated && (
                    <button
                      onClick={() => handleUpvote(report._id)}
                      disabled={upvotingId === report._id}
                      className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50"
                    >
                      👍 {report.upvotes || 0}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  onClick={() => fetchReports(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchReports(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}

            <p className="text-center text-sm text-slate-400 pt-3">
              Showing {reports.length} of {pagination.total} report{pagination.total !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
