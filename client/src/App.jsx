import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import ClientDashboard from './pages/client/ClientDashboard';
import RaiseTicketPage from './pages/client/RaiseTicketPage';
import EngineerDashboard from './pages/engineer/EngineerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminMasterPage from './pages/admin/AdminMasterPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';

// Root redirector component
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/admin" replace />;
  if (user.role === 'engineer') return <Navigate to="/engineer" replace />;
  return <Navigate to="/client" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Layout Wrapped Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />

        {/* Client Routes */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={['client', 'super_admin']}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/raise-ticket"
          element={
            <ProtectedRoute allowedRoles={['client', 'super_admin']}>
              <RaiseTicketPage />
            </ProtectedRoute>
          }
        />

        {/* Engineer Routes */}
        <Route
          path="/engineer"
          element={
            <ProtectedRoute allowedRoles={['engineer', 'super_admin']}>
              <EngineerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminTicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/master"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminMasterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Ticket Detail Route */}
        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'engineer', 'client']}>
              <TicketDetailPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
