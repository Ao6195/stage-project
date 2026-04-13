import React from 'react';
import { useLanguage } from '../../lib/useLanguage';

export default function SmokeyModeToggle() {
  const { language, setLanguage, t } = useLanguage();
  const currentLanguage = language === 'fr' ? 'fr' : 'en';
  const nextLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
  const currentLabel = currentLanguage === 'fr' ? 'Francais' : 'English';

  return (
    <button
      type="button"
      className={`smokey-mode-toggle ${currentLanguage === 'fr' ? 'is-fr' : 'is-en'}`}
      onClick={() => setLanguage(nextLanguage)}
      aria-label={`${t('language')}: ${currentLabel}`}
      title={`${t('language')}: ${currentLabel}`}
    >
      <span className="smokey-mode-toggle__thumb" aria-hidden="true" />
      <span className="smokey-mode-toggle__label smokey-mode-toggle__label--en">EN</span>
      <span className="smokey-mode-toggle__label smokey-mode-toggle__label--fr">FR</span>
    </button>
  );
}
