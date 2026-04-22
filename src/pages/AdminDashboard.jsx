import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, usersAPI, authAPI } from '../services/api';
import ReportCard from '../components/reports/ReportCard';
import FilterBar from '../components/reports/FilterBar';
import { showToast } from '../components/ui/Toast';
import {
  BarChart3, ClipboardList, Users, Plus, Settings,
  FileText, Wrench, CheckCircle, FolderOpen, Zap, Inbox,
} from '../constants/icons';

const DEPARTMENTS = ['roads', 'sanitation', 'water', 'electricity', 'parks', 'traffic', 'general'];

export default function AdminDashboard() {
  // ─── Tabs ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview'); // overview | reports | users | create-staff

  // ─── Overview stats ────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ─── Reports ───────────────────────────────────────────
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({ sort: '-createdAt' });
  const [reportPagination, setReportPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [actionLoading, setActionLoading] = useState(null);

  // ─── Users ─────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({});
  const [userPagination, setUserPagination] = useState({ total: 0, page: 1, pages: 1 });

  // ─── Create Staff ──────────────────────────────────────
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'department', department: 'roads', phone: '' });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffMsg, setStaffMsg] = useState(null);

  // ─── Assignment Modal ──────────────────────────────────
  const [assignModal, setAssignModal] = useState(null); // report object
  const [assignDept, setAssignDept] = useState('');

  // ─── Fetch stats ───────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await reportsAPI.getStats();
      setStats(data);
    } catch {
      // Stats endpoint requires admin — may fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ─── Fetch reports ─────────────────────────────────────
  const fetchReports = useCallback(async (page = 1) => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportFilters.status) params.set('status', reportFilters.status);
      if (reportFilters.category) params.set('category', reportFilters.category);
      if (reportFilters.priority) params.set('priority', reportFilters.priority);
      if (reportFilters.sort) params.set('sort', reportFilters.sort);
      params.set('page', page);
      params.set('limit', '12');

      const data = await reportsAPI.getAll(params.toString());
      setReports(data.reports || []);
      setReportPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch { /* handled */ } finally {
      setReportsLoading(false);
    }
  }, [reportFilters]);

  // ─── Fetch users ───────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userFilters.role) params.set('role', userFilters.role);
      if (userFilters.department) params.set('department', userFilters.department);
      params.set('page', page);
      params.set('limit', '15');

      const data = await usersAPI.getAll(params.toString());
      setUsers(data.users || []);
      setUserPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch { /* handled */ } finally {
      setUsersLoading(false);
    }
  }, [userFilters]);

  // Load on tab switch
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchStats, fetchReports, fetchUsers]);

  // ─── Actions (optimistic local updates) ────────────────
  const handleStatusUpdate = async (reportId, status, note) => {
    // Optimistic: patch the item in local state immediately
    const prevReports = reports;
    setReports((prev) =>
      prev.map((r) =>
        r._id === reportId ? { ...r, status, statusHistory: [...(r.statusHistory || []), { status, changedAt: new Date(), note }] } : r
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

  const handleAssign = async () => {
    if (!assignModal || !assignDept) return;
    const targetId = assignModal._id;

    // Optimistic: update dept + status locally
    const prevReports = reports;
    setReports((prev) =>
      prev.map((r) =>
        r._id === targetId
          ? { ...r, assignedDepartment: assignDept, status: r.status === 'reported' ? 'assigned' : r.status }
          : r
      )
    );
    setAssignModal(null);
    setAssignDept('');
    setActionLoading(targetId);

    try {
      await reportsAPI.assign(targetId, { assignedDepartment: assignDept });
      showToast('Report assigned successfully', 'success', 2500);
    } catch (err) {
      setReports(prevReports);
      showToast(err.message || 'Failed to assign', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUser = async (userId) => {
    // Optimistic: toggle isActive locally
    const prevUsers = users;
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isActive: !u.isActive } : u))
    );

    try {
      await usersAPI.toggleStatus(userId);
    } catch (err) {
      setUsers(prevUsers);
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleRoleChange = async (userId, role, department = null) => {
    // Optimistic: update role locally
    const prevUsers = users;
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, role, ...(department ? { department } : {}) } : u
      )
    );

    try {
      await usersAPI.updateRole(userId, { role, department });
    } catch (err) {
      setUsers(prevUsers);
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffLoading(true);
    setStaffMsg(null);
    try {
      const payload = { ...staffForm };
      if (payload.role !== 'department') delete payload.department;
      const data = await authAPI.createStaff(payload);
      setStaffMsg({ type: 'success', text: data.message || 'Staff account created!' });
      setStaffForm({ name: '', email: '', password: '', role: 'department', department: 'roads', phone: '' });
    } catch (err) {
      setStaffMsg({ type: 'error', text: err.message || 'Failed to create account' });
    } finally {
      setStaffLoading(false);
    }
  };

  // ─── Helper: stat cards ────────────────────────────────
  const getStatValue = (arr, key) => {
    if (!arr) return 0;
    const item = arr.find((s) => s._id === key);
    return item?.count || 0;
  };

  const tabs = [
    { key: 'overview', label: 'Overview', Icon: BarChart3 },
    { key: 'reports', label: 'All Reports', Icon: ClipboardList },
    { key: 'users', label: 'Users', Icon: Users },
    { key: 'create-staff', label: 'Create Staff', Icon: Plus },
  ];

  const inputClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm';

  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg shadow-md">
              <Settings size={20} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-slate-500">System-wide management and analytics</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300 hover:text-purple-600'
              }`}
            >
              <tab.Icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════ OVERVIEW TAB ════════════════ */}
        {activeTab === 'overview' && (
          <div className="animate-slide-up">
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/80 rounded-2xl border border-slate-100 p-5">
                    <div className="skeleton h-8 w-16 rounded-lg mb-2"></div>
                    <div className="skeleton h-4 w-24 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <>
                {/* Top-level stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Reports', value: stats.totalReports, Icon: ClipboardList, color: 'from-blue-500 to-cyan-400' },
                    { label: 'Reported (New)', value: getStatValue(stats.byStatus, 'reported'), Icon: FileText, color: 'from-red-500 to-orange-400' },
                    { label: 'In Progress', value: getStatValue(stats.byStatus, 'in_progress'), Icon: Wrench, color: 'from-amber-500 to-yellow-400' },
                    { label: 'Resolved', value: getStatValue(stats.byStatus, 'resolved'), Icon: CheckCircle, color: 'from-green-500 to-emerald-400' },
                  ].map((stat, i) => (
                    <div key={stat.label} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-5 shadow-sm animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="flex items-center justify-between mb-3">
                        <stat.Icon size={24} className="text-slate-700" aria-hidden="true" />
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} opacity-20`}></div>
                      </div>
                      <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* By Category */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <FolderOpen size={16} className="text-slate-500" aria-hidden="true" /> Reports by Category
                    </h3>
                    <div className="space-y-3">
                      {(stats.byCategory || []).map((item) => {
                        const pct = stats.totalReports ? Math.round((item.count / stats.totalReports) * 100) : 0;
                        return (
                          <div key={item._id} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700 capitalize w-24 truncate">{item._id}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-10 text-right">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Zap size={16} className="text-slate-500" aria-hidden="true" /> Reports by Priority
                    </h3>
                    <div className="space-y-3">
                      {(stats.byPriority || []).map((item) => {
                        const colors = { low: 'from-green-400 to-emerald-400', medium: 'from-amber-400 to-yellow-400', high: 'from-orange-400 to-red-400', critical: 'from-red-500 to-pink-500' };
                        const pct = stats.totalReports ? Math.round((item.count / stats.totalReports) * 100) : 0;
                        return (
                          <div key={item._id} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700 capitalize w-24">{item._id}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${colors[item._id] || 'from-slate-400 to-slate-500'} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-10 text-right">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white/80 rounded-2xl border border-slate-100 p-12 text-center">
                <div className="mb-4"><BarChart3 size={40} className="text-slate-400 mx-auto" aria-hidden="true" /></div>
                <p className="text-slate-500">No statistics available yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ REPORTS TAB ════════════════ */}
        {activeTab === 'reports' && (
          <div className="animate-slide-up">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm">
              <FilterBar filters={reportFilters} onFilterChange={setReportFilters} showSearch={false} />
            </div>

            {reportsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/80 rounded-2xl border border-slate-100 p-6">
                    <div className="skeleton h-5 w-48 rounded-lg mb-2"></div>
                    <div className="skeleton h-4 w-full rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white/80 rounded-2xl border border-slate-100 p-12 text-center">
                <div className="mb-4"><Inbox size={48} className="text-slate-400 mx-auto" aria-hidden="true" /></div>
                <p className="text-slate-500">No reports match the current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report, idx) => (
                  <div key={report._id} className={actionLoading === report._id ? 'opacity-50 pointer-events-none' : ''}>
                    <ReportCard
                      report={report}
                      variant="admin"
                      showActions={true}
                      onStatusUpdate={handleStatusUpdate}
                      onAssign={(r) => { setAssignModal(r); setAssignDept(r.assignedDepartment || ''); }}
                      animationDelay={idx * 50}
                    />
                  </div>
                ))}
                {/* Pagination */}
                {reportPagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button onClick={() => fetchReports(reportPagination.page - 1)} disabled={reportPagination.page <= 1} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50 transition-all">← Prev</button>
                    <span className="text-sm text-slate-500">Page {reportPagination.page} of {reportPagination.pages}</span>
                    <button onClick={() => fetchReports(reportPagination.page + 1)} disabled={reportPagination.page >= reportPagination.pages} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50 transition-all">Next →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════ USERS TAB ════════════════ */}
        {activeTab === 'users' && (
          <div className="animate-slide-up">
            {/* User Filters */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm flex gap-3 flex-wrap">
              <select value={userFilters.role || ''} onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Roles</option>
                <option value="citizen">Citizen</option>
                <option value="department">Department</option>
                <option value="admin">Admin</option>
              </select>
              <select value={userFilters.department || ''} onChange={(e) => setUserFilters({ ...userFilters, department: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/80 rounded-2xl border border-slate-100 p-5">
                    <div className="skeleton h-5 w-32 rounded-lg mb-2"></div>
                    <div className="skeleton h-4 w-48 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white/80 rounded-2xl border border-slate-100 p-12 text-center">
                <div className="mb-4"><Users size={48} className="text-slate-400 mx-auto" aria-hidden="true" /></div>
                <p className="text-slate-500">No users found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u, idx) => {
                  const roleBadge = { admin: 'bg-purple-100 text-purple-700', department: 'bg-amber-100 text-amber-700', citizen: 'bg-blue-100 text-blue-700' };
                  return (
                    <div key={u._id} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                            {u.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge[u.role] || roleBadge.citizen}`}>
                                {u.role}
                              </span>
                              {!u.isActive && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{u.email}{u.department ? ` • ${u.department} dept` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value, e.target.value === 'department' ? u.department || 'general' : null)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700"
                          >
                            <option value="citizen">Citizen</option>
                            <option value="department">Department</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleToggleUser(u._id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.isActive
                                ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {userPagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button onClick={() => fetchUsers(userPagination.page - 1)} disabled={userPagination.page <= 1} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50">← Prev</button>
                    <span className="text-sm text-slate-500">Page {userPagination.page} of {userPagination.pages}</span>
                    <button onClick={() => fetchUsers(userPagination.page + 1)} disabled={userPagination.page >= userPagination.pages} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50">Next →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════ CREATE STAFF TAB ════════════════ */}
        {activeTab === 'create-staff' && (
          <div className="max-w-lg mx-auto animate-slide-up">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-lg"><Plus size={28} aria-hidden="true" /></div>
                <h2 className="text-xl font-extrabold text-slate-900">Create Staff Account</h2>
                <p className="text-sm text-slate-500 mt-1">Add department staff or admin users</p>
              </div>

              {staffMsg && (
                <div className={`mb-6 p-4 rounded-xl text-sm ${staffMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {staffMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</label>
                  <input required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className={inputClass} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</label>
                  <input required type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className={inputClass} placeholder="jane@civicfix.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                  <input required type="password" minLength={6} value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} className={inputClass} placeholder="Min 6 characters" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</label>
                    <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} className={inputClass}>
                      <option value="department">Department Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {staffForm.role === 'department' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Department</label>
                      <select value={staffForm.department} onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })} className={inputClass}>
                        {DEPARTMENTS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone (Optional)</label>
                  <input type="tel" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} className={inputClass} placeholder="+91 98765 43210" />
                </div>
                <button type="submit" disabled={staffLoading} className="w-full btn-gradient mt-2">
                  {staffLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════ ASSIGNMENT MODAL ════════════════ */}
        {assignModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Assign Report</h3>
              <p className="text-sm text-slate-500 mb-4 truncate">{assignModal.trackingId} — {assignModal.title}</p>

              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Department</label>
              <select value={assignDept} onChange={(e) => setAssignDept(e.target.value)} className={`${inputClass} mb-4`}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>

              <div className="flex gap-3">
                <button onClick={handleAssign} disabled={!assignDept} className="flex-1 btn-gradient disabled:opacity-50">
                  Assign
                </button>
                <button onClick={() => setAssignModal(null)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
