import React from 'react';
import { FiEdit3, FiThumbsDown, FiThumbsUp, FiUploadCloud } from 'react-icons/fi';
import { formatScore } from '../../lib/formatters';
import { useLanguage } from '../../lib/i18n';

export default function DocumentSidebar({
  doc,
  voting,
  updatingMeta,
  replacingFile,
  replaceFileName,
  metaForm,
  onVote,
  onMetaChange,
  onMetaSubmit,
  onReplaceFileNameChange,
  onReplaceFile,
}) {
  const { t } = useLanguage();
  return (
    <aside className="document-side-stack">
      <section className="surface-card document-vote-card">
        <p className="dashboard-eyebrow">{t('community')}</p>
        <div className="document-score-value">{formatScore(doc.score)}</div>
        <p className="document-score-copy">{t('vote_copy')}</p>

        <div className="vote-actions">
          <button
            type="button"
            className={`vote-btn ${doc.viewerVote === 1 ? 'active' : ''}`}
            onClick={() => onVote(1)}
            disabled={voting}
          >
            <FiThumbsUp />
            <span>{t('like')}</span>
          </button>
          <button
            type="button"
            className={`vote-btn ${doc.viewerVote === -1 ? 'active negative' : 'negative'}`}
            onClick={() => onVote(-1)}
            disabled={voting}
          >
            <FiThumbsDown />
            <span>{t('dislike')}</span>
          </button>
        </div>
      </section>

      {doc.canManage && (
        <section className="surface-card document-manage-card">
          <p className="dashboard-eyebrow">{t('manage')}</p>
          <h3>{t('update_this_asset')}</h3>

          <form className="document-manage-form" onSubmit={onMetaSubmit}>
            <label className="modal-field">
              <span>{t('title')}</span>
              <input
                value={metaForm.title}
                onChange={(event) => onMetaChange('title', event.target.value)}
                required
              />
            </label>

            <label className="modal-field">
              <span>{t('description')}</span>
              <textarea
                value={metaForm.description}
                onChange={(event) => onMetaChange('description', event.target.value)}
                required
              />
            </label>

            <button type="submit" className="main-btn" disabled={updatingMeta}>
              <FiEdit3 />
              <span>{updatingMeta ? t('saving') : t('save_details')}</span>
            </button>
          </form>

          {doc.canEditContent && doc.fileCategory !== 'text' && (
            <form className="document-replace-form" onSubmit={onReplaceFile}>
              <label className="modal-field">
                <span>{t('replace_file_content')}</span>
                <label htmlFor="replace-file" className="file-input-shell compact-file-input">
                  <span className="file-input-icon">+</span>
                  <span className="file-input-copy">
                    <strong>{replaceFileName || t('no_file_selected')}</strong>
                    <small>{t('replace_file_copy', { type: doc.fileCategory })}</small>
                  </span>
                </label>
                <input
                  id="replace-file"
                  name="file"
                  type="file"
                  required
                  onChange={(event) => onReplaceFileNameChange(event.target.files?.[0]?.name || t('no_file_selected'))}
                />
              </label>

              <button type="submit" className="ghost-btn" disabled={replacingFile}>
                <FiUploadCloud />
                <span>{replacingFile ? t('replacing') : t('replace')}</span>
              </button>
            </form>
          )}
        </section>
      )}
    </aside>
  );
}
