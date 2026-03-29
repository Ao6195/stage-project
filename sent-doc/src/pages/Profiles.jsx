import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { FiSearch } from 'react-icons/fi';
import ProfileCard from '../components/profiles/ProfileCard';
import PromotionModal from '../components/profiles/PromotionModal';
import StaffActivityModal from '../components/profiles/StaffActivityModal';
import { API_BASE, getAuthConfig } from '../lib/api';
import { useLanguage } from '../lib/i18n';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function Profiles() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promoting, setPromoting] = useState(false);
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

  useEffect(() => {
    fetchUsers('');
  }, []);

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
    fetchUsers(query);
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
            <p className="dashboard-copy">{t('staff_copy')}</p>
          </div>

          <div className="search-card">
            <input
              placeholder={t('search_staff')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" className="main-btn search-btn" onClick={handleSearch}>
              <FiSearch />
              <span>{t('search')}</span>
            </button>
          </div>
        </section>

        {success && <div className="feedback-panel success inline-feedback">{success}</div>}
        {error && <div className="feedback-panel error inline-feedback">{error}</div>}

        {sortedUsers.length === 0 ? (
          <section className="surface-card empty-state-card">
            <h3>{t('no_profiles_yet')}</h3>
            <p>{t('run_search_copy')}</p>
          </section>
        ) : (
          <div className="profile-grid polished-profile-grid">
            {sortedUsers.map((user) => (
              <ProfileCard
                key={user._id || user.id}
                user={user}
                canPromote={Boolean(me?.role === 'admin' && user.role !== 'admin')}
                onView={openViewModal}
                onPromote={setPromoteTarget}
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
