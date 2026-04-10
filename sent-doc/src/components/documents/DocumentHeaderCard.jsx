import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiDownloadCloud, FiEye, FiFileText, FiMessageSquare, FiRefreshCw, FiUser, FiX } from 'react-icons/fi';
import { useLanguage } from '../../lib/useLanguage';

export default function DocumentHeaderCard({ doc, openingFile, approving, onApprove, onOpenOriginal }) {
  const { t } = useLanguage();

  return (
    <section className="surface-card document-header-card">
      <Link to="/portal" className="document-back-btn" aria-label={t('back')}>
        <FiX />
      </Link>

      <div className="document-header-grid">
        <div>
          <p className="dashboard-eyebrow">{t('document_view')}</p>
          <h2>{doc.title}</h2>
          <p className="dashboard-copy">{doc.description}</p>

          <div className="document-tag-row">
            <span className="badge approved">{doc.department}</span>
            {doc.isPending && <span className="badge pending">{t('pending')}</span>}
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
          {doc.canApprove && (
            <button type="button" className="ghost-btn" onClick={onApprove} disabled={approving}>
              <FiCheck />
              <span>{approving ? t('saving') : t('approve')}</span>
            </button>
          )}
          <button type="button" className="main-btn" onClick={onOpenOriginal} disabled={openingFile}>
            <FiEye />
            <span>{openingFile ? t('opening') : t('open_file')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
