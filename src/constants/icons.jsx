/**
 * Shared icon configuration — single source of truth for all status/category icons.
 * Uses Lucide React icons instead of emojis for a professional, consistent UI.
 */
import {
  FileText, Eye, Pin, Wrench, CheckCircle, Archive, XCircle,
  Route, Trash2, Droplets, Lightbulb, TreePine, TrafficCone, ClipboardList,
  AlertTriangle, ThumbsUp, MapPin, Building2, Bot, Clock, Zap,
  BarChart3, Settings, Users, UserPlus, FolderOpen, Target,
  TrendingUp, TrendingDown, Calendar, Flame, Map, Sparkles, Search, Inbox,
  RefreshCw, FilePlus, Bell, Info, CheckCircle2,
  Plus, CircleDot, Timer, ArrowUpRight, ArrowDownRight, ArrowRight,
  Building, LogOut, PartyPopper, CircleAlert, Crosshair, MailPlus,
} from 'lucide-react';

// ─── Status icon config ──────────────────────────────────
// Used in: ReportCard, MyReports, TrackReport, DepartmentDashboard, AdminDashboard
export const STATUS_CONFIG = {
  reported:     { label: 'Reported',     color: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    Icon: FileText },
  acknowledged: { label: 'Acknowledged', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', Icon: Eye },
  assigned:     { label: 'Assigned',     color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500',  Icon: Pin },
  in_progress:  { label: 'In Progress',  color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',   Icon: Wrench },
  resolved:     { label: 'Resolved',     color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  Icon: CheckCircle },
  closed:       { label: 'Closed',       color: 'bg-slate-100 text-slate-700',  dot: 'bg-slate-500',  Icon: Archive },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-700',     dot: 'bg-red-500',    Icon: XCircle },
};

// ─── Category icon config ────────────────────────────────
// Used in: ReportCard, MyReports, ReportIssue, MapView, AnalyticsDashboard
export const CATEGORY_ICONS = {
  roads:       Route,
  sanitation:  Trash2,
  water:       Droplets,
  electricity: Lightbulb,
  parks:       TreePine,
  traffic:     TrafficCone,
  other:       ClipboardList,
};

// ─── Notification type icons ─────────────────────────────
export const NOTIFICATION_ICONS = {
  status_change:   { Icon: RefreshCw,   color: 'bg-blue-500' },
  report_assigned: { Icon: ClipboardList, color: 'bg-amber-500' },
  report_upvoted:  { Icon: ThumbsUp,    color: 'bg-green-500' },
  new_report:      { Icon: FilePlus,    color: 'bg-indigo-500' },
  report_resolved: { Icon: CheckCircle2, color: 'bg-emerald-500' },
  system:          { Icon: Settings,    color: 'bg-slate-500' },
};

// ─── Analytics category config (with colors) ─────────────
export const ANALYTICS_CATEGORIES = {
  roads:       { Icon: Route,        color: '#ef4444' },
  sanitation:  { Icon: Trash2,       color: '#22c55e' },
  water:       { Icon: Droplets,     color: '#3b82f6' },
  electricity: { Icon: Lightbulb,    color: '#eab308' },
  parks:       { Icon: TreePine,     color: '#a855f7' },
  traffic:     { Icon: TrafficCone,  color: '#f97316' },
  other:       { Icon: ClipboardList, color: '#64748b' },
};

// ─── Re-exports for convenience ──────────────────────────
export {
  AlertTriangle, ThumbsUp, MapPin, Building2, Bot, Clock, Zap,
  BarChart3, Settings, Users, UserPlus, FolderOpen, Target,
  TrendingUp, TrendingDown, Calendar, Flame, Map, Sparkles, Search, Inbox,
  FileText, Eye, Pin, Wrench, CheckCircle, Archive, XCircle,
  Route, Trash2, Droplets, Lightbulb, TreePine, TrafficCone, ClipboardList,
  RefreshCw, FilePlus, Bell, Info, CheckCircle2,
  Plus, CircleDot, Timer, ArrowUpRight, ArrowDownRight, ArrowRight,
  Building, LogOut, PartyPopper, CircleAlert, Crosshair, MailPlus,
};

/**
 * Inline icon helper — renders a Lucide icon with consistent defaults.
 * Usage: <StatusIcon config={STATUS_CONFIG.reported} size={14} />
 */
export function StatusIcon({ config, size = 14, className = '' }) {
  if (!config?.Icon) return null;
  const IconComp = config.Icon;
  return <IconComp size={size} className={className} aria-hidden="true" />;
}

export function CategoryIcon({ category, size = 16, className = '' }) {
  const IconComp = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  return <IconComp size={size} className={className} aria-hidden="true" />;
}
