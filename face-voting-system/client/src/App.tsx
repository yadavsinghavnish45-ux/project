import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Voting from './pages/Voting';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  return user ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  return user ? <Navigate to="/voting" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/voting" element={
        <ProtectedRoute><Voting /></ProtectedRoute>
      } />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/voting" replace />} />
      <Route path="*" element={<Navigate to="/voting" replace />} />
    </Routes>
  );
}