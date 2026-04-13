import React, { useEffect, useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppSidebar from './components/layout/AppSidebar';
import Auth from './pages/Auth';
import DocumentView from './pages/DocumentView';
import Forgot from './pages/Forgot';
import Portal from './pages/Portal';
import Profiles from './pages/Profiles';
import { LanguageProvider } from './lib/i18n';
import { useLanguage } from './lib/useLanguage';

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
  sidebarOpen,
  settingsOpen,
  onSettingsToggle,
  onSidebarNavigate,
  onSidebarVisibilityToggle,
  onThemeChange,
  onModeChange,
  onLogout,
  children,
}) {
  const { t } = useLanguage();

  if (!token) return <Navigate to="/" replace />;

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
      <AppSidebar
        user={user}
        theme={theme}
        mode={mode}
        settingsOpen={settingsOpen}
        onSettingsToggle={onSettingsToggle}
        onThemeChange={onThemeChange}
        onModeChange={onModeChange}
        onNavigate={onSidebarNavigate}
        onLogout={onLogout}
      />
      <button
        type="button"
        className={`app-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={onSidebarVisibilityToggle}
        aria-label={t('hide_sidebar')}
      />
      <main className="main-content">
        <div className="app-main-toolbar">
          <button
            type="button"
            className="app-sidebar-hamburger"
            onClick={onSidebarVisibilityToggle}
            aria-label={sidebarOpen ? t('hide_sidebar') : t('show_sidebar')}
            title={sidebarOpen ? t('hide_sidebar') : t('show_sidebar')}
          >
            <FiMenu />
          </button>
        </div>
        {children}
      </main>
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
  const [isMobileLayout, setIsMobileLayout] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 960 : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const storedSidebarOpen = localStorage.getItem('sidebarOpen');
    if (storedSidebarOpen !== null) {
      return storedSidebarOpen === 'true';
    }

    return typeof window !== 'undefined' ? window.innerWidth > 960 : true;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const user = readStoredUser();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('theme', theme);
    localStorage.setItem('mode', mode);
  }, [mode, theme]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth <= 960);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(sidebarOpen));
  }, [sidebarOpen]);

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
    sidebarOpen,
    settingsOpen,
    onSettingsToggle: () => setSettingsOpen((current) => !current),
    onSidebarNavigate: () => {
      if (isMobileLayout) {
        setSidebarOpen(false);
        setSettingsOpen(false);
      }
    },
    onSidebarVisibilityToggle: () => {
      setSidebarOpen((current) => {
        const next = !current;
        if (!next) {
          setSettingsOpen(false);
        }
        return next;
      });
    },
    onThemeChange: setTheme,
    onModeChange: setMode,
    onLogout: logout,
  };

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              token ? (
                <Navigate to="/portal" replace />
              ) : (
                <Auth setToken={setToken} mode={mode} onModeChange={setMode} />
              )
            }
          />
          <Route path="/login" element={<Navigate to={token ? '/portal' : '/'} replace />} />
          <Route
            path="/forgot"
            element={
              token ? (
                <Navigate to="/portal" replace />
              ) : (
                <Forgot mode={mode} onModeChange={setMode} />
              )
            }
          />
          <Route path="/portal" element={<ProtectedLayout {...layoutProps}><Portal /></ProtectedLayout>} />
          <Route path="/profiles" element={<ProtectedLayout {...layoutProps}><Profiles /></ProtectedLayout>} />
          <Route path="/documents/:docId" element={<ProtectedLayout {...layoutProps}><DocumentView /></ProtectedLayout>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
