import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ChatBot from './components/ui/ChatBot';
import ToastContainer from './components/ui/Toast';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';
// ─── Phase 8.3: Route-based Code Splitting ───────────────
// Eagerly load lightweight pages, lazy-load heavy ones
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded — chunked separately to reduce initial bundle
const ReportIssue         = lazy(() => import('./pages/ReportIssue'));
const TrackReport         = lazy(() => import('./pages/TrackReport'));
const MyReports           = lazy(() => import('./pages/MyReports'));
const PublicFeed          = lazy(() => import('./pages/PublicFeed'));
const DepartmentDashboard = lazy(() => import('./pages/DepartmentDashboard'));
const AdminDashboard      = lazy(() => import('./pages/AdminDashboard'));
const MapView             = lazy(() => import('./pages/MapView'));
const AnalyticsDashboard  = lazy(() => import('./pages/AnalyticsDashboard'));
const AuditTrailPage      = lazy(() => import('./pages/AuditTrail'));

// ─── Suspense Fallback ────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--canvas)] px-5">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow)]">
        <div className="skeleton mb-4 h-5 w-36 rounded-md" />
        <div className="skeleton mb-3 h-10 w-full rounded-lg" />
        <div className="skeleton mb-6 h-4 w-2/3 rounded-md" />
        <div className="grid gap-3">
          <div className="skeleton h-14 w-full rounded-xl" />
          <div className="skeleton h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="flex flex-col min-h-screen">
            {/* Skip to content link — accessibility */}
            <a href="#main-content" className="skip-to-content">
              Skip to main content
            </a>

            <Navbar />

            <main id="main-content" className="grow pt-20" role="main" aria-label="Main content">
              {/* Suspense wraps all lazy-loaded routes */}
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ── Public Routes ─────────────────────── */}
                  <Route path="/"       element={<Home />} />
                  <Route path="/login"  element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/track"  element={<TrackReport />} />
                  <Route path="/report" element={<ReportIssue />} />
                  <Route path="/feed"   element={<PublicFeed />} />
                  <Route path="/map"    element={<MapView />} />

                  {/* ── Protected: Any authenticated user ─── */}
                  <Route
                    path="/my-reports"
                    element={
                      <ProtectedRoute>
                        <MyReports />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── Protected: Department & Admin ──────── */}
                  <Route
                    path="/dashboard/department"
                    element={
                      <ProtectedRoute roles={['department', 'admin']}>
                        <DepartmentDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── Protected: Admin only ──────────────── */}
                  <Route
                    path="/dashboard/admin"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/dashboard/analytics"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <AnalyticsDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── Phase 8.2: Blockchain Audit Trail ──── */}
                  <Route
                    path="/dashboard/audit"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <AuditTrailPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── 404 ───────────────────────────────── */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />

          {/* AI Chatbot Assistant — Phase 7 */}
          <ChatBot />

          {/* Toast notification layer — Phase 8 */}
          <ToastContainer />

          {/* PWA Install Prompt — Phase 8.1 */}
          <PWAInstallPrompt />
        </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--canvas)] px-5">
      <div className="max-w-md rounded-2xl border border-[var(--border)] bg-white p-10 text-center shadow-[var(--shadow)]">
        <p className="mb-3 text-sm font-bold text-[var(--accent)]">404</p>
        <h2 className="mb-3 text-3xl font-bold text-[var(--text)]">Page not found</h2>
        <p className="mb-6 text-[var(--muted)]">The page you are looking for does not exist.</p>
        <a
          href="/"
          className="inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export default App;
