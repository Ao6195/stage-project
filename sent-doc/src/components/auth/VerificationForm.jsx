import React from 'react';
import { FiArrowLeft, FiCheckCircle, FiKey, FiRefreshCw, FiShield } from 'react-icons/fi';
import { useLanguage } from '../../lib/useLanguage';

export default function VerificationForm({
  code,
  submitting,
  submitLabel,
  busyLabel,
  submitIcon = 'check',
  onCodeChange,
  onSubmit,
  onResend,
  onBack,
  backLabel,
}) {
  const { t } = useLanguage();
  const SubmitIcon = submitIcon === 'shield' ? FiShield : FiCheckCircle;

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label className="input-group">
        <span className="input-label">
          <FiKey />
          <span>{t('verification_code')}</span>
        </span>
        <input
          type="text"
          placeholder={t('code')}
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          inputMode="numeric"
          maxLength={6}
          required
        />
      </label>

      <button type="submit" className="main-btn auth-submit-btn" disabled={submitting}>
        <SubmitIcon />
        <span>{submitting ? busyLabel : submitLabel}</span>
      </button>

      <div className="auth-actions-row">
        <button type="button" className="ghost-btn" onClick={onResend} disabled={submitting}>
          <FiRefreshCw />
          <span>{t('resend_code')}</span>
        </button>
        <button type="button" className="ghost-btn" onClick={onBack} disabled={submitting}>
          <FiArrowLeft />
          <span>{backLabel}</span>
        </button>
      </div>
    </form>
  );
}
