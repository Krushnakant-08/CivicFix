import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../services/api';
import ReportCard from '../components/reports/ReportCard';
import FilterBar from '../components/reports/FilterBar';
import { showToast } from '../components/ui/Toast';
import {
  CircleDot, Wrench, CheckCircle, BarChart3,
  Building, AlertTriangle, Inbox,
} from '../constants/icons';

const STATUS_COUNTS_INIT = { reported: 0, acknowledged: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0 };

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', sort: '-createdAt' });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [statusCounts, setStatusCounts] = useState(STATUS_COUNTS_INIT);
  const [actionLoading, setActionLoading] = useState(null);

  const department = user?.department;

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (department) params.set('department', department);
      if (filters.status) params.set('status', filters.status);
      if (filters.sort) params.set('sort', filters.sort);
      params.set('page', page);
      params.set('limit', '15');

      const data = await reportsAPI.getAll(params.toString());
      setReports(data.reports || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });

      // Calculate status counts from all department reports
      const allData = await reportsAPI.getAll(`department=${department}&limit=500`);
      const counts = { ...STATUS_COUNTS_INIT };
      (allData.reports || []).forEach((r) => {
        if (counts[r.status] !== undefined) counts[r.status]++;
      });
      setStatusCounts(counts);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [department, filters]);

  useEffect(() => {
    if (department) fetchReports();
  }, [department, fetchReports]);

  const handleStatusUpdate = async (reportId, status, note) => {
    // Optimistic: patch the item in local state immediately
    const prevReports = reports;
    setReports((prev) =>
      prev.map((r) =>
        r._id === reportId
          ? { ...r, status, statusHistory: [...(r.statusHistory || []), { status, changedAt: new Date(), note }] }
          : r
      )
    );
    setActionLoading(reportId);

    try {
      await reportsAPI.updateStatus(reportId, { status, note });
      showToast(`Status updated to '${status}'`, 'success', 2500);
    } catch (err) {
      // Revert on failure
      setReports(prevReports);
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const totalOpen = statusCounts.reported + statusCounts.acknowledged + statusCounts.assigned + statusCounts.in_progress;
  const totalResolved = statusCounts.resolved + statusCounts.closed;

  const stats = [
    { label: 'Open Issues', value: totalOpen, Icon: CircleDot, color: 'from-red-500 to-orange-400' },
    { label: 'In Progress', value: statusCounts.in_progress, Icon: Wrench, color: 'from-blue-500 to-cyan-400' },
    { label: 'Resolved', value: totalResolved, Icon: CheckCircle, color: 'from-green-500 to-emerald-400' },
    { label: 'Total Assigned', value: Object.values(statusCounts).reduce((a, b) => a + b, 0), Icon: BarChart3, color: 'from-purple-500 to-indigo-400' },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center text-white text-lg shadow-md">
              <Building size={20} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Department Dashboard</h1>
              <p className="text-slate-500 capitalize">{department || 'No department assigned'} Department</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-5 shadow-sm animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <stat.Icon size={24} className="text-slate-700" aria-hidden="true" />
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} opacity-20`}></div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm animate-slide-up" style={{ animationDelay: '300ms' }}>
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            showCategory={false}
            showPriority={false}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/80 rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="skeleton h-5 w-48 rounded-lg mb-2"></div>
                <div className="skeleton h-4 w-full rounded-lg mb-2"></div>
                <div className="skeleton h-4 w-3/4 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-white/80 rounded-2xl border border-red-100 p-8 text-center">
            <div className="mb-4"><AlertTriangle size={40} className="text-red-400 mx-auto" aria-hidden="true" /></div>
            <p className="text-slate-700 font-semibold mb-2">Failed to load reports</p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button onClick={() => fetchReports()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && reports.length === 0 && (
          <div className="bg-white/80 rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="mb-4"><Inbox size={48} className="text-slate-400 mx-auto" aria-hidden="true" /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No reports found</h3>
            <p className="text-slate-500">
              {filters.status
                ? 'No reports match the selected filter. Try a different status.'
                : `No reports assigned to the ${department} department yet.`}
            </p>
          </div>
        )}

        {/* Reports list */}
        {!loading && !error && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <div key={report._id} className={actionLoading === report._id ? 'opacity-50 pointer-events-none' : ''}>
                <ReportCard
                  report={report}
                  variant="admin"
                  showActions={true}
                  onStatusUpdate={handleStatusUpdate}
                  animationDelay={idx * 60}
                />
              </div>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => fetchReports(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <span className="text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</span>
                <button
                  onClick={() => fetchReports(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
