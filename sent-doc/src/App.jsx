import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppSidebar from './components/layout/AppSidebar';
import Auth from './pages/Auth';
import DocumentView from './pages/DocumentView';
import Forgot from './pages/Forgot';
import Portal from './pages/Portal';
import Profiles from './pages/Profiles';
import { LanguageProvider } from './lib/i18n';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const logout = () => {
    const savedTheme = localStorage.getItem('theme') || theme;
    const savedLanguage = localStorage.getItem('language') || 'en';
    localStorage.clear();
    localStorage.setItem('theme', savedTheme);
    localStorage.setItem('language', savedLanguage);
    setToken(null);
    window.location.href = '/login';
  };

  const AppLayout = ({ children }) => {
    if (!token) return <Navigate to="/login" />;

    return (
      <div className="app-layout">
        <AppSidebar user={user} theme={theme} onThemeChange={setTheme} onLogout={logout} />
        <main className="main-content">{children}</main>
      </div>
    );
  };

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/" /> : <Auth setToken={setToken} />} />
          <Route path="/forgot" element={token ? <Navigate to="/" /> : <Forgot />} />
          <Route path="/" element={<AppLayout><Portal /></AppLayout>} />
          <Route path="/profiles" element={<AppLayout><Profiles /></AppLayout>} />
          <Route path="/documents/:docId" element={<AppLayout><DocumentView /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
