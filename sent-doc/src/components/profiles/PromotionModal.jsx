import React from 'react';
import { FiShield } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

export default function PromotionModal({ target, promoting, onClose, onConfirm }) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="promote-title">
      <div className="modal-card">
        <p className="dashboard-eyebrow">{t('confirmation')}</p>
        <h3 id="promote-title">{t('promote_this_user')}</h3>
        <p className="modal-copy">{t('promote_copy', { name: target.name || target.username })}</p>
        <div className="modal-meta">
          <span>{target.email}</span>
          <span className={`badge ${target.role === 'admin' ? 'approved' : 'pending'}`}>
            {target.role}
          </span>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={promoting}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="main-btn modal-confirm-btn"
            onClick={onConfirm}
            disabled={promoting}
          >
            <FiShield />
            <span>{promoting ? t('promoting') : t('confirm_promotion')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
