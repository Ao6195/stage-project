import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import AuthHero from '../components/auth/AuthHero';
import AuthTabs from '../components/auth/AuthTabs';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import SmokeyModeToggle from '../components/ui/SmokeyModeToggle';
import VerificationForm from '../components/auth/VerificationForm';
import {
  LOGIN_VERIFY_VIEW,
  LOGIN_VIEW,
  REGISTER_VERIFY_VIEW,
  REGISTER_VIEW,
} from '../constants/authViews';
import { AUTH_API } from '../lib/api';
import { useLanguage } from '../lib/useLanguage';

const initialLoginForm = {
  identifier: '',
  password: '',
};

const initialRegisterForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const VIEW_TITLES = {
  [LOGIN_VIEW]: 'sign_in',
  [REGISTER_VIEW]: 'register',
  [REGISTER_VERIFY_VIEW]: 'email_verification',
  [LOGIN_VERIFY_VIEW]: 'login_verification',
};

const SHOW_VIEW_TITLE = new Set([REGISTER_VERIFY_VIEW, LOGIN_VERIFY_VIEW]);

export default function Auth({ setToken, mode }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [view, setView] = useState(LOGIN_VIEW);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginCode, setLoginCode] = useState('');
  const [registerCode, setRegisterCode] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const setError = (message) => setFeedback({ type: 'error', message });
  const setSuccess = (message) => setFeedback({ type: 'success', message });
  const clearFeedback = () => setFeedback(null);

  const switchTo = (nextView) => {
    setView(nextView);
    clearFeedback();
    if (nextView === LOGIN_VIEW) setLoginCode('');
    if (nextView === REGISTER_VIEW) setRegisterCode('');
  };

  const updateLoginForm = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const updateRegisterForm = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  };

  const loginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    navigate('/portal');
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSubmitting(true);

    try {
      const response = await axios.post(`${AUTH_API}/login-step1`, loginForm);
      setLoginEmail(response.data.email);
      setLoginCode('');
      setView(LOGIN_VERIFY_VIEW);
      setSuccess(t('verification_code_sent'));
    } catch (error) {
      setError(error.response?.data?.message || t('unable_continue_login'));
    } finally {
      setSubmitting(false);
    }
  };

  const resendLoginCode = async () => {
    clearFeedback();
    setSubmitting(true);

    try {
      const response = await axios.post(`${AUTH_API}/login-step1`, loginForm);
      setLoginEmail(response.data.email);
      setSuccess(t('new_login_code_sent'));
    } catch (error) {
      setError(error.response?.data?.message || t('resend_login_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitLoginCode = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSubmitting(true);

    try {
      const response = await axios.post(`${AUTH_API}/login-step2`, {
        email: loginEmail,
        code: loginCode,
      });
      loginSuccess(response.data);
    } catch (error) {
      setError(error.response?.data?.message || t('verification_code_invalid'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (registerForm.password !== registerForm.confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(`${AUTH_API}/register/request-code`, registerForm);
      setRegisterCode('');
      setView(REGISTER_VERIFY_VIEW);
      setSuccess(response.data.message || t('verification_code_sent'));
    } catch (error) {
      setError(error.response?.data?.message || t('register_start_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const resendRegisterCode = async () => {
    clearFeedback();
    setSubmitting(true);

    try {
      const response = await axios.post(`${AUTH_API}/register/request-code`, registerForm);
      setSuccess(response.data.message || t('register_code_resent'));
    } catch (error) {
      setError(error.response?.data?.message || t('register_resend_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitRegisterCode = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSubmitting(true);

    try {
      const response = await axios.post(`${AUTH_API}/register/verify-code`, {
        email: registerForm.email,
        code: registerCode,
      });
      loginSuccess(response.data);
    } catch (error) {
      setError(error.response?.data?.message || t('register_verify_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError(t('google_sign_in_failed'));
      return;
    }

    clearFeedback();
    setSubmitting(true);

    try {
      const response = await axios.post(`${AUTH_API}/google`, {
        credential: credentialResponse.credential,
      });
      loginSuccess(response.data);
    } catch (error) {
      setError(error.response?.data?.message || t('google_sign_in_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell minimal-shell">
        <AuthHero
          title={language === 'fr' ? 'Se connecter a' : 'Sign in to'}
          accent="ITDOC"
          caption={t('private_workspace_access')}
          mode={mode}
          compactTitle
        />

        <section className="auth-panel">
          <div className="auth-panel-main">
            <div className="auth-panel-head auth-panel-head-with-logo">
              <div className="auth-panel-head-copy">
                {SHOW_VIEW_TITLE.has(view) && <h2>{t(VIEW_TITLES[view])}</h2>}
              </div>
              <div className="auth-panel-tools">
                <img
                  className="brand-logo-img auth-panel-logo"
                  src="/ministere-equipement-logo.jpg"
                  alt="Logo du Ministere de l'Equipement et de l'Eau"
                />
              </div>
            </div>

            {(view === LOGIN_VIEW || view === REGISTER_VIEW) && (
              <AuthTabs view={view} onSwitch={switchTo} />
            )}

            {feedback && (
              <div className={`feedback-panel ${feedback.type}`} role="status" aria-live="polite">
                {feedback.message}
              </div>
            )}

            {view === LOGIN_VIEW && (
              <LoginForm
                form={loginForm}
                submitting={submitting}
                onChange={updateLoginForm}
                onSubmit={submitLogin}
                googleBlock={
                  googleEnabled ? (
                    <div className="auth-google-block">
                      <div className="auth-divider">
                        <span>{t('or_continue_with')}</span>
                      </div>
                      <div className="auth-google-button">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError(t('google_sign_in_failed'))}
                          locale={language === 'fr' ? 'fr' : 'en'}
                          text="continue_with"
                          theme="outline"
                          size="large"
                          shape="pill"
                          width={320}
                        />
                      </div>
                    </div>
                  ) : null
                }
              />
            )}

            {view === REGISTER_VIEW && (
              <RegisterForm
                form={registerForm}
                submitting={submitting}
                onChange={updateRegisterForm}
                onSubmit={submitRegister}
                googleBlock={
                  googleEnabled ? (
                    <div className="auth-google-block">
                      <div className="auth-divider">
                        <span>{t('or_continue_with')}</span>
                      </div>
                      <div className="auth-google-button">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError(t('google_sign_in_failed'))}
                          locale={language === 'fr' ? 'fr' : 'en'}
                          text="continue_with"
                          theme="outline"
                          size="large"
                          shape="pill"
                          width={320}
                        />
                      </div>
                    </div>
                  ) : null
                }
              />
            )}

            {view === REGISTER_VERIFY_VIEW && (
              <VerificationForm
                code={registerCode}
                submitting={submitting}
                submitLabel={t('create')}
                busyLabel={t('checking')}
                onCodeChange={setRegisterCode}
                onSubmit={submitRegisterCode}
                onResend={resendRegisterCode}
                onBack={() => switchTo(REGISTER_VIEW)}
                backLabel={t('edit')}
              />
            )}

            {view === LOGIN_VERIFY_VIEW && (
              <VerificationForm
                code={loginCode}
                submitting={submitting}
                submitLabel={t('sign_in')}
                busyLabel={t('checking')}
                submitIcon="shield"
                onCodeChange={setLoginCode}
                onSubmit={submitLoginCode}
                onResend={resendLoginCode}
                onBack={() => switchTo(LOGIN_VIEW)}
                backLabel={t('back')}
              />
            )}
          </div>

          <div className="auth-panel-footer auth-panel-footer--side">
            <SmokeyModeToggle />
          </div>
        </section>
      </div>
    </div>
  );
}
