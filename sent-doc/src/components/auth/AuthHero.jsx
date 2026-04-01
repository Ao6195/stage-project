import React from 'react';
import AuthHeroVisual from './AuthHeroVisual';
import { useLanguage } from '../../lib/i18n';

export default function AuthHero() {
  const { t } = useLanguage();

  return (
    <section className="auth-hero compact-hero">
      <div className="auth-hero-head">
        <div className="auth-brand compact-brand">
          <h1>{t('private_workspace_access')}</h1>
        </div>
      </div>

      <AuthHeroVisual />
    </section>
  );
}
