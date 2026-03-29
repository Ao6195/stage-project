import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiBarChart2, FiFolderPlus, FiLayers } from 'react-icons/fi';
import DocumentCard from '../components/portal/DocumentCard';
import DocumentDeleteModal from '../components/portal/DocumentDeleteModal';
import DocumentEditModal from '../components/portal/DocumentEditModal';
import UploadAssetForm from '../components/portal/UploadAssetForm';
import { API_BASE, getAuthConfig } from '../lib/api';
import { useLanguage } from '../lib/i18n';

const DEPARTMENTS = ['Exploitation', 'Data', 'Security'];
const SORT_OPTIONS = ['likes', 'newest', 'oldest'];

const getDepartmentScore = (docs, department) =>
  docs
    .filter((doc) => doc.department === department)
    .reduce((sum, doc) => sum + Number(doc.score || 0), 0);

export default function Portal() {
  const { t } = useLanguage();
  const [docs, setDocs] = useState([]);
  const [activeDept, setActiveDept] = useState('Security');
  const [sortMode, setSortMode] = useState('likes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const rankedDepartments = useMemo(
    () =>
      [...DEPARTMENTS].sort((left, right) => {
        const scoreDiff = getDepartmentScore(docs, right) - getDepartmentScore(docs, left);
        return scoreDiff !== 0 ? scoreDiff : left.localeCompare(right);
      }),
    [docs]
  );

  const activeDocs = useMemo(
    () =>
      docs
        .filter((doc) => doc.department === activeDept)
        .sort((left, right) => {
          if (sortMode === 'newest') {
            return new Date(right.updatedAt || right.createdAt).getTime() -
              new Date(left.updatedAt || left.createdAt).getTime();
          }

          if (sortMode === 'oldest') {
            return new Date(left.updatedAt || left.createdAt).getTime() -
              new Date(right.updatedAt || right.createdAt).getTime();
          }

          const scoreDiff = Number(right.score || 0) - Number(left.score || 0);
          return scoreDiff !== 0
            ? scoreDiff
            : new Date(right.updatedAt || right.createdAt).getTime() -
                new Date(left.updatedAt || left.createdAt).getTime();
        }),
    [activeDept, docs, sortMode]
  );

  const stats = useMemo(() => {
    const totalScore = docs.reduce((sum, doc) => sum + Number(doc.score || 0), 0);
    return [
      { label: t('assets'), value: docs.length, icon: <FiLayers /> },
      { label: t('department'), value: activeDept, icon: <FiFolderPlus /> },
      { label: t('community_score'), value: totalScore, icon: <FiBarChart2 /> },
    ];
  }, [activeDept, docs, t]);

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    if (!rankedDepartments.includes(activeDept) && rankedDepartments.length > 0) {
      setActiveDept(rankedDepartments[0]);
    }
  }, [activeDept, rankedDepartments]);

  const fetchDocs = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/documents`, getAuthConfig());
      setDocs(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('documents_load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formData = new FormData(event.target);
      formData.append('department', activeDept);
      await axios.post(`${API_BASE}/upload`, formData, getAuthConfig());
      event.target.reset();
      setSelectedFileName(t('no_file_selected'));
      setSuccess(t('asset_published_successfully'));
      fetchDocs();
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('upload_failed'));
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editTarget) return;

    setSavingEdit(true);
    setError('');
    setSuccess('');

    try {
      await axios.patch(
        `${API_BASE}/documents/${editTarget._id || editTarget.id}`,
        editForm,
        getAuthConfig()
      );
      setEditTarget(null);
      setSuccess(t('document_updated_successfully'));
      fetchDocs();
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('document_modified_failed'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await axios.delete(`${API_BASE}/documents/${deleteTarget._id || deleteTarget.id}`, getAuthConfig());
      setDeleteTarget(null);
      setSuccess(t('document_deleted_successfully'));
      fetchDocs();
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('document_delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (doc) => {
    setSuccess('');
    setError('');
    setEditTarget(doc);
    setEditForm({
      title: doc.title || '',
      description: doc.description || '',
    });
  };

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">{t('workspace')}</p>
          <h1>{user.name || user.username || t('welcome_back')}</h1>
          <p className="dashboard-copy">{t('workspace_copy')}</p>
        </div>

        <div className="dashboard-stat-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="dashboard-stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <header className="section-head">
          <div>
            <p className="dashboard-eyebrow">{t('departments')}</p>
            <h2>{t('asset_feed')}</h2>
          </div>
          <span className="section-note">
            {t('sorted_by', { value: t(sortMode) })}
          </span>
        </header>

        <div className="dept-tabs polished-tabs">
          {rankedDepartments.map((dept) => (
            <button
              key={dept}
              className={`tab-btn ${activeDept === dept ? 'active' : ''}`}
              onClick={() => setActiveDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="sort-toolbar">
          <span className="sort-toolbar-label">{t('sort')}</span>
          <div className="sort-tabs" role="tablist" aria-label="Sort documents">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`tab-btn sort-btn ${sortMode === option ? 'active' : ''}`}
                onClick={() => setSortMode(option)}
              >
                {t(option)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-card">
        <header className="section-head">
          <div>
            <p className="dashboard-eyebrow">{t('publish')}</p>
            <h2>{t('upload_new_asset')}</h2>
          </div>
        </header>

        <UploadAssetForm
          selectedFileName={selectedFileName}
          onSubmit={handleUpload}
          onFileChange={(event) =>
            setSelectedFileName(event.target.files?.[0]?.name || t('no_file_selected'))
          }
        />
      </section>

      {error && <div className="feedback-panel error inline-feedback">{error}</div>}
      {success && <div className="feedback-panel success inline-feedback">{success}</div>}

      {loading ? (
        <section className="surface-card empty-state-card">
          <h3>{t('loading_assets')}</h3>
        </section>
      ) : activeDocs.length === 0 ? (
        <section className="surface-card empty-state-card">
          <h3>{t('no_assets_in', { department: activeDept })}</h3>
          <p>{t('assets_appear_copy')}</p>
        </section>
      ) : (
        <div className="card-grid polished-card-grid">
          {activeDocs.map((doc) => (
            <DocumentCard
              key={doc._id || doc.id}
              doc={doc}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {editTarget && (
        <DocumentEditModal
          editForm={editForm}
          savingEdit={savingEdit}
          onChange={(field, value) =>
            setEditForm((current) => ({ ...current, [field]: value }))
          }
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deleteTarget && (
        <DocumentDeleteModal
          target={deleteTarget}
          deleting={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
