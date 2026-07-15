import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { reportsAPI } from '../services/api';

// ─── Constants ───────────────────────────────────────────
const DEFAULT_CENTER = [18.5204, 73.8567]; // Pune, India
const DEFAULT_ZOOM = 12;

const CATEGORIES = [
  { value: 'roads',       label: 'Roads' },
  { value: 'sanitation',  label: 'Sanitation' },
  { value: 'water',       label: 'Water' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'parks',       label: 'Parks' },
  { value: 'traffic',     label: 'Traffic' },
  { value: 'other',       label: 'Other' },
];

const STATUSES = [
  { value: 'reported',     label: 'Reported' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'assigned',     label: 'Assigned' },
  { value: 'in_progress',  label: 'In Progress' },
  { value: 'resolved',     label: 'Resolved' },
  { value: 'closed',       label: 'Closed' },
];

const PRIORITIES = [
  { value: 'low',      label: 'Low',      color: '#22c55e' },
  { value: 'medium',   label: 'Medium',   color: '#eab308' },
  { value: 'high',     label: 'High',     color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

const CATEGORY_COLORS = {
  roads:       { bg: '#ef4444', ring: '#fca5a5' },
  sanitation:  { bg: '#22c55e', ring: '#86efac' },
  water:       { bg: '#3b82f6', ring: '#93c5fd' },
  electricity: { bg: '#eab308', ring: '#fde047' },
  parks:       { bg: '#a855f7', ring: '#c4b5fd' },
  traffic:     { bg: '#f97316', ring: '#fdba74' },
  other:       { bg: '#64748b', ring: '#cbd5e1' },
};

// ─── Custom Marker Icon (SVG drop pin) ───────────────────
const createCategoryIcon = (category) => {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" fill="none">
      <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
      </filter>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z" fill="${colors.bg}" filter="url(#shadow)"/>
      <circle cx="16" cy="15" r="7" fill="white" opacity="0.9"/>
      <circle cx="16" cy="15" r="4.5" fill="${colors.bg}"/>
    </svg>`;

  return L.divIcon({
    className: 'civicfix-marker',
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

// ─── Custom Cluster Icon ─────────────────────────────────
const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size, fontSize, bgColor;

  if (count < 10) {
    size = 40; fontSize = 13; bgColor = 'rgba(20, 184, 166, 0.85)';
  } else if (count < 50) {
    size = 48; fontSize = 14; bgColor = 'rgba(37, 99, 235, 0.85)';
  } else {
    size = 56; fontSize = 15; bgColor = 'rgba(99, 102, 241, 0.9)';
  }

  return L.divIcon({
    html: `<div style="
      width: ${size}px; height: ${size}px;
      display: flex; align-items: center; justify-content: center;
      background: ${bgColor};
      border: 3px solid rgba(255,255,255,0.8);
      border-radius: 50%;
      color: white; font-weight: 700; font-size: ${fontSize}px;
      font-family: 'Outfit', sans-serif;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25), 0 0 0 4px ${bgColor.replace(/[\d.]+\)$/, '0.25)')};
      transition: transform 0.2s;
    ">${count}</div>`,
    className: 'civicfix-cluster',
    iconSize: L.point(size, size, true),
  });
};

// ─── Map sub-components ──────────────────────────────────

/** Flies the map to a lat/lng smoothly */
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || map.getZoom(), { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

/** Canvas-based heatmap layer for Leaflet */
function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const layer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.35,
      gradient: { 0.2: '#3b82f6', 0.45: '#06b6d4', 0.65: '#22c55e', 0.8: '#eab308', 1.0: '#ef4444' },
    });
    layer.addTo(map);
    return () => map.removeLayer(layer);
  }, [map, points]);
  return null;
}

// ─── Helpers ─────────────────────────────────────────────
const statusStyle = (status) => {
  const map = {
    reported:     'bg-slate-100 text-slate-700',
    acknowledged: 'bg-teal-50 text-teal-700',
    assigned:     'bg-stone-50 text-stone-700',
    in_progress:  'bg-amber-50 text-amber-700',
    resolved:     'bg-emerald-50 text-emerald-700',
    closed:       'bg-slate-100 text-slate-500',
  };
  return map[status] || map.reported;
};

const priorityStyle = (p) => {
  const map = {
    low:      'bg-green-50 text-green-700',
    medium:   'bg-yellow-50 text-yellow-700',
    high:     'bg-orange-50 text-orange-700',
    critical: 'bg-red-50 text-red-700',
  };
  return map[p] || map.medium;
};

const formatLabel = (s) => s?.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) || '';

// ─── Main Component ─────────────────────────────────────
export default function MapView() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // View mode
  const [isHeatmap, setIsHeatmap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fly-to target
  const [flyTarget, setFlyTarget] = useState(null);

  // ─── Fetch map data on filter change ─────────────────
  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filterStatus)   params.append('status', filterStatus);
        if (filterCategory) params.append('category', filterCategory);
        if (filterPriority) params.append('priority', filterPriority);
        const data = await reportsAPI.getMapData(params.toString());
        setReports(data.reports || []);
      } catch (err) {
        console.error('Map data error:', err);
        setError('Failed to load map data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMapData();
  }, [filterStatus, filterCategory, filterPriority]);

  // ─── Derived data ────────────────────────────────────
  const validReports = useMemo(
    () => reports.filter(r => r.location?.coordinates?.lat && r.location?.coordinates?.lng),
    [reports],
  );

  const heatPoints = useMemo(
    () => validReports.map(r => [
      r.location.coordinates.lat,
      r.location.coordinates.lng,
      Math.min((r.upvotes || 0) * 0.15 + 0.5, 1), // intensity weighted by upvotes
    ]),
    [validReports],
  );

  const activeFilterCount = [filterStatus, filterCategory, filterPriority].filter(Boolean).length;

  // ─── Near Me ─────────────────────────────────────────
  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setFlyTarget([coords.latitude, coords.longitude]),
      () => setError('Could not get your location. Check browser permissions.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // ─── Clear all filters ──────────────────────────────
  const clearFilters = () => {
    setFilterStatus('');
    setFilterCategory('');
    setFilterPriority('');
  };

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="map-page">
      {/* ── Mobile filter toggle ── */}
      <button
        className="map-mobile-filter-btn md:hidden"
        onClick={() => setShowFilters(v => !v)}
        aria-label="Toggle filters"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className="map-filter-badge">{activeFilterCount}</span>
        )}
      </button>

      {/* ── Filter Panel ── */}
      <div className={`map-filter-panel ${showFilters ? 'map-filter-panel--open' : ''}`}>
        {/* Header */}
        <div className="map-filter-header">
          <div>
            <h2 className="map-filter-title">Filters</h2>
            <p className="map-filter-subtitle">{validReports.length} issues on map</p>
          </div>
          <button className="map-filter-close md:hidden" onClick={() => setShowFilters(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="map-filter-body">
          {/* View mode toggle */}
          <div className="map-toggle-group">
            <label className="map-filter-label">View Mode</label>
            <div className="map-toggle">
              <button
                className={`map-toggle-btn ${!isHeatmap ? 'map-toggle-btn--active' : ''}`}
                onClick={() => setIsHeatmap(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Pins
              </button>
              <button
                className={`map-toggle-btn ${isHeatmap ? 'map-toggle-btn--active map-toggle-btn--heat' : ''}`}
                onClick={() => setIsHeatmap(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c-4.97 0-9-2.24-9-5v0c0-3.31 4.03-6 9-6s9 2.69 9 6v0c0 2.76-4.03 5-9 5z" opacity="0.3"/>
                  <path d="M12 2L8 8c-2 3 0 6 4 6s6-3 4-6L12 2z"/>
                </svg>
                Heatmap
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="map-filter-label">Category</label>
            <select
              className="map-select"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="map-filter-label">Status</label>
            <select
              className="map-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="map-filter-label">Priority</label>
            <select
              className="map-select"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          {activeFilterCount > 0 && (
            <button className="map-clear-btn" onClick={clearFilters}>
              Clear all filters
            </button>
          )}

          <div className="map-filter-divider" />

          {/* Near Me */}
          <button className="map-nearme-btn" onClick={handleNearMe}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
              <path d="M18.364 5.636l-2.121 2.121M7.757 16.243l-2.121 2.121M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121"/>
            </svg>
            Near Me
          </button>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <h3 className="map-legend-title">Category Legend</h3>
          <div className="map-legend-grid">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                className={`map-legend-item ${filterCategory === c.value ? 'map-legend-item--active' : ''}`}
                onClick={() => setFilterCategory(prev => prev === c.value ? '' : c.value)}
              >
                <span
                  className="map-legend-dot"
                  style={{ backgroundColor: CATEGORY_COLORS[c.value].bg }}
                />
                <span className="map-legend-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map container ── */}
      <div className="map-canvas-wrapper">
        {/* Loading overlay */}
        {isLoading && (
          <div className="map-loading-overlay">
            <div className="map-spinner" />
            <p className="map-loading-text">Loading map data…</p>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="map-error-toast">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="map-error-dismiss">✕</button>
          </div>
        )}

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="map-leaflet"
          zoomControl={false}
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <ZoomControl position="bottomleft" />

          {flyTarget && <FlyTo center={flyTarget} zoom={15} />}

          {!isHeatmap ? (
            <MarkerClusterGroup
              chunkedLoading
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              zoomToBoundsOnClick
              maxClusterRadius={60}
              iconCreateFunction={createClusterIcon}
              animate
            >
              {validReports.map(report => (
                <Marker
                  key={report._id || report.trackingId}
                  position={[report.location.coordinates.lat, report.location.coordinates.lng]}
                  icon={createCategoryIcon(report.category)}
                >
                  <Popup className="civicfix-popup" maxWidth={280} minWidth={220}>
                    <div className="popup-card">
                      {/* Header row */}
                      <div className="popup-header">
                        <span className="popup-category" style={{ color: CATEGORY_COLORS[report.category]?.bg }}>
                          {formatLabel(report.category)}
                        </span>
                        <span className={`popup-badge ${statusStyle(report.status)}`}>
                          {formatLabel(report.status)}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="popup-title">{report.title}</h4>

                      {/* Address */}
                      {report.location?.address && (
                        <p className="popup-address">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0, marginTop: 2}}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {report.location.address}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="popup-meta">
                        <span className={`popup-badge ${priorityStyle(report.priority)}`}>
                          {formatLabel(report.priority)}
                        </span>
                        {report.upvotes > 0 && (
                          <span className="popup-upvotes">
                            {report.upvotes}
                          </span>
                        )}
                        <span className="popup-date">
                          {new Date(report.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Track link */}
                      <Link to={`/track?id=${report.trackingId}`} className="popup-track-link">
                        Track Report
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          ) : (
            <HeatmapLayer points={heatPoints} />
          )}
        </MapContainer>

        {/* Stats floating card */}
        <div className="map-stats-card">
          <div className="map-stats-icon">
            {isHeatmap ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L8 8c-2 3 0 6 4 6s6-3 4-6L12 2z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            )}
          </div>
          <div>
            <p className="map-stats-count">{validReports.length}</p>
            <p className="map-stats-label">
              {isHeatmap ? 'Heatmap Points' : 'Issues Displayed'}
            </p>
          </div>
        </div>

        {/* Mode indicator badge */}
        <div className="map-mode-badge">
          {isHeatmap ? 'Heatmap Mode' : 'Pin Mode'}
        </div>
      </div>
    </div>
  );
}
