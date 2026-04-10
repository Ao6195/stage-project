import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import { useLanguage } from '../../lib/useLanguage';

export default function UploadAssetForm({
  selectedFileName,
  categories,
  selectedCategory,
  onSubmit,
  onFileChange,
  onCategoryChange,
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

      <div className="upload-field">
        <select
          name="department"
          className="category-select"
          aria-label={t('category')}
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
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
