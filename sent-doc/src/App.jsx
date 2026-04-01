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
  const storedTheme = localStorage.getItem('theme') || 'cloud';
  const [theme, setTheme] = useState(
    storedTheme === 'light' || storedTheme === 'dark' ? 'cloud' : storedTheme
  );
  const [mode, setMode] = useState(
    localStorage.getItem('mode') || (storedTheme === 'dark' ? 'dark' : 'light')
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('theme', theme);
    localStorage.setItem('mode', mode);
  }, [mode, theme]);

  const logout = () => {
    const savedTheme = localStorage.getItem('theme') || theme;
    const savedMode = localStorage.getItem('mode') || mode;
    const savedLanguage = localStorage.getItem('language') || 'en';
    localStorage.clear();
    localStorage.setItem('theme', savedTheme);
    localStorage.setItem('mode', savedMode);
    localStorage.setItem('language', savedLanguage);
    setToken(null);
    window.location.href = '/login';
  };

  const AppLayout = ({ children }) => {
    if (!token) return <Navigate to="/login" />;

    return (
      <div className="app-layout">
        <AppSidebar
          user={user}
          theme={theme}
          mode={mode}
          settingsOpen={settingsOpen}
          onSettingsToggle={() => setSettingsOpen((current) => !current)}
          onThemeChange={setTheme}
          onModeChange={setMode}
          onLogout={logout}
        />
        <main className="main-content">{children}</main>
      </div>
    );
  };

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={token ? '/portal' : '/login'} />} />
          <Route path="/login" element={token ? <Navigate to="/portal" /> : <Auth setToken={setToken} />} />
          <Route path="/forgot" element={token ? <Navigate to="/portal" /> : <Forgot />} />
          <Route path="/portal" element={<AppLayout><Portal /></AppLayout>} />
          <Route path="/profiles" element={<AppLayout><Profiles /></AppLayout>} />
          <Route path="/documents/:docId" element={<AppLayout><DocumentView /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
