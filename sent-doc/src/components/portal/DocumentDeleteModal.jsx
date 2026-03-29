import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

export default function DocumentDeleteModal({ target, deleting, onClose, onConfirm }) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>{t('delete_document')}</h3>
        <p className="modal-copy">{t('delete_document_copy', { title: target.title })}</p>

        <div className="modal-meta">
          <span>{t('delete_department')}</span>
          <strong>{target.department}</strong>
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={deleting}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="danger-btn modal-confirm-btn"
            onClick={onConfirm}
            disabled={deleting}
          >
            <FiTrash2 />
            <span>{deleting ? t('deleting') : t('delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
