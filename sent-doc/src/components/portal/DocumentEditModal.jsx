import React from 'react';
import { FiEdit3 } from 'react-icons/fi';
import { useLanguage } from '../../lib/useLanguage';

export default function DocumentEditModal({
  editForm,
  categories,
  savingEdit,
  onChange,
  onClose,
  onSubmit,
}) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>{t('modify_document')}</h3>
        <p className="modal-copy">{t('update_document_copy')}</p>

        <form className="modal-form" onSubmit={onSubmit}>
          <label className="modal-field">
            <span>{t('title')}</span>
            <input
              value={editForm.title}
              onChange={(event) => onChange('title', event.target.value)}
              maxLength={15}
              required
            />
          </label>

          <label className="modal-field">
            <span>{t('description')}</span>
            <textarea
              value={editForm.description}
              onChange={(event) => onChange('description', event.target.value)}
              required
            />
          </label>

          <label className="modal-field">
            <span>{t('category')}</span>
            <select
              className="modal-select"
              value={editForm.department}
              onChange={(event) => onChange('department', event.target.value)}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose} disabled={savingEdit}>
              {t('cancel')}
            </button>
            <button type="submit" className="main-btn modal-confirm-btn" disabled={savingEdit}>
              <FiEdit3 />
              <span>{savingEdit ? t('saving') : t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
