import React from 'react';
import { FiSave } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

export default function DocumentPreview({
  doc,
  textLoading,
  textError,
  textContent,
  savingText,
  onTextChange,
  onTextSave,
}) {
  const { t } = useLanguage();
  const renderPreview = () => {
    if (doc.fileCategory === 'image') {
      return (
        <div className="document-preview-shell">
          <img className="document-preview-image" src={doc.fileUrl} alt={doc.title} />
        </div>
      );
    }

    if (doc.fileCategory === 'video') {
      return (
        <div className="document-preview-shell">
          <video className="document-preview-video" src={doc.fileUrl} controls />
        </div>
      );
    }

    if (doc.fileCategory === 'text') {
      if (textLoading) {
        return <div className="preview-empty">{t('loading_text_preview')}</div>;
      }

      if (textError) {
        return <div className="feedback-panel error inline-feedback">{textError}</div>;
      }

      return (
        <div className="document-preview-shell">
          {doc.canEditContent ? (
            <>
              <textarea
                className="document-text-editor"
                value={textContent}
                onChange={(event) => onTextChange(event.target.value)}
              />
              <div className="document-editor-actions">
                <button type="button" className="main-btn" onClick={onTextSave} disabled={savingText}>
                  <FiSave />
                  <span>{savingText ? t('saving') : t('save_text')}</span>
                </button>
              </div>
            </>
          ) : (
            <pre className="document-text-preview">{textContent}</pre>
          )}
        </div>
      );
    }

    if (doc.fileCategory === 'document') {
      return (
        <div className="document-preview-shell document-frame-shell">
          <iframe className="document-preview-frame" src={doc.fileUrl} title={doc.title} />
        </div>
      );
    }

    return (
      <div className="preview-empty">
        <h3>{t('preview_unavailable')}</h3>
        <p>{t('preview_unavailable_copy')}</p>
      </div>
    );
  };

  return (
    <section className="surface-card document-preview-card">
      <header className="section-head document-section-head">
        <div>
          <p className="dashboard-eyebrow">{t('preview')}</p>
          <h2>{t('live_document')}</h2>
        </div>
      </header>

      {renderPreview()}
    </section>
  );
}
