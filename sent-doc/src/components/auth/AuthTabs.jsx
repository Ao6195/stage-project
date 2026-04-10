import React from 'react';
import { LOGIN_VIEW, REGISTER_VIEW } from '../../constants/authViews';
import { useLanguage } from '../../lib/useLanguage';

export default function AuthTabs({ view, onSwitch }) {
  const { t } = useLanguage();

  return (
    <div className="auth-tabs" role="tablist" aria-label="Authentication options">
      <button
        type="button"
        className={view === LOGIN_VIEW ? 'active' : ''}
        onClick={() => onSwitch(LOGIN_VIEW)}
      >
        {t('sign_in')}
      </button>
      <button
        type="button"
        className={view === REGISTER_VIEW ? 'active' : ''}
        onClick={() => onSwitch(REGISTER_VIEW)}
      >
        {t('register')}
      </button>
    </div>
  );
}
