import React from 'react';
import { useLanguage } from '../../lib/useLanguage';

export default function ConfirmModal({
  titleId = 'confirm-modal-title',
  eyebrow,
  title,
  copy,
  meta = null,
  confirmLabel,
  busyLabel,
  busy = false,
  confirmClassName = 'main-btn modal-confirm-btn',
  ConfirmIcon = null,
  onClose,
  onConfirm,
}) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="modal-card">
        {eyebrow ? <p className="dashboard-eyebrow">{eyebrow}</p> : null}
        <h3 id={titleId}>{title}</h3>
        {copy ? <p className="modal-copy">{copy}</p> : null}
        {meta ? <div className="modal-meta">{meta}</div> : null}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={busy}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className={confirmClassName}
            onClick={onConfirm}
            disabled={busy}
          >
            {ConfirmIcon ? <ConfirmIcon /> : null}
            <span>{busy ? busyLabel : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
