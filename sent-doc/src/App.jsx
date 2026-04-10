import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppSidebar from './components/layout/AppSidebar';
import Auth from './pages/Auth';
import DocumentView from './pages/DocumentView';
import Forgot from './pages/Forgot';
import Portal from './pages/Portal';
import Profiles from './pages/Profiles';
import { LanguageProvider } from './lib/i18n';

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

function ProtectedLayout({
  token,
  user,
  theme,
  mode,
  settingsOpen,
  onSettingsToggle,
  onThemeChange,
  onModeChange,
  onLogout,
  children,
}) {
  if (!token) return <Navigate to="/" replace />;

  return (
    <div className="app-layout">
      <AppSidebar
        user={user}
        theme={theme}
        mode={mode}
        settingsOpen={settingsOpen}
        onSettingsToggle={onSettingsToggle}
        onThemeChange={onThemeChange}
        onModeChange={onModeChange}
        onLogout={onLogout}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}

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
  const user = readStoredUser();

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
    window.location.href = '/';
  };

  const layoutProps = {
    token,
    user,
    theme,
    mode,
    settingsOpen,
    onSettingsToggle: () => setSettingsOpen((current) => !current),
    onThemeChange: setTheme,
    onModeChange: setMode,
    onLogout: logout,
  };

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={token ? <Navigate to="/portal" replace /> : <Auth setToken={setToken} />} />
          <Route path="/login" element={<Navigate to={token ? '/portal' : '/'} replace />} />
          <Route path="/forgot" element={token ? <Navigate to="/portal" replace /> : <Forgot />} />
          <Route path="/portal" element={<ProtectedLayout {...layoutProps}><Portal /></ProtectedLayout>} />
          <Route path="/profiles" element={<ProtectedLayout {...layoutProps}><Profiles /></ProtectedLayout>} />
          <Route path="/documents/:docId" element={<ProtectedLayout {...layoutProps}><DocumentView /></ProtectedLayout>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
