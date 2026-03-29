import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import DocumentComments from '../components/documents/DocumentComments';
import DocumentHeaderCard from '../components/documents/DocumentHeaderCard';
import DocumentPreview from '../components/documents/DocumentPreview';
import DocumentSidebar from '../components/documents/DocumentSidebar';
import { API_BASE, getAuthConfig } from '../lib/api';
import { useLanguage } from '../lib/i18n';

export default function DocumentView() {
  const { t } = useLanguage();
  const { docId } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [openingFile, setOpeningFile] = useState(false);
  const [updatingMeta, setUpdatingMeta] = useState(false);
  const [replacingFile, setReplacingFile] = useState(false);
  const [savingText, setSavingText] = useState(false);
  const [replaceFileName, setReplaceFileName] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState('');
  const [textContent, setTextContent] = useState('');
  const [metaForm, setMetaForm] = useState({ title: '', description: '' });

  const fetchDocument = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/documents/${docId}`, getAuthConfig());
      setDoc(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('document_load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [docId]);

  useEffect(() => {
    if (!doc) return;

    setMetaForm({
      title: doc.title || '',
      description: doc.description || '',
    });
  }, [doc]);

  useEffect(() => {
    const loadTextContent = async () => {
      if (!doc || doc.fileCategory !== 'text') {
        setTextContent('');
        setTextError('');
        return;
      }

      setTextLoading(true);
      setTextError('');

      try {
        const response = await axios.get(`${API_BASE}/documents/${docId}/text`, getAuthConfig());
        setTextContent(response.data.content || '');
      } catch (requestError) {
        setTextError(
          requestError.response?.data?.message || t('text_preview_load_failed')
        );
      } finally {
        setTextLoading(false);
      }
    };

    loadTextContent();
  }, [doc, docId]);

  const handleVote = async (value) => {
    setVoting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_BASE}/documents/${docId}/vote`,
        { value },
        getAuthConfig()
      );
      setDoc(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('vote_save_failed'));
    } finally {
      setVoting(false);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    setCommenting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_BASE}/documents/${docId}/comments`,
        { text: commentText },
        getAuthConfig()
      );
      setDoc(response.data);
      setCommentText('');
      setSuccess(t('comment_posted_successfully'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('comment_post_failed'));
    } finally {
      setCommenting(false);
    }
  };

  const handleOpenOriginal = async () => {
    setOpeningFile(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/download/${docId}`, getAuthConfig());
      window.open(response.data.url, '_blank', 'noopener,noreferrer');
      fetchDocument();
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('original_file_open_failed'));
    } finally {
      setOpeningFile(false);
    }
  };

  const handleMetaSubmit = async (event) => {
    event.preventDefault();
    setUpdatingMeta(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(
        `${API_BASE}/documents/${docId}`,
        metaForm,
        getAuthConfig()
      );
      setDoc(response.data);
      setSuccess(t('document_updated_successfully'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('document_details_update_failed'));
    } finally {
      setUpdatingMeta(false);
    }
  };

  const handleReplaceFile = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    if (!formData.get('file')) return;

    setReplacingFile(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`${API_BASE}/documents/${docId}/file`, formData, {
        headers: {
          Authorization: localStorage.getItem('token'),
        },
      });
      setDoc(response.data);
      setReplaceFileName(t('no_file_selected'));
      event.target.reset();
      setSuccess(t('document_content_replaced_successfully'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('replace_file_failed'));
    } finally {
      setReplacingFile(false);
    }
  };

  const handleTextSave = async () => {
    setSavingText(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `${API_BASE}/documents/${docId}/text`,
        { content: textContent },
        getAuthConfig()
      );
      setDoc(response.data);
      setSuccess(t('text_document_updated_successfully'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('text_document_save_failed'));
    } finally {
      setSavingText(false);
    }
  };

  const updateMetaForm = (field, value) => {
    setMetaForm((current) => ({ ...current, [field]: value }));
  };

  if (loading) {
    return (
        <section className="surface-card empty-state-card">
        <h3>{t('loading_document')}</h3>
      </section>
    );
  }

  if (!doc) {
    return (
        <section className="surface-card empty-state-card">
        <h3>{t('document_unavailable')}</h3>
        <p>{error || t('document_not_found')}</p>
        <Link className="tab-btn active action-link-btn" to="/">
          {t('return_to_assets')}
        </Link>
      </section>
    );
  }

  return (
    <div className="dashboard-stack document-page">
      <DocumentHeaderCard
        doc={doc}
        openingFile={openingFile}
        onOpenOriginal={handleOpenOriginal}
      />

      {error && <div className="feedback-panel error inline-feedback">{error}</div>}
      {success && <div className="feedback-panel success inline-feedback">{success}</div>}

      <div className="document-layout">
        <DocumentPreview
          doc={doc}
          textLoading={textLoading}
          textError={textError}
          textContent={textContent}
          savingText={savingText}
          onTextChange={setTextContent}
          onTextSave={handleTextSave}
        />

        <DocumentSidebar
          doc={doc}
          voting={voting}
          updatingMeta={updatingMeta}
          replacingFile={replacingFile}
          replaceFileName={replaceFileName}
          metaForm={metaForm}
          onVote={handleVote}
          onMetaChange={updateMetaForm}
          onMetaSubmit={handleMetaSubmit}
          onReplaceFileNameChange={setReplaceFileName}
          onReplaceFile={handleReplaceFile}
        />
      </div>

      <DocumentComments
        commentText={commentText}
        commenting={commenting}
        comments={doc.comments}
        onCommentChange={setCommentText}
        onCommentSubmit={handleCommentSubmit}
      />
    </div>
  );
}
