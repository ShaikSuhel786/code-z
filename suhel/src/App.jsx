import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';

// A generic loading component
const FullScreenLoader = () => (
  <div className="min-h-screen bg-[#0f111a] flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
    <p className="text-slate-400 font-medium">Verifying session...</p>
  </div>
);

// Protected Route wrapper component
function ProtectedRoute({ children, allowedRoles }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setRole(data.role);
      }
    } catch (err) {
      console.error('Error fetching role:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <FullScreenLoader />;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect standard users to their respective dashboards if they hit the wrong route
    if (role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (role === 'instructor') return <Navigate to="/instructor-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor-dashboard"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root redirect logic */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* If user hits root, the ProtectedRoute handles redirecting them to their specific dashboard based on their role fetch */}
              <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
                <p className="text-white">Redirecting to your dashboard...</p>
                <Navigate to="/student-dashboard" replace />
              </div>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
