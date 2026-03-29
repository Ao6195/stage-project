import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiKey, FiLock, FiMail, FiRefreshCw } from 'react-icons/fi';
import { useLanguage } from '../lib/i18n';

const API = 'http://localhost:5000/api/auth';

export default function Forgot() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const setError = (message) => setFeedback({ type: 'error', message });
  const setSuccess = (message) => setFeedback({ type: 'success', message });

  const requestCode = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/forgot-password/request-code`, { email });
      setStep(2);
      setSuccess(response.data.message || t('reset_code_sent'));
    } catch (error) {
      setError(error.response?.data?.message || t('reset_code_send_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/forgot-password/reset`, {
        email,
        code,
        newPassword,
        confirmPassword,
      });
      setSuccess(response.data.message || t('password_updated'));
      setTimeout(() => navigate('/login'), 900);
    } catch (error) {
      setError(error.response?.data?.message || t('password_reset_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell minimal-shell forgot-shell">
        <section className="auth-hero compact-hero">
          <span className="auth-badge">
            <FiRefreshCw />
            <span>{t('password_reset')}</span>
          </span>
          <div className="auth-brand compact-brand">
            <h1>{t('recover_access')}</h1>
            <p>{t('recover_copy')}</p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-head">
            <p className="eyebrow">{t('recovery')}</p>
            <h2>{step === 1 ? t('request_code') : t('create_new_password')}</h2>
          </div>

          {feedback && (
            <div className={`feedback-panel ${feedback.type}`} role="status" aria-live="polite">
              {feedback.message}
            </div>
          )}

          {step === 1 ? (
            <form className="auth-form" onSubmit={requestCode}>
              <label className="input-group">
                <span className="input-label">
                  <FiMail />
                  <span>{t('email')}</span>
                </span>
                <input
                  type="email"
                  placeholder={t('email')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <button type="submit" className="main-btn auth-submit-btn" disabled={submitting}>
                <FiMail />
                <span>{submitting ? t('sending') : t('send_code')}</span>
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={resetPassword}>
              <label className="input-group">
                <span className="input-label">
                  <FiKey />
                  <span>{t('verification_code')}</span>
                </span>
                <input
                  type="text"
                  placeholder={t('code')}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                  required
                />
              </label>

              <div className="form-grid">
                <label className="input-group">
                  <span className="input-label">
                    <FiLock />
                    <span>{t('new_password')}</span>
                  </span>
                  <input
                    type="password"
                    placeholder={t('new_password')}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
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
                    type="password"
                    placeholder={t('confirm_password')}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </label>
              </div>

              <button type="submit" className="main-btn auth-submit-btn" disabled={submitting}>
                <FiCheckCircle />
                <span>{submitting ? t('updating') : t('update_password')}</span>
              </button>
            </form>
          )}

          <div className="auth-inline-links space-top">
            <Link to="/login" className="link">
              <span className="inline-link-with-icon">
                <FiArrowLeft />
                <span>{t('back_to_login')}</span>
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
