import React from 'react';
import LikeButton from '../ui/LikeButton';
import {
  STATUS_CONFIG,
  CATEGORY_ICONS,
  CategoryIcon,
  StatusIcon,
  MapPin,
  Building2,
  Bot,
  Clock,
  Eye,
  Wrench,
  CheckCircle,
  XCircle,
  Pin,
} from '../../constants/icons';

const PRIORITY_CONFIG = {
  low: { color: 'text-[#4f6f6a]', bg: 'bg-[#e7efed]' },
  medium: { color: 'text-[#8c6c2e]', bg: 'bg-[#f4ebd6]' },
  high: { color: 'text-[#8b5d35]', bg: 'bg-[#f4e8da]' },
  critical: { color: 'text-[#7a4334]', bg: 'bg-[#f4e2db]' },
};

const CATEGORY_BADGE_STYLES = {
  roads: 'category-pill-roads',
  sanitation: 'category-pill-sanitation',
  water: 'category-pill-water',
  electricity: 'category-pill-electricity',
  parks: 'category-pill-parks',
  traffic: 'category-pill-traffic',
  other: 'category-pill-other',
};

const ReportCard = React.memo(function ReportCard({
  report,
  variant = 'default', // 'default' | 'compact' | 'admin'
  onStatusUpdate,
  onAssign,
  showActions = false,
  showLikeButton = false,
  userId = null,
  animationDelay = 0,
}) {
  const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.reported;
  const priorityConfig = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.medium;
  const categoryBadgeClass = CATEGORY_BADGE_STYLES[report.category] || CATEGORY_BADGE_STYLES.other;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (variant === 'compact') {
    return (
      <div
        className="bg-[var(--bg-surface)] rounded-[1.1rem] border border-[var(--border-soft)] p-4 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] transition-all duration-300 animate-slide-up"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">{report.trackingId}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                <StatusIcon config={statusConfig} size={12} />
                {statusConfig.label}
              </span>
            </div>
            <h4 className="font-semibold text-stone-800 text-sm truncate">{report.title}</h4>
          </div>
          <span className="text-xs text-slate-400 shrink-0">{formatDate(report.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[var(--bg-surface)] rounded-[1.4rem] border border-[var(--border-soft)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] transition-all duration-300 animate-slide-up overflow-hidden"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-slate-400">{report.trackingId}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">{formatDate(report.createdAt)}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${priorityConfig.color} ${priorityConfig.bg}`}>
                {report.priority}
              </span>
            </div>
            <h3 className="text-base font-bold text-stone-800">{report.title}</h3>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
            <StatusIcon config={statusConfig} size={12} />
            {statusConfig.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-stone-600 mb-3 line-clamp-2">{report.description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--text-secondary)]">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 capitalize ${categoryBadgeClass}`}>
            <CategoryIcon category={report.category} size={14} className="opacity-80" />
            <span>{report.category}</span>
          </span>
          {report.location?.address && (
            <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
              <MapPin size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
              {report.location.address}
            </span>
          )}
          {report.assignedDepartment && (
            <span className="inline-flex items-center gap-1 capitalize">
              <Building2 size={13} className="text-slate-400" aria-hidden="true" />
              {report.assignedDepartment}
            </span>
          )}

          {/* Self-contained LikeButton or static count */}
          {showLikeButton ? (
            <div className="ml-auto">
              <LikeButton
                postId={report._id}
                initialCount={report.upvotes || 0}
                initialLiked={userId ? (report.upvotedBy || []).includes(userId) : false}
              />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1">
              <LikeButton
                postId={report._id}
                initialCount={report.upvotes || 0}
                initialLiked={false}
                disabled={true}
              />
            </span>
          )}
        </div>

        {/* AI Tags */}
        {report.aiTags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {report.aiTags.slice(0, 5).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-[var(--bg-muted)] border border-[var(--border-soft)] text-[var(--text-secondary)] rounded-full text-[10px] font-medium capitalize">
                {tag.replace(/-/g, ' ')}
              </span>
            ))}
            {report.aiConfidence && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] rounded-full text-[10px] font-medium border border-[var(--border-soft)]">
                <Bot size={10} aria-hidden="true" />
                {Math.round(report.aiConfidence * 100)}%
              </span>
            )}
          </div>
        )}

        {/* ETA */}
        {report.estimatedResolutionTime && report.status !== 'resolved' && report.status !== 'closed' && (
          <p className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-2">
            <Clock size={11} aria-hidden="true" />
            Est. resolution: {new Date(report.estimatedResolutionTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        )}

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
            <div className="w-5 h-5 bg-stone-200 rounded-md flex items-center justify-center text-stone-700 font-bold text-[10px]">
              {report.reporter.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <span>{report.reporter.name || 'Anonymous'}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="px-5 py-3 bg-[var(--bg-muted)]/70 border-t border-[var(--border-soft)] flex items-center gap-2 flex-wrap">
          {onStatusUpdate && report.status !== 'resolved' && report.status !== 'closed' && (
            <>
              {report.status === 'reported' && (
                <button
                  onClick={() => onStatusUpdate(report._id, 'acknowledged', 'Report acknowledged')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4ebd6] border border-[#e4d6b5] text-[#8c6c2e] rounded-xl text-xs font-semibold hover:bg-[#efe0bf] transition-colors"
                >
                  <Eye size={13} aria-hidden="true" /> Acknowledge
                </button>
              )}
              {(report.status === 'reported' || report.status === 'acknowledged' || report.status === 'assigned') && (
                <button
                  onClick={() => onStatusUpdate(report._id, 'in_progress', 'Work has started')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e7efed] border border-[#cfded8] text-[#4b625e] rounded-xl text-xs font-semibold hover:bg-[#dce8e5] transition-colors"
                >
                  <Wrench size={13} aria-hidden="true" /> Start Work
                </button>
              )}
              {report.status === 'in_progress' && (
                <button
                  onClick={() => onStatusUpdate(report._id, 'resolved', 'Issue resolved')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e7efe4] border border-[#cfdcc2] text-[#4e6a45] rounded-xl text-xs font-semibold hover:bg-[#dce8d2] transition-colors"
                >
                  <CheckCircle size={13} aria-hidden="true" /> Mark Resolved
                </button>
              )}
              <button
                onClick={() => onStatusUpdate(report._id, 'rejected', 'Report rejected')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle size={13} aria-hidden="true" /> Reject
              </button>
            </>
          )}
          {onAssign && (
            <button
              onClick={() => onAssign(report)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#efe7dc] border border-[#e1d4c3] text-[#6d5c4c] rounded-xl text-xs font-semibold hover:bg-[#e5dccf] transition-colors ml-auto"
            >
              <Pin size={13} aria-hidden="true" /> Assign
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default ReportCard;
