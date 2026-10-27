/* Copyright (c) 2026 [Tên nhóm]. Licensed under MIT. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/variables.css';
import './styles/custom.css';
import LandingPage from './pages/LandingPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DestinationPage from './pages/DestinationPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import AdminStudentsPage from './pages/AdminStudentsPage.jsx';
import { AuthProvider } from './services/AuthContext.jsx';
import { useAuth } from './services/AuthContext.jsx';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="auth-loading" aria-live="polite">Đang kiểm tra quyền truy cập...</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute roles={['admin']}><AdminStudentsPage /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="*" element={<DestinationPage title="Không tìm thấy trang" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
