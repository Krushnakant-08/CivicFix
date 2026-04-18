import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * AuditTrail — Phase 8.2
 * Admin page to view the blockchain audit log and verify chain integrity.
 */
export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [chainStatus, setChainStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState({ action: '', from: '', to: '' });
  const [expandedLog, setExpandedLog] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter.action) params.append('action', filter.action);
      if (filter.from) params.append('from', filter.from);
      if (filter.to) params.append('to', filter.to);

      const res = await fetch(`${API}/audit?${params}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/audit/stats`, { headers });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {}
  };

  const verifyChain = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`${API}/audit/verify`, { headers });
      const data = await res.json();
      setChainStatus(data);
    } catch {
      setChainStatus({ valid: false, message: 'Verification request failed' });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ACTION_COLORS = {
    REPORT_CREATED: 'bg-blue-100 text-blue-700',
    STATUS_CHANGED: 'bg-amber-100 text-amber-700',
    REPORT_ASSIGNED: 'bg-violet-100 text-violet-700',
    REPORT_RESOLVED: 'bg-green-100 text-green-700',
    REPORT_UPVOTED: 'bg-pink-100 text-pink-700',
    REPORT_ANALYZED: 'bg-cyan-100 text-cyan-700',
    USER_REGISTERED: 'bg-emerald-100 text-emerald-700',
    USER_LOGIN: 'bg-slate-100 text-slate-600',
    ADMIN_ACTION: 'bg-red-100 text-red-700',
    default: 'bg-gray-100 text-gray-600',
  };

  const getActionColor = (action) => ACTION_COLORS[action] || ACTION_COLORS.default;

  const formatHash = (hash) =>
    hash ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : '—';

  return (
    <div className="min-h-screen bg-mesh px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center text-xl">
              🔗
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Blockchain Audit Trail</h1>
              <p className="text-slate-500 text-sm">Immutable SHA-256 hash-chained log of all system actions</p>
            </div>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalEntries?.toLocaleString()}</div>
              <div className="text-slate-500 text-xs mt-1">Total Blocks</div>
            </div>
            {stats.byAction?.slice(0, 3).map((a) => (
              <div key={a._id} className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-violet-600">{a.count}</div>
                <div className="text-slate-500 text-xs mt-1 truncate">{a._id}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Chain Verification ─────────────────────────── */}
        <div className="glass-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <span>⛓️</span> Chain Integrity
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Recomputes every SHA-256 hash to detect tampering
              </p>
            </div>
            {chainStatus && (
              <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                chainStatus.valid
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {chainStatus.message}
              </div>
            )}
            <button
              onClick={verifyChain}
              disabled={verifying}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              {verifying ? '⏳ Verifying…' : '✅ Verify Chain'}
            </button>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────── */}
        <div className="glass-card p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filter.action}
              onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))}
              className="flex-1 px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Actions</option>
              <option value="REPORT_CREATED">Report Created</option>
              <option value="STATUS_CHANGED">Status Changed</option>
              <option value="REPORT_ASSIGNED">Report Assigned</option>
              <option value="REPORT_UPVOTED">Report Upvoted</option>
              <option value="REPORT_ANALYZED">Report Analyzed</option>
              <option value="USER_REGISTERED">User Registered</option>
              <option value="USER_LOGIN">User Login</option>
              <option value="ADMIN_ACTION">Admin Action</option>
            </select>
            <input
              type="date"
              value={filter.from}
              onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))}
              className="flex-1 px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="From date"
            />
            <input
              type="date"
              value={filter.to}
              onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))}
              className="flex-1 px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="To date"
            />
            <button
              onClick={() => { setPage(1); fetchLogs(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Filter
            </button>
            <button
              onClick={() => { setFilter({ action: '', from: '', to: '' }); setPage(1); }}
              className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── Log Table ──────────────────────────────────── */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-spin text-4xl mb-3">⏳</div>
              Loading audit logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl mb-3">📭</div>
              No audit logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-4 py-3 text-left text-slate-500 font-medium w-16">#</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium">Action</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium">Actor</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium hidden md:table-cell">Hash</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium hidden lg:table-cell">Prev. Hash</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium">Timestamp</th>
                    <th className="px-4 py-3 text-left text-slate-500 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <>
                      <tr
                        key={log._id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                      >
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{log.blockIndex}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getActionColor(log.action)}`}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-medium">{log.actor?.username || 'system'}</div>
                          <div className="text-xs text-slate-400">{log.actor?.role}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">
                          {formatHash(log.hash)}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-xs hidden lg:table-cell">
                          {formatHash(log.previousHash)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {expandedLog === log._id ? '▲' : '▼'}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expandedLog === log._id && (
                        <tr key={`${log._id}-detail`} className="bg-slate-50/80">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="space-y-2 text-xs font-mono text-slate-600">
                              <div>
                                <span className="font-semibold text-slate-500 font-sans">Block Hash: </span>
                                <span className="break-all">{log.hash}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-500 font-sans">Previous Hash: </span>
                                <span className="break-all">{log.previousHash}</span>
                              </div>
                              {log.reportId && (
                                <div>
                                  <span className="font-semibold text-slate-500 font-sans">Report ID: </span>
                                  {log.reportId}
                                </div>
                              )}
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div>
                                  <span className="font-semibold text-slate-500 font-sans block mb-1">Metadata:</span>
                                  <pre className="bg-white/70 rounded-lg p-3 overflow-auto max-h-40 text-xs">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {pagination.totalLogs?.toLocaleString()} total · Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
