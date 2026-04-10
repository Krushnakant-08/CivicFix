import React from 'react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  reported: { label: 'Reported', color: 'bg-red-100 text-red-700', icon: '📝' },
  acknowledged: { label: 'Acknowledged', color: 'bg-orange-100 text-orange-700', icon: '👁️' },
  assigned: { label: 'Assigned', color: 'bg-amber-100 text-amber-700', icon: '📌' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: '🔧' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: '✅' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700', icon: '📁' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '❌' },
};

const PRIORITY_CONFIG = {
  low: { color: 'text-green-600', bg: 'bg-green-50' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50' },
  high: { color: 'text-orange-600', bg: 'bg-orange-50' },
  critical: { color: 'text-red-600', bg: 'bg-red-50' },
};

const CATEGORY_ICONS = {
  roads: '🛣️', sanitation: '🗑️', water: '💧', electricity: '💡',
  parks: '🌳', traffic: '🚦', other: '📋',
};

export default function ReportCard({
  report,
  variant = 'default', // 'default' | 'compact' | 'admin'
  onStatusUpdate,
  onAssign,
  showActions = false,
  animationDelay = 0,
}) {
  const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.reported;
  const priorityConfig = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.medium;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (variant === 'compact') {
    return (
      <div
        className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow duration-300 animate-slide-up"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">{report.trackingId}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>
            <h4 className="font-semibold text-slate-900 text-sm truncate">{report.title}</h4>
          </div>
          <span className="text-xs text-slate-400 shrink-0">{formatDate(report.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 animate-slide-up overflow-hidden"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-slate-400">{report.trackingId}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400">{formatDate(report.createdAt)}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${priorityConfig.color} ${priorityConfig.bg}`}>
                {report.priority}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{report.title}</h3>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{report.description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
          <span className="flex items-center gap-1">
            {CATEGORY_ICONS[report.category] || '📋'}
            <span className="capitalize">{report.category}</span>
          </span>
          {report.location?.address && (
            <span className="truncate max-w-[200px]">📍 {report.location.address}</span>
          )}
          {report.assignedDepartment && (
            <span className="capitalize">🏢 {report.assignedDepartment}</span>
          )}
          <span>👍 {report.upvotes || 0}</span>
        </div>

        {/* Images thumbnails */}
        {report.images && report.images.length > 0 && (
          <div className="flex gap-2 mt-3">
            {report.images.slice(0, 3).map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt=""
                className="w-12 h-12 object-cover rounded-lg border border-slate-200"
              />
            ))}
            {report.images.length > 3 && (
              <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">
                +{report.images.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Reporter info (admin variant) */}
        {variant === 'admin' && report.reporter && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-teal-400 rounded-md flex items-center justify-center text-white font-bold text-[10px]">
              {report.reporter.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <span>{report.reporter.name || 'Anonymous'}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          {onStatusUpdate && report.status !== 'resolved' && report.status !== 'closed' && (
            <>
              {report.status === 'reported' && (
                <button
                  onClick={() => onStatusUpdate(report._id, 'acknowledged', 'Report acknowledged')}
                  className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors"
                >
                  👁️ Acknowledge
                </button>
              )}
              {(report.status === 'reported' || report.status === 'acknowledged' || report.status === 'assigned') && (
                <button
                  onClick={() => onStatusUpdate(report._id, 'in_progress', 'Work has started')}
                  className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  🔧 Start Work
                </button>
              )}
              {report.status === 'in_progress' && (
                <button
                  onClick={() => onStatusUpdate(report._id, 'resolved', 'Issue resolved')}
                  className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                >
                  ✅ Mark Resolved
                </button>
              )}
              <button
                onClick={() => onStatusUpdate(report._id, 'rejected', 'Report rejected')}
                className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                ❌ Reject
              </button>
            </>
          )}
          {onAssign && (
            <button
              onClick={() => onAssign(report)}
              className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors ml-auto"
            >
              📌 Assign
            </button>
          )}
        </div>
      )}
    </div>
  );
}
