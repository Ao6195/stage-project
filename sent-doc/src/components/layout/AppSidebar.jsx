import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiActivity, FiGlobe, FiGrid, FiLogOut, FiMoon, FiSliders, FiUsers } from 'react-icons/fi';
import { THEMES } from '../../constants/themes';
import { LANGUAGES, useLanguage } from '../../lib/i18n';

export default function AppSidebar({ user, theme, onThemeChange, onLogout }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand-block">
        <div className="sidebar-badge">
          <FiActivity />
          <span>{t('enterprise_workspace')}</span>
        </div>

        <div className="logo">
          IT<span>CORE</span>
        </div>

        <p className="sidebar-copy">{t('sidebar_copy')}</p>
      </div>

      <div className="user-profile-mini">
        <div className="avatar">{user.name?.[0] || user.username?.[0] || 'U'}</div>
        <div>
          <strong>{user.name || user.username}</strong>
          <p>{user.role}</p>
        </div>
      </div>

      <nav className="side-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
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

      <div className="theme-studio">
        <div className="theme-studio-head">
          <div className="theme-title">
            <FiSliders />
            <span>{t('theme_studio')}</span>
          </div>
          <span className="theme-current">
            <FiMoon />
            {THEMES.find((item) => item.id === theme)?.name || 'Cloud'}
          </span>
        </div>

        <div className="theme-grid">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`theme-option ${theme === item.id ? 'active' : ''}`}
              onClick={() => onThemeChange(item.id)}
            >
              <span
                className="theme-swatch"
                style={{ '--theme-accent': item.accent, '--theme-surface': item.surface }}
              />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="language-studio">
        <div className="theme-studio-head">
          <div className="theme-title">
            <FiGlobe />
            <span>{t('language')}</span>
          </div>
          <span className="theme-current">{language === 'fr' ? t('french') : t('english')}</span>
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

      <div className="sidebar-footer">
        <button className="logout-btn sidebar-action-btn" onClick={onLogout}>
          <FiLogOut />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
