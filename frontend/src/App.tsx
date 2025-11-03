import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import Trips from './pages/Trips';
import CreateTrip from './pages/CreateTrip'; 
import Login from './components/Login';
import Signup from './components/Signup';
import InviteFriends from './pages/InviteFriends';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Activities from './pages/Activities';
import IdeasBoard from './components/IdeasBoard';
import TripMap from './components/TripMap';
import LiveTrackingMap from './pages/LiveTrackingMap';
import TripDetails from './pages/TripDetails';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
          <div className="text-center max-w-md mx-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 w-full"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced debug component
const RouteDebugger: React.FC = () => {
  const location = useLocation();
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        left: '10px', 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        Route: {location.pathname}
      </div>
    );
  }
  
  return null;
};

// Loading Component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated);
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Trip-specific routes wrapper
const TripRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

// Main app content
const AppContent: React.FC = () => {
  const location = useLocation();
  
  // Don't show header/footer on auth pages
  const showLayout = !['/login', '/signup'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col">
      <RouteDebugger />
      {showLayout && <Header />}
      <main className={showLayout ? "flex-grow" : "min-h-screen"}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Dashboard />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Trip Management Routes */}
          <Route 
            path="/trips" 
            element={
              <ProtectedRoute>
                <Trips />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips/new" 
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            } 
          />

          {/* Individual Trip Routes */}
          <Route 
            path="/trips/:tripId" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <TripDetails />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />

          {/* Trip Feature Routes */}
          <Route 
            path="/trips/:tripId/invite" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <InviteFriends />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips/:tripId/expenses" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <Expenses />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips/:tripId/analytics" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <Analytics />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips/:tripId/activities" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <Activities />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips/:tripId/ideas" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <IdeasBoard />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips/:tripId/map" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <TripMap />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips/:tripId/expense-tracker" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <Expenses />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trips/:tripId/live-tracking" 
            element={
              <ProtectedRoute>
                <TripRoutes>
                  <LiveTrackingMap />
                </TripRoutes>
              </ProtectedRoute>
            } 
          />

          {/* Feature-specific routes (redirect to first trip if available) */}
          <Route 
            path="/ideas" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/map" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expense-tracker" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/live-tracking" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />

          {/* Legacy route redirects */}
          <Route path="/create-trip" element={<Navigate to="/trips/new" replace />} />
          <Route path="/invite" element={<Navigate to="/dashboard" replace />} />
          <Route path="/expenses" element={<Navigate to="/dashboard" replace />} />
          <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
          <Route path="/activities" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 - Not Found */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
                    <p className="text-gray-600 mb-6">
                      The page you're looking for doesn't exist or has been moved.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => window.history.back()}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Go Back
                      </button>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Go Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            } 
          />
        </Routes>
      </main>
      {showLayout && <Footer />}
    </div>
  );
};

// Navigation helper function (for 404 page)
const navigate = (path: string) => {
  window.location.href = path;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;