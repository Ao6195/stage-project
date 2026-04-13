import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiKey, FiLock, FiMail } from 'react-icons/fi';
import AuthHero from '../components/auth/AuthHero';
import SmokeyModeToggle from '../components/ui/SmokeyModeToggle';
import { AUTH_API } from '../lib/api';
import { useLanguage } from '../lib/useLanguage';

export default function Forgot({ mode }) {
  const { t, language } = useLanguage();
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
      const response = await axios.post(`${AUTH_API}/forgot-password/request-code`, { email });
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
      const response = await axios.post(`${AUTH_API}/forgot-password/reset`, {
        email,
        code,
        newPassword,
        confirmPassword,
      });
      setSuccess(response.data.message || t('password_updated'));
      setTimeout(() => navigate('/'), 900);
    } catch (error) {
      setError(error.response?.data?.message || t('password_reset_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell minimal-shell forgot-shell">
        <AuthHero
          title={language === 'fr' ? "Recuperer l'acces a" : 'Recover access to'}
          accent="ITDOC"
          caption={t('password_reset')}
          mode={mode}
        />

        <section className="auth-panel">
          <div className="auth-panel-main">
            <div className="auth-panel-head auth-panel-head-with-logo">
              <div className="auth-panel-head-copy">
                <p className="eyebrow">{t('recovery')}</p>
                <h2>{step === 1 ? t('request_code') : t('create_new_password')}</h2>
              </div>
              <div className="auth-panel-tools">
                <img
                  className="brand-logo-img auth-panel-logo"
                  src="/ministere-equipement-logo.jpg"
                  alt="Logo du Ministere de l'Equipement et de l'Eau"
                />
              </div>
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
              <Link to="/" className="link">
                <span className="inline-link-with-icon">
                  <FiArrowLeft />
                  <span>{t('back_to_login')}</span>
                </span>
              </Link>
            </div>
          </div>

          <div className="auth-panel-footer auth-panel-footer--side">
            <SmokeyModeToggle />
          </div>
        </section>
      </div>
    </div>
  );
}
