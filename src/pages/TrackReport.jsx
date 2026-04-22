import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import {
  STATUS_CONFIG, StatusIcon,
  Bot, ThumbsUp, AlertTriangle,
} from '../constants/icons';

export default function TrackReport() {
  const [trackingId, setTrackingId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await reportsAPI.track(trackingId.trim());
      setReport(data.report);
    } catch (err) {
      setError(err.message || 'Report not found. Please check your tracking ID.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300';

  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Search Card */}
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 relative overflow-hidden animate-slide-up rounded-3xl shadow-xl border border-slate-100 mb-8">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl -z-10 animate-float"></div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Track Your Report</h2>
            <p className="text-slate-500 mt-2">Enter your tracking ID to check the current status</p>
          </div>

          <form onSubmit={handleTrack} className="flex gap-3">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => { setTrackingId(e.target.value); setError(null); }}
              className={inputClass}
              placeholder="e.g. CF-260406-A1B2C"
              autoFocus
            />
            <Button variant="primary" type="submit" disabled={loading} className="shrink-0 px-6">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Track'
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3 animate-slide-up">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Report Result */}
        {report && (
          <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-mono text-slate-400 mb-1">{report.trackingId}</p>
                <h3 className="text-2xl font-bold text-slate-900">{report.title}</h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_CONFIG[report.status]?.color || 'bg-slate-100 text-slate-700'}`}>
                <StatusIcon config={STATUS_CONFIG[report.status]} size={14} /> {STATUS_CONFIG[report.status]?.label || report.status}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                <p className="text-slate-900 font-medium capitalize">{report.category}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                <p className="text-slate-900 font-medium capitalize">{report.priority}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                <p className="text-slate-900 font-medium">{report.location?.address}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                <p className="text-slate-900 font-medium capitalize">{report.assignedDepartment || 'Pending'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-slate-700 leading-relaxed">{report.description}</p>
            </div>

            {/* Status Timeline */}
            {report.statusHistory && report.statusHistory.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Status Timeline</p>
                <div className="space-y-3">
                  {report.statusHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1.5">
                        <div className={`w-3 h-3 rounded-full ${idx === report.statusHistory.length - 1 ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm capitalize">{entry.status?.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(entry.changedAt).toLocaleString()}
                          </span>
                        </div>
                        {entry.note && <p className="text-slate-500 text-sm mt-0.5">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {(report.aiTags?.length > 0 || report.estimatedResolutionTime || report.isDuplicate) && (
              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={16} className="text-indigo-500" aria-hidden="true" />
                  <h4 className="text-xs font-bold text-slate-700">AI Analysis</h4>
                  {report.aiConfidence && (
                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full ml-auto">
                      {Math.round(report.aiConfidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400 font-medium">Severity</p>
                    <p className="text-sm font-bold text-slate-700">{report.severity || '—'}/10</p>
                  </div>
                  {report.estimatedResolutionTime && report.status !== 'resolved' && report.status !== 'closed' && (
                    <div className="bg-white/60 rounded-lg p-2">
                      <p className="text-[10px] text-slate-400 font-medium">Est. Resolution</p>
                      <p className="text-sm font-bold text-slate-700">
                        {new Date(report.estimatedResolutionTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )}
                </div>
                {report.aiTags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {report.aiTags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-white/80 border border-indigo-100 text-indigo-600 rounded text-[10px] font-medium capitalize">
                        {tag.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {report.isDuplicate && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" aria-hidden="true" /> This report may be a duplicate of an existing issue.
                  </div>
                )}
              </div>
            )}

            {/* Submitted info */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-400">
              <span>Submitted: {new Date(report.createdAt).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1"><ThumbsUp size={13} className="text-slate-400" aria-hidden="true" /> {report.upvotes || 0} upvotes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
