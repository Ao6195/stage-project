import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

export default function UploadAssetForm({
  selectedFileName,
  onSubmit,
  onFileChange,
}) {
  const { t } = useLanguage();

  return (
    <form className="upload-box polished-upload-box" onSubmit={onSubmit}>
      <div className="upload-field">
        <input
          id="asset-title"
          name="title"
          aria-label={t('asset_title')}
          placeholder={t('asset_title')}
          maxLength={15}
          required
        />
      </div>

      <div className="upload-field upload-file-field">
        <label htmlFor="asset-file" className="file-input-shell">
          <span className="file-input-icon">+</span>
          <span className="file-input-copy">
            <strong>{selectedFileName || t('add_file')}</strong>
          </span>
        </label>
        <input id="asset-file" name="file" type="file" required onChange={onFileChange} />
      </div>

      <div className="upload-field upload-description-field">
        <textarea
          id="asset-description"
          name="description"
          aria-label={t('description')}
          placeholder={t('description')}
          required
        />
      </div>

      <button type="submit" className="main-btn upload-submit-btn">
        <FiUploadCloud />
        <span>{t('publish')}</span>
      </button>
    </form>
  );
}
