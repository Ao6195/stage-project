import React from 'react';
import { FiShield } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

export default function AuthHero() {
  const { t } = useLanguage();

  return (
    <section className="auth-hero compact-hero">
      <span className="auth-badge">
        <FiShield />
        <span>ITCORE</span>
      </span>

      <div className="auth-brand compact-brand">
        <h1>{t('private_workspace_access')}</h1>
        <p>{t('auth_copy')}</p>
      </div>
    </section>
  );
}
