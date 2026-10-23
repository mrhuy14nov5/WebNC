/* Copyright (c) 2026 [Tên nhóm]. Licensed under MIT. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/variables.css';
import './styles/custom.css';
import LandingPage from './pages/LandingPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DestinationPage from './pages/DestinationPage.jsx';
import { AuthProvider } from './services/AuthContext.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses/:id" element={<DestinationPage title="Chi tiết môn học" />} />
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
