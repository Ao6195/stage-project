import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiEdit3, FiEye, FiFileText, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '../../lib/useLanguage';

export default function DocumentCard({ doc, approving, onEdit, onDelete, onApprove }) {
  const { t } = useLanguage();

  return (
    <article className="doc-card polished-doc-card">
      {(doc.isPending || doc.canApprove) && (
        <div className="card-top">
          {doc.isPending ? <span className="badge pending">{t('pending')}</span> : <span />}
          {doc.canApprove && (
            <button
              type="button"
              className="ghost-btn card-mini-btn admin-icon-btn approve-btn"
              onClick={() => onApprove(doc)}
              disabled={approving}
              aria-label={approving ? t('saving') : t('approve')}
              title={approving ? t('saving') : t('approve')}
            >
              <FiCheck />
            </button>
          )}
        </div>
      )}

      <h3>{doc.title}</h3>
      <p>{doc.description}</p>

      <div className="doc-card-meta">
        <span
          className={`score-chip ${
            Number(doc.score || 0) >= 0 ? 'score-chip-positive' : 'score-chip-negative'
          }`}
        >
          <span>{t('likes')}</span>
          <span>{doc.score || 0}</span>
        </span>
        <span>
          <FiFileText />
          <span>{doc.fileCategory || 'file'}</span>
        </span>
        <span>
          <FiMessageSquare />
          <span>{t('comments_count', { count: doc.commentCount || 0 })}</span>
        </span>
      </div>

      <div className="card-footer card-footer-stack">
        <div className="doc-card-owner" title={doc.ownerName || t('unknown')}>
          <span className="doc-card-owner-label">{t('by')}</span>
          <strong className="doc-card-owner-name">{doc.ownerName || t('unknown')}</strong>
        </div>

        <div className="card-actions">
          <Link to={`/documents/${doc._id || doc.id}`} className="tab-btn active action-link-btn">
            <FiEye />
            <span>{t('view')}</span>
          </Link>

          {doc.canManage && (
            <>
              <button
                type="button"
                className="ghost-btn card-mini-btn admin-icon-btn"
                onClick={() => onEdit(doc)}
                aria-label={t('modify')}
                title={t('modify')}
              >
                <FiEdit3 />
              </button>
              <button
                type="button"
                className="danger-btn card-mini-btn admin-icon-btn"
                onClick={() => onDelete(doc)}
                aria-label={t('delete')}
                title={t('delete')}
              >
                <FiTrash2 />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
