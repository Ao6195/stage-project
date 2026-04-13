import React, { memo, useEffect, useState } from 'react';
import SmokeyBackgroundCanvas from '../ui/SmokeyBackgroundCanvas';

const DEFAULT_SMOKE_THEME = {
  primary: '#60a5fa',
  strong: 'rgba(96, 165, 250, 0.32)',
  medium: 'rgba(96, 165, 250, 0.22)',
  soft: 'rgba(96, 165, 250, 0.16)',
  faint: 'rgba(96, 165, 250, 0.08)',
};

function parseColor(color) {
  const value = color.trim();

  if (!value) return null;

  if (value.startsWith('#')) {
    const normalized = value.slice(1);
    const safeHex = normalized.length === 3
      ? normalized.split('').map((item) => `${item}${item}`).join('')
      : normalized;

    const parsed = Number.parseInt(safeHex, 16);
    if (Number.isNaN(parsed)) return null;

    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
    };
  }

  if (value.startsWith('rgb')) {
    const matches = value.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length < 3) return null;

    return {
      r: Number(matches[0]),
      g: Number(matches[1]),
      b: Number(matches[2]),
    };
  }

  return null;
}

function withAlpha(color, alpha) {
  const parsed = parseColor(color);
  if (!parsed) return `rgba(96, 165, 250, ${alpha})`;

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
}

function readSmokeTheme() {
  if (typeof document === 'undefined') {
    return DEFAULT_SMOKE_THEME;
  }

  const rootStyles = window.getComputedStyle(document.documentElement);
  const primary = rootStyles.getPropertyValue('--primary').trim() || DEFAULT_SMOKE_THEME.primary;
  const primarySoft = rootStyles.getPropertyValue('--primary-soft').trim();

  return {
    primary,
    strong: withAlpha(primary, 0.32),
    medium: withAlpha(primary, 0.22),
    soft: primarySoft || withAlpha(primary, 0.16),
    faint: withAlpha(primary, 0.08),
  };
}

function AuthHeroVisual({
  title,
  accent,
  caption,
  mode,
  compactTitle = false,
}) {
  const [smokeTheme, setSmokeTheme] = useState(readSmokeTheme);

  useEffect(() => {
    const updateSmokeTheme = () => {
      setSmokeTheme(readSmokeTheme());
    };

    updateSmokeTheme();

    const observer = new MutationObserver(updateSmokeTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-mode'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const smokeThemeStyle = {
    '--auth-smoke-theme': smokeTheme.primary,
    '--auth-smoke-theme-strong': smokeTheme.strong,
    '--auth-smoke-theme-medium': smokeTheme.medium,
    '--auth-smoke-theme-soft': smokeTheme.soft,
    '--auth-smoke-theme-faint': smokeTheme.faint,
  };

  return (
    <div
      className={`auth-visual-layer auth-smokey-visual ${mode === 'dark' ? 'is-dark' : 'is-light'}`}
      style={smokeThemeStyle}
    >
      <div className="auth-smoke-field">
        <div className="auth-smoke-field__shader" aria-hidden="true">
          <SmokeyBackgroundCanvas color={smokeTheme.primary} blur={mode === 'dark' ? 16 : 18} />
        </div>
        <div className="auth-smoke-field__glow auth-smoke-field__glow--one" aria-hidden="true" />
        <div className="auth-smoke-field__glow auth-smoke-field__glow--two" aria-hidden="true" />
        <div className="auth-smoke-field__glow auth-smoke-field__glow--three" aria-hidden="true" />
        <div className="auth-smoke-field__veil" aria-hidden="true" />
        <div className="auth-smoke-field__grain" aria-hidden="true" />

        <div className="auth-smokey-copy">
          <h1 className={`auth-smokey-title ${compactTitle ? 'auth-smokey-title--single-line' : ''}`}>
            <span className="auth-smokey-title-main">{title}</span>
            <span className="auth-smokey-title-accent">{accent}</span>
          </h1>
          {caption ? <p className="auth-smokey-caption">{caption}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default memo(AuthHeroVisual);
