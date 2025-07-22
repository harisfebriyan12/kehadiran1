import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './employee/pages/Dashboard';
import ProfileSetup from './employee/pages/ProfileSetup';
import ProfileEditor from './employee/pages/ProfileEditor';
import AdminPanel from './admin/pages/AdminPanel';
import UserManagement from './admin/pages/UserManagement';
import SalaryPaymentManagement from './admin/pages/SalaryPaymentManagement';
import DepartmentManagement from './admin/pages/DepartmentManagement';
import PositionManagement from './admin/pages/PositionManagement';
import LocationSettings from './admin/pages/LocationSettings';
import BankManagement from './admin/pages/BankManagement';
import AttendanceManagementByDate from './admin/pages/AttendanceManagementByDate';
import AttendanceHistory from './admin/pages/AttendanceHistory';
import AdminLayout from './admin/components/AdminLayout';
import { LanguageProvider } from './utils/languageContext';

function App() {
  return (
    <LanguageProvider>
      <div className="flex flex-col min-h-screen">
        <Router>
          <AppContent />
        </Router>
      </div>
    </LanguageProvider>
  );
}

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Dapatkan session awal dengan error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Jika ada error (seperti user_not_found), clear session
        console.error('Session error:', error);
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
        
        // Fetch user role if session exists
        if (session) {
          fetchUserRole(session.user.id);
        }
      }
      setLoading(false);
    }).catch((error) => {
      // Handle any unexpected errors
      console.error('Unexpected session error:', error);
      supabase.auth.signOut();
      setSession(null);
      setLoading(false);
    });

    // Dengarkan perubahan auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Fetch user role when session changes
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle 404s by redirecting to home page
  useEffect(() => {
    // Check if the current path doesn't match any of our routes
    const validPaths = [
      '/login', '/register', '/dashboard', '/profile-setup', '/profile-editor',
      '/history', '/admin', '/admin/users', '/admin/departments', 
      '/admin/positions', '/admin/salary-payment', '/admin/location', 
      '/admin/bank', '/admin/attendance', '/'
    ];
    
    const isValidPath = validPaths.some(path => {
      // Check if current path starts with this valid path
      return location.pathname === path || 
             (path !== '/' && location.pathname.startsWith(path + '/'));
    });
    
    if (!isValidPath && !loading) {
      // Redirect to appropriate page based on user role
      if (!session) {
        navigate('/login');
      } else if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [location.pathname, loading, session, userRole, navigate]);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex space-x-1 text-blue-600">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-600 mt-4">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  const AdminRoute = ({ children }) => {
    if (!session || userRole !== 'admin') {
      return <Navigate to={session ? "/dashboard" : "/login"} replace />;
    }
    return <AdminLayout>{children}</AdminLayout>;
  };

  return (
    <div className="flex flex-col flex-1">
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : (userRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />)} 
        />
        <Route 
          path="/register" 
          element={!session ? <Register /> : (userRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />)} 
        />
        <Route 
          path="/dashboard" 
          element={session ? (userRole === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />) : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile-setup" 
          element={session ? <ProfileSetup /> : <Navigate to="/login" replace />} 
        />
        <Route
          path="/profile-editor"
          element={session ? <ProfileEditor /> : <Navigate to="/login" replace />}
        />
        <Route 
          path="/history" 
          element={session ? <AttendanceHistory /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin" 
          element={<AdminRoute><AdminPanel /></AdminRoute>}
        />
        <Route 
          path="/admin/users" 
          element={<AdminRoute><UserManagement /></AdminRoute>}
        />
        <Route 
          path="/admin/departments" 
          element={<AdminRoute><DepartmentManagement /></AdminRoute>}
        />
        <Route 
          path="/admin/positions" 
          element={<AdminRoute><PositionManagement /></AdminRoute>}
        />
        <Route 
          path="/admin/salary-payment" 
          element={<AdminRoute><SalaryPaymentManagement /></AdminRoute>}
        />
        <Route 
          path="/admin/location" 
          element={<AdminRoute><LocationSettings /></AdminRoute>}
        />
        <Route 
          path="/admin/bank" 
          element={<AdminRoute><BankManagement /></AdminRoute>}
        />
        <Route 
          path="/admin/attendance" 
          element={<AdminRoute><AttendanceManagementByDate /></AdminRoute>}
        />
        <Route 
          path="/" 
          element={
            !session ? <Navigate to="/login" replace /> : 
            userRole === 'admin' ? <Navigate to="/admin" replace /> : 
            <Navigate to="/dashboard" replace />
          } 
        />
        {/* Catch-all route to handle 404s */}
        <Route 
          path="*" 
          element={
            !session ? <Navigate to="/login" replace /> : 
            userRole === 'admin' ? <Navigate to="/admin" replace /> : 
            <Navigate to="/dashboard" replace />
          } 
        />
      </Routes>
    </div>
  );
}

export default App;