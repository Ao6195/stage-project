import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGlobe,
  FiGrid,
  FiLogOut,
  FiMoon,
  FiSettings,
  FiSun,
  FiUsers,
} from 'react-icons/fi';
import { THEMES } from '../../constants/themes';
import { LANGUAGES, useLanguage } from '../../lib/i18n';

export default function AppSidebar({
  user,
  theme,
  mode,
  settingsOpen,
  onSettingsToggle,
  onThemeChange,
  onModeChange,
  onLogout,
}) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand-block">
        <button type="button" className="logo logo-link-btn" onClick={onLogout}>
          IT<span>DOC</span>
        </button>
      </div>

      <div className="user-profile-mini">
        <div className="avatar">{user.name?.[0] || user.username?.[0] || 'U'}</div>
        <div>
          <strong>{user.name || user.username}</strong>
          <p>{user.role}</p>
        </div>
      </div>

      <nav className="side-nav">
        <NavLink to="/portal" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-link-inner">
            <FiGrid className="nav-icon" />
            <span>{t('assets_portal')}</span>
          </span>
        </NavLink>
        <NavLink to="/profiles" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-link-inner">
            <FiUsers className="nav-icon" />
            <span>{t('staff_network')}</span>
          </span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className={`ghost-btn sidebar-action-btn settings-btn ${settingsOpen ? 'active' : ''}`}
          onClick={onSettingsToggle}
        >
          <FiSettings />
          <span>{t('settings')}</span>
        </button>

        {settingsOpen && (
          <div className="settings-panel">
            <div className="settings-group">
            <div className="theme-studio-head">
              <div className="theme-title">
                <FiSun />
                <span>{t('appearance')}</span>
              </div>
            </div>

              <div className="mode-toggle">
                <button
                  type="button"
                  className={`mode-toggle-btn ${mode === 'light' ? 'active' : ''}`}
                  onClick={() => onModeChange('light')}
                >
                  <FiSun />
                  <span>{t('light')}</span>
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${mode === 'dark' ? 'active' : ''}`}
                  onClick={() => onModeChange('dark')}
                >
                  <FiMoon />
                  <span>{t('dark')}</span>
                </button>
              </div>
            </div>

            <div className="settings-group">
            <div className="theme-studio-head">
              <div className="theme-title">
                <FiSettings />
                <span>{t('theme')}</span>
              </div>
            </div>

              <div className="theme-grid">
                {THEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`theme-option ${theme === item.id ? 'active' : ''}`}
                  aria-label={item.name}
                  onClick={() => onThemeChange(item.id)}
                >
                  <span
                    className="theme-swatch"
                    style={{ '--theme-accent': item.accent, '--theme-surface': item.surface }}
                  />
                </button>
              ))}
            </div>
            </div>

            <div className="settings-group">
            <div className="theme-studio-head">
              <div className="theme-title">
                <FiGlobe />
                <span>{t('language')}</span>
              </div>
            </div>

              <div className="language-grid">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`language-option ${language === item.id ? 'active' : ''}`}
                    onClick={() => setLanguage(item.id)}
                  >
                    {item.id === 'fr' ? t('french') : t('english')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button className="logout-btn sidebar-action-btn" onClick={onLogout}>
          <FiLogOut />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
