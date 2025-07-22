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

const App = () => {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
};

const AppContent = () => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          await fetchUserRole(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setUserRole(data?.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  const AdminRoute = ({ children }) => {
    if (loading) return null;
    if (!session || userRole !== 'admin') {
      return <Navigate to="/login" replace />;
    }
    return <AdminLayout>{children}</AdminLayout>;
  };

  const ProtectedRoute = ({ children }) => {
    if (loading) return null;
    if (!session) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
      <Route path="/register" element={session ? <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} /> : <Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
      <Route path="/profile-editor" element={<ProtectedRoute><ProfileEditor /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><AttendanceHistory /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
      <Route path="/admin/departments" element={<AdminRoute><DepartmentManagement /></AdminRoute>} />
      <Route path="/admin/positions" element={<AdminRoute><PositionManagement /></AdminRoute>} />
      <Route path="/admin/salary-payment" element={<AdminRoute><SalaryPaymentManagement /></AdminRoute>} />
      <Route path="/admin/location" element={<AdminRoute><LocationSettings /></AdminRoute>} />
      <Route path="/admin/bank" element={<AdminRoute><BankManagement /></AdminRoute>} />
      <Route path="/admin/attendance" element={<AdminRoute><AttendanceManagementByDate /></AdminRoute>} />

      <Route path="/" element={<Navigate to={!session ? '/login' : userRole === 'admin' ? '/admin' : '/dashboard'} replace />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;