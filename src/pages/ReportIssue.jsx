import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { value: 'roads', label: 'Roads & Potholes', icon: '🛣️' },
  { value: 'sanitation', label: 'Sanitation & Garbage', icon: '🗑️' },
  { value: 'water', label: 'Water Supply & Leaks', icon: '💧' },
  { value: 'electricity', label: 'Streetlights & Power', icon: '💡' },
  { value: 'parks', label: 'Parks & Recreation', icon: '🌳' },
  { value: 'traffic', label: 'Traffic & Signals', icon: '🚦' },
  { value: 'other', label: 'Other / Miscellaneous', icon: '📋' },
];

export default function ReportIssue() {
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    lat: null,
    lng: null,
  });
  const [images, setImages] = useState([]); // { file, preview, base64 }
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // { trackingId }
  const [dragActive, setDragActive] = useState(false);

  // ─── Form handlers ─────────────────────────────────────
  const handleChange = (e) => {
    setError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── GPS Auto-Location ─────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          setFormData((prev) => ({
            ...prev,
            location: address,
            lat: latitude,
            lng: longitude,
          }));
        } catch {
          // If reverse geocoding fails, use raw coordinates
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            lat: latitude,
            lng: longitude,
          }));
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access or enter manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable. Please enter your address manually.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('Could not get your location. Please enter it manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ─── Image Upload ──────────────────────────────────────
  const processFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));

    if (images.length + validFiles.length > 3) {
      setError('Maximum 3 images allowed');
      return;
    }

    validFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be under 5 MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          {
            file,
            preview: URL.createObjectURL(file),
            base64: e.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ─── Submit ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Please enter a title for the issue');
      return;
    }
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    if (!formData.location.trim()) {
      setError('Please enter a location or use GPS auto-detect');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please describe the issue');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        location: {
          address: formData.location.trim(),
          lat: formData.lat,
          lng: formData.lng,
        },
        isAnonymous: isAnonymous || !isAuthenticated,
        images: images.map((img) => ({
          url: img.base64,
          uploadedAt: new Date().toISOString(),
        })),
      };

      const data = await reportsAPI.create(payload);

      // Clean up image previews
      images.forEach((img) => URL.revokeObjectURL(img.preview));

      setSuccess({
        trackingId: data.trackingId,
        message: data.message,
      });
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Copy Tracking ID ─────────────────────────────────
  const [copied, setCopied] = useState(false);
  const copyTrackingId = () => {
    navigator.clipboard.writeText(success.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lightInputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300';

  // ─── Success State ─────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-mesh py-12 px-4 flex items-center justify-center font-sans">
        <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden animate-slide-up rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 rounded-full blur-3xl -z-10 animate-float"></div>

          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Report Submitted!</h2>
          <p className="text-slate-500 mb-8">Your issue has been logged. Use the tracking ID to check progress.</p>

          {/* Tracking ID */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Tracking ID</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">{success.trackingId}</span>
              <button
                onClick={copyTrackingId}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={`/track`} className="flex-1">
              <Button variant="primary" className="w-full">Track My Report</Button>
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setFormData({ title: '', category: '', description: '', location: '', lat: null, lng: null });
                setImages([]);
                setIsAnonymous(false);
              }}
              className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-12 px-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden animate-slide-up rounded-[2rem] shadow-xl border border-slate-100">
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl -z-10 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }}></div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Report an Issue</h2>
        <p className="text-slate-500 mb-8 text-lg">Help us identify and fix problems in your neighborhood.</p>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3 animate-slide-up">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Issue Title</label>
            <input
              required
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={lightInputClass}
              placeholder="e.g. Large pothole on Main Street"
              maxLength={150}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { setError(null); setFormData({ ...formData, category: cat.value }); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    formData.category === cat.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-200'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label.split(' & ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location with GPS button */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Location</label>
            <div className="flex gap-2">
              <input
                required
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`${lightInputClass} flex-1`}
                placeholder="Enter address or use GPS →"
              />
              <button
                type="button"
                onClick={handleGeolocate}
                disabled={isLocating}
                className="shrink-0 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Auto-detect my location"
              >
                {isLocating ? (
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                <span className="hidden sm:inline text-sm font-medium">{isLocating ? 'Locating...' : 'GPS'}</span>
              </button>
            </div>
            {formData.lat && formData.lng && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                GPS coordinates captured ({formData.lat.toFixed(4)}, {formData.lng.toFixed(4)})
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Description</label>
            <textarea
              required
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className={`${lightInputClass} resize-none`}
              placeholder="Describe the issue in detail — what's the problem, how severe is it, how long has it been there?"
              maxLength={2000}
            ></textarea>
            <p className="text-xs text-slate-400 text-right">{formData.description.length}/2000</p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Photo Evidence <span className="text-slate-400 font-normal normal-case">(up to 3 images)</span>
            </label>

            {/* Previews */}
            {images.length > 0 && (
              <div className="flex gap-3 mb-3 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            {images.length < 3 && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <svg className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-600 text-sm font-medium">
                  {dragActive ? (
                    <span className="text-blue-600">Drop images here</span>
                  ) : (
                    <>Drag and drop images, or <span className="text-blue-600 underline decoration-blue-200 underline-offset-4">click to browse</span></>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP • Max 5 MB each</p>
              </div>
            )}
          </div>

          {/* Anonymous Toggle */}
          {isAuthenticated && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="anonymous" className="cursor-pointer">
                <span className="text-sm font-semibold text-slate-700">Submit Anonymously</span>
                <p className="text-xs text-slate-400 mt-0.5">Your name and identity will not be linked to this report</p>
              </label>
            </div>
          )}

          {!isAuthenticated && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">Submitting as anonymous</p>
                <p className="text-xs mt-0.5 text-amber-600">
                  <Link to="/login" className="underline font-semibold hover:text-amber-800">Sign in</Link> to track your reports and receive status updates.
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button variant="primary" type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting Report...
              </span>
            ) : (
              'Submit Report'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}