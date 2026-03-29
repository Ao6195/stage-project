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
        <label htmlFor="asset-title">{t('asset_title')}</label>
        <input id="asset-title" name="title" placeholder={t('asset_title')} required />
      </div>

      <div className="upload-field upload-file-field">
        <label htmlFor="asset-file">{t('add_file')}</label>
        <label htmlFor="asset-file" className="file-input-shell">
          <span className="file-input-icon">+</span>
          <span className="file-input-copy">
            <strong>{selectedFileName || t('no_file_selected')}</strong>
            <small>{t('select_file')}</small>
          </span>
          <span className="file-input-cta">{t('browse')}</span>
        </label>
        <input id="asset-file" name="file" type="file" required onChange={onFileChange} />
      </div>

      <div className="upload-field upload-description-field">
        <label htmlFor="asset-description">{t('description')}</label>
        <textarea
          id="asset-description"
          name="description"
          placeholder={t('short_summary')}
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
