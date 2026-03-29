import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiDownloadCloud, FiEye, FiFileText, FiMessageSquare, FiRefreshCw, FiUser } from 'react-icons/fi';
import { formatScore } from '../../lib/formatters';
import { useLanguage } from '../../lib/i18n';

export default function DocumentHeaderCard({ doc, openingFile, onOpenOriginal }) {
  const { t } = useLanguage();

  return (
    <section className="surface-card document-header-card">
      <div className="document-header-top">
        <Link to="/" className="ghost-link-chip">
          <FiArrowLeft />
          <span>{t('back')}</span>
        </Link>
        <span
          className={`score-chip ${
            Number(doc.score || 0) >= 0 ? 'score-chip-positive' : 'score-chip-negative'
          }`}
        >
          {t('score')} {formatScore(doc.score)}
        </span>
      </div>

      <div className="document-header-grid">
        <div>
          <p className="dashboard-eyebrow">{t('document_view')}</p>
          <h2>{doc.title}</h2>
          <p className="dashboard-copy">{doc.description}</p>

          <div className="document-tag-row">
            <span className="badge approved">{doc.department}</span>
            <span className="document-tag">
              <FiFileText />
              <span>{doc.fileCategory}</span>
            </span>
            <span className="document-tag">
              <FiMessageSquare />
              <span>{t('comments_count', { count: doc.commentCount || 0 })}</span>
            </span>
            <span className="document-tag">
              <FiRefreshCw />
              <span>{t('version', { count: doc.history?.length || 1 })}</span>
            </span>
          </div>
        </div>

        <div className="document-header-side">
          <div className="document-mini-stat">
            <span>{t('sender')}</span>
            <div className="mini-stat-line">
              <FiUser />
              <strong>{doc.ownerName}</strong>
            </div>
          </div>
          <div className="document-mini-stat">
            <span>{t('downloads')}</span>
            <div className="mini-stat-line">
              <FiDownloadCloud />
              <strong>{doc.downloadCount || 0}</strong>
            </div>
          </div>
          <button type="button" className="main-btn" onClick={onOpenOriginal} disabled={openingFile}>
            <FiEye />
            <span>{openingFile ? t('opening') : t('open_file')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
