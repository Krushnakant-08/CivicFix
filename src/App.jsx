import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackReport from './pages/TrackReport';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="grow pt-20">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/track" element={<TrackReport />} />
              <Route path="/report" element={<ReportIssue />} />

              {/* Protected Routes — Any authenticated user */}
              <Route
                path="/my-reports"
                element={
                  <ProtectedRoute>
                    <MyReportsPlaceholder />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes — Department & Admin */}
              <Route
                path="/dashboard/department"
                element={
                  <ProtectedRoute roles={['department', 'admin']}>
                    <DashboardPlaceholder title="Department Dashboard" />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes — Admin only */}
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <DashboardPlaceholder title="Admin Dashboard" />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

// ─── Placeholder pages (will be replaced in Phase 2 & 3) ──
function MyReportsPlaceholder() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-mesh">
      <div className="glass-card p-12 text-center max-w-md animate-slide-up">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">My Reports</h2>
        <p className="text-slate-500">Your submitted reports will appear here. Coming in Phase 2.</p>
      </div>
    </div>
  );
}

function DashboardPlaceholder({ title }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-mesh">
      <div className="glass-card p-12 text-center max-w-md animate-slide-up">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500">This dashboard will be built in Phase 3.</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-mesh">
      <div className="glass-card p-12 text-center max-w-md animate-slide-up">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">404 — Page Not Found</h2>
        <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

export default App;
