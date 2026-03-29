import React from 'react';
import { FiCheckCircle, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

export default function RegisterForm({ form, submitting, onChange, onSubmit }) {
  const { t } = useLanguage();

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label className="input-group">
          <span className="input-label">
            <FiUser />
            <span>{t('username')}</span>
          </span>
          <input
            name="username"
            type="text"
            placeholder={t('username')}
            value={form.username}
            onChange={onChange}
            autoComplete="username"
            required
          />
        </label>

        <label className="input-group">
          <span className="input-label">
            <FiMail />
            <span>{t('email')}</span>
          </span>
          <input
            name="email"
            type="email"
            placeholder={t('email')}
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            required
          />
        </label>
      </div>

      <div className="form-grid">
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
            autoComplete="new-password"
            required
          />
        </label>

        <label className="input-group">
          <span className="input-label">
            <FiCheckCircle />
            <span>{t('confirm_password')}</span>
          </span>
          <input
            name="confirmPassword"
            type="password"
            placeholder={t('confirm_password')}
            value={form.confirmPassword}
            onChange={onChange}
            autoComplete="new-password"
            required
          />
        </label>
      </div>

      <button type="submit" className="main-btn auth-submit-btn" disabled={submitting}>
        <FiMail />
        <span>{submitting ? t('sending') : t('send_code')}</span>
      </button>
    </form>
  );
}
