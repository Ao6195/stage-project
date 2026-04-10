import React from 'react';
import { Link } from 'react-router-dom';
import { FiAtSign, FiLock, FiMail } from 'react-icons/fi';
import { useLanguage } from '../../lib/useLanguage';

export default function LoginForm({ form, submitting, onChange, onSubmit, googleBlock }) {
  const { t } = useLanguage();

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label className="input-group">
        <span className="input-label">
          <FiAtSign />
          <span>{t('email_or_username')}</span>
        </span>
        <input
          name="identifier"
          type="text"
          placeholder={t('email_or_user')}
          value={form.identifier}
          onChange={onChange}
          autoComplete="username"
          required
        />
      </label>

      <label className="input-group">
        <span className="input-label">
          <FiLock />
          <span>{t('password')}</span>
        </span>
        <input
          name="password"
          type="password"
          placeholder={t('password')}
          value={form.password}
          onChange={onChange}
          autoComplete="current-password"
          required
        />
      </label>

      <div className="auth-inline-links">
        <Link to="/forgot" className="link">
          {t('forgot_password')}
        </Link>
      </div>

      {googleBlock}

      <button type="submit" className="main-btn auth-submit-btn" disabled={submitting}>
        <FiMail />
        <span>{submitting ? t('sending') : t('continue')}</span>
      </button>
    </form>
  );
}
