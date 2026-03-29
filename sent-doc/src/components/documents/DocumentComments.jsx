import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { formatDate } from '../../lib/formatters';
import { useLanguage } from '../../lib/i18n';

export default function DocumentComments({
  commentText,
  commenting,
  comments,
  onCommentChange,
  onCommentSubmit,
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
            <article key={comment.id} className="comment-item">
              <div className="comment-top">
                <strong>{comment.userName}</strong>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p>{comment.text}</p>
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
