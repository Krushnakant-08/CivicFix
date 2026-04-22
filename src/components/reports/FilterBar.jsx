import React from 'react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'roads', label: 'Roads' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'water', label: 'Water' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'parks', label: 'Parks' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'reported', label: 'Reported' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
];

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-upvotes', label: 'Most Upvoted' },
  { value: '-priority', label: 'Priority (High→Low)' },
];

export default function FilterBar({
  filters,
  onFilterChange,
  showCategory = true,
  showStatus = true,
  showPriority = true,
  showSort = true,
  showSearch = false,
  compact = false,
}) {
  const selectClass = `bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer ${compact ? 'py-1.5 text-xs' : ''}`;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {showSearch && (
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search reports..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className={`${selectClass} pl-9 w-full`}
          />
        </div>
      )}

      {showCategory && (
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
          className={selectClass}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      )}

      {showStatus && (
        <select
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className={selectClass}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}

      {showPriority && (
        <select
          value={filters.priority || ''}
          onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
          className={selectClass}
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      )}

      {showSort && (
        <select
          value={filters.sort || '-createdAt'}
          onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
          className={selectClass}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}

      {/* Reset filters */}
      {(filters.category || filters.status || filters.priority || filters.search) && (
        <button
          onClick={() => onFilterChange({ sort: filters.sort || '-createdAt' })}
          className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          ✕ Reset
        </button>
      )}
    </div>
  );
}
