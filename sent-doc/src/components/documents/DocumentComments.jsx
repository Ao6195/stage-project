import React from 'react';
import { FiCheck, FiCheckCircle, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { formatDate } from '../../lib/formatters';
import { useLanguage } from '../../lib/useLanguage';

export default function DocumentComments({
  commentText,
  commenting,
  comments,
  editingCommentId,
  editingCommentText,
  savingCommentId,
  deletingCommentId,
  onCommentChange,
  onCommentSubmit,
  onCommentEditStart,
  onCommentEditCancel,
  onCommentEditChange,
  onCommentEditSubmit,
  onCommentDelete,
}) {
  const { t } = useLanguage();
  return (
    <section className="surface-card comments-card">
      <header className="section-head document-section-head">
        <div>
          <p className="dashboard-eyebrow">{t('discussion')}</p>
          <h2>{t('comments')}</h2>
        </div>
      </header>

      <form className="comment-form" onSubmit={onCommentSubmit}>
        <textarea
          value={commentText}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder={t('write_comment')}
          required
        />
        <button type="submit" className="main-btn" disabled={commenting}>
          <FiCheckCircle />
          <span>{commenting ? t('posting') : t('post_comment')}</span>
        </button>
      </form>

      <div className="comment-list">
        {comments?.length ? (
          comments.map((comment) => (
            <article
              key={comment.id}
              className={`comment-item ${editingCommentId === comment.id ? 'comment-item-editing' : ''}`}
            >
              {(comment.canEdit || comment.canDelete) && (
                <div className="comment-actions">
                  {comment.canEdit && editingCommentId !== comment.id && (
                    <button
                      type="button"
                      className="comment-icon-btn"
                      aria-label={t('edit_comment')}
                      title={t('edit_comment')}
                      onClick={() => onCommentEditStart(comment)}
                      disabled={Boolean(deletingCommentId)}
                    >
                      <FiEdit2 />
                    </button>
                  )}
                  {comment.canDelete && (
                    <button
                      type="button"
                      className="comment-icon-btn danger"
                      aria-label={t('delete_comment')}
                      title={t('delete_comment')}
                      onClick={() => onCommentDelete(comment)}
                      disabled={deletingCommentId === comment.id || savingCommentId === comment.id}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              )}
              <div className="comment-top">
                <div className="comment-meta">
                  <strong>{comment.userName}</strong>
                  <span>
                    {formatDate(comment.createdAt)}
                    {comment.isEdited ? ` - ${t('edited')}` : ''}
                  </span>
                </div>
              </div>
              {editingCommentId === comment.id ? (
                <form className="comment-edit-form" onSubmit={(event) => onCommentEditSubmit(event, comment.id)}>
                  <textarea
                    value={editingCommentText}
                    onChange={(event) => onCommentEditChange(event.target.value)}
                    placeholder={t('write_comment')}
                    required
                  />
                  <div className="comment-edit-actions">
                    <button
                      type="button"
                      className="comment-secondary-btn"
                      onClick={onCommentEditCancel}
                      disabled={savingCommentId === comment.id}
                    >
                      <FiX />
                      <span>{t('cancel')}</span>
                    </button>
                    <button
                      type="submit"
                      className="comment-primary-btn"
                      disabled={savingCommentId === comment.id}
                    >
                      <FiCheck />
                      <span>{savingCommentId === comment.id ? t('saving') : t('save_comment')}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <p>{comment.text}</p>
              )}
            </article>
          ))
        ) : (
          <div className="preview-empty comment-empty">
            <h3>{t('no_comments_yet')}</h3>
            <p>{t('first_team_note')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
