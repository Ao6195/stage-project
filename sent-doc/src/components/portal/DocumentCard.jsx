import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiEdit3, FiEye, FiFileText, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

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
              className="ghost-btn card-mini-btn approve-btn"
              onClick={() => onApprove(doc)}
              disabled={approving}
            >
              <FiCheck />
              <span>{approving ? t('saving') : t('approve')}</span>
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
              <button type="button" className="ghost-btn card-mini-btn" onClick={() => onEdit(doc)}>
                <FiEdit3 />
                <span>{t('modify')}</span>
              </button>
              <button type="button" className="danger-btn card-mini-btn" onClick={() => onDelete(doc)}>
                <FiTrash2 />
                <span>{t('delete')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
