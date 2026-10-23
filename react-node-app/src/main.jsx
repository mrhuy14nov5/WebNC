/* Copyright (c) 2026 [Tên nhóm]. Licensed under MIT. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/variables.css';
import './styles/custom.css';
import LandingPage from './pages/LandingPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import DestinationPage from './pages/DestinationPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<DestinationPage title="Đăng nhập" />} />
        <Route path="/register" element={<DestinationPage title="Đăng ký" />} />
        <Route path="/courses/:id" element={<DestinationPage title="Chi tiết môn học" />} />
        <Route path="*" element={<DestinationPage title="Không tìm thấy trang" />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
