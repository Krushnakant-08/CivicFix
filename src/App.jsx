import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ChatBot from './components/ui/ChatBot';
import ToastContainer from './components/ui/Toast';

// Pages
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackReport from './pages/TrackReport';
import MyReports from './pages/MyReports';
import PublicFeed from './pages/PublicFeed';
import DepartmentDashboard from './pages/DepartmentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MapView from './pages/MapView';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
        <div className="flex flex-col min-h-screen">
          {/* Skip to content link — accessibility */}
          <a
            href="#main-content"
            className="skip-to-content"
          >
            Skip to main content
          </a>

          <Navbar />
          <main id="main-content" className="grow pt-20" role="main" aria-label="Main content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/track" element={<TrackReport />} />
              <Route path="/report" element={<ReportIssue />} />
              <Route path="/feed" element={<PublicFeed />} />
              <Route path="/map" element={<MapView />} />

              {/* Protected Routes — Any authenticated user */}
              <Route
                path="/my-reports"
                element={
                  <ProtectedRoute>
                    <MyReports />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes — Department & Admin */}
              <Route
                path="/dashboard/department"
                element={
                  <ProtectedRoute roles={['department', 'admin']}>
                    <DepartmentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes — Admin only */}
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

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />

          {/* AI Chatbot Assistant — Phase 7 */}
          <ChatBot />

          {/* Toast notification layer — Phase 8 */}
          <ToastContainer />
        </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-mesh">
      <div className="glass-card p-12 text-center max-w-md animate-slide-up">
        <div className="mb-4"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mx-auto" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
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

