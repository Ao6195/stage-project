import React, { useState } from 'react';
import { FiChevronDown, FiUploadCloud } from 'react-icons/fi';
import { useLanguage } from '../../lib/useLanguage';

const FILE_NAME_LIMIT = 34;

const formatFileName = (fileName, fallback) => {
  if (!fileName) return fallback;
  if (fileName.length <= FILE_NAME_LIMIT) return fileName;

  const extensionIndex = fileName.lastIndexOf('.');
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : '';
  const baseName = extension ? fileName.slice(0, extensionIndex) : fileName;
  const availableLength = Math.max(FILE_NAME_LIMIT - extension.length - 3, 8);

  return `${baseName.slice(0, availableLength)}...${extension}`;
};

export default function UploadAssetForm({
  selectedFileName,
  categories,
  selectedCategory,
  onSubmit,
  onFileChange,
  onCategoryChange,
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const visibleFileName = formatFileName(selectedFileName, t('add_file'));

  return (
    <div className={`upload-dropdown ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="upload-dropdown-trigger"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <FiUploadCloud />
          {t('upload_new_asset')}
        </span>
        <FiChevronDown className="upload-dropdown-chevron" />
      </button>

      {isOpen && (
        <form className="upload-box polished-upload-box" onSubmit={onSubmit}>
          <div className="upload-part upload-main-part">
            <div className="upload-main-row">
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
            </div>

            <div className="upload-field upload-file-field">
              <label htmlFor="asset-file" className="file-input-shell" title={selectedFileName || t('add_file')}>
                <span className="file-input-icon">+</span>
                <span className="file-input-copy">
                  <strong>{visibleFileName}</strong>
                  <small>{t('select_file')}</small>
                </span>
              </label>
              <input id="asset-file" name="file" type="file" required onChange={onFileChange} />
            </div>
          </div>

          <div className="upload-part upload-description-part">
            <textarea
              id="asset-description"
              name="description"
              aria-label={t('description')}
              placeholder={t('description')}
              required
            />
          </div>

          <div className="upload-part upload-action-part">
            <button type="submit" className="main-btn upload-submit-btn" aria-label={t('publish')} title={t('publish')}>
              <FiUploadCloud />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
