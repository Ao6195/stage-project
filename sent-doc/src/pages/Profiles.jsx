import React, { useMemo, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { FiSearch, FiTrash2 } from 'react-icons/fi';
import ConfirmModal from '../components/common/ConfirmModal';
import ProfileCard from '../components/profiles/ProfileCard';
import PromotionModal from '../components/profiles/PromotionModal';
import StaffActivityModal from '../components/profiles/StaffActivityModal';
import { API_BASE, getAuthConfig } from '../lib/api';
import { useLanguage } from '../lib/useLanguage';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Profiles() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promoting, setPromoting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState('');
  const [viewTarget, setViewTarget] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [selectedRange, setSelectedRange] = useState('week');
  const me = JSON.parse(localStorage.getItem('user') || 'null');

  const sortedUsers = useMemo(
    () =>
      [...users].sort((left, right) => {
        const sentDiff = Number(right.weeklySentTotal || 0) - Number(left.weeklySentTotal || 0);
        return sentDiff !== 0
          ? sentDiff
          : (left.name || left.username || '').localeCompare(right.name || right.username || '');
      }),
    [users]
  );

  const fetchUsers = async (searchTerm = query) => {
    setError('');
    setSuccess('');

    try {
      const response = await axios.get(
        `${API_BASE}/users/search?q=${encodeURIComponent(searchTerm)}`,
        getAuthConfig()
      );
      setUsers(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('profiles_load_failed'));
    }
  };

  const handleSearch = async () => {
    const searchTerm = query.trim();

    if (!searchTerm) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    fetchUsers(searchTerm);
  };

  const promoteUser = async () => {
    if (!promoteTarget) return;

    setError('');
    setSuccess('');
    setPromoting(true);

    try {
      await axios.post(
        `${API_BASE}/admin/promote`,
        { targetId: promoteTarget._id || promoteTarget.id },
        getAuthConfig()
      );
      setSuccess(t('user_now_admin', { name: promoteTarget.name || promoteTarget.username }));
      setPromoteTarget(null);
      fetchUsers(query);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('user_could_not_be_promoted'));
    } finally {
      setPromoting(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget._id || deleteTarget.id;
    setError('');
    setSuccess('');
    setDeletingUserId(String(targetId));

    try {
      await axios.delete(`${API_BASE}/admin/users/${targetId}`, getAuthConfig());
      setUsers((currentUsers) =>
        currentUsers.filter((user) => String(user._id || user.id) !== String(targetId))
      );
      setSuccess(t('user_deleted_successfully', { name: deleteTarget.name || deleteTarget.username }));
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('user_delete_failed'));
    } finally {
      setDeletingUserId('');
    }
  };

  const openViewModal = async (user) => {
    setViewTarget(user);
    setViewData(null);
    setViewError('');
    setSelectedRange('week');
    setViewLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE}/users/${user._id || user.id}/activity`,
        getAuthConfig()
      );
      setViewData(response.data);
    } catch (requestError) {
      setViewError(
        requestError.response?.data?.message || t('staff_activity_load_failed')
      );
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <>
      <div className="dashboard-stack">
        <section className="dashboard-hero compact-dashboard-hero">
          <div>
            <p className="dashboard-eyebrow">{t('directory')}</p>
            <h1>{t('team_profiles')}</h1>
          </div>

          <form
            className="search-card"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <input
              placeholder={t('search_staff')}
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);

                if (!nextQuery.trim()) {
                  setUsers([]);
                  setHasSearched(false);
                }
              }}
            />
            <button type="submit" className="main-btn search-btn">
              <FiSearch />
              <span>{t('search')}</span>
            </button>
          </form>
        </section>

        {success && <div className="feedback-panel success inline-feedback">{success}</div>}
        {error && <div className="feedback-panel error inline-feedback">{error}</div>}

        {!hasSearched ? (
          <section className="surface-card empty-state-card">
            <h3>{t('run_search_copy')}</h3>
          </section>
        ) : sortedUsers.length === 0 ? (
          <section className="surface-card empty-state-card">
            <h3>{t('no_profiles_yet')}</h3>
          </section>
        ) : (
          <div className="profile-grid polished-profile-grid">
            {sortedUsers.map((user) => (
              <ProfileCard
                key={user._id || user.id}
                user={user}
                canPromote={Boolean(me?.role === 'admin' && user.role !== 'admin')}
                canDelete={Boolean(me?.role === 'admin' && user.role !== 'admin')}
                deleting={deletingUserId === String(user._id || user.id)}
                onView={openViewModal}
                onPromote={setPromoteTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {promoteTarget && (
        <PromotionModal
          target={promoteTarget}
          promoting={promoting}
          onClose={() => setPromoteTarget(null)}
          onConfirm={promoteUser}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={t('delete_user')}
          copy={t('delete_user_copy')}
          meta={<span>{deleteTarget.name || deleteTarget.username}</span>}
          confirmLabel={t('delete')}
          busyLabel={t('deleting')}
          busy={deletingUserId === String(deleteTarget._id || deleteTarget.id)}
          confirmClassName="danger-btn modal-confirm-btn"
          ConfirmIcon={FiTrash2}
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteUser}
        />
      )}

      {viewTarget && (
        <StaffActivityModal
          target={viewTarget}
          viewData={viewData}
          viewLoading={viewLoading}
          viewError={viewError}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
          onClose={() => setViewTarget(null)}
        />
      )}
    </>
  );
}
