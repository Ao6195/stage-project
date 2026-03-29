import React from 'react';
import { Bar } from 'react-chartjs-2';
import { FiEye, FiUserPlus } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

export default function ProfileCard({ user, canPromote, onView, onPromote }) {
  const { t } = useLanguage();

  return (
    <article className="profile-card polished-profile-card">
      <div className="profile-card-top">
        <div className="p-avatar">{user.name?.[0] || user.username?.[0] || 'U'}</div>
        <div>
          <h3>{user.name || user.username}</h3>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="profile-meta-row">
        <span className={`badge ${user.role === 'admin' ? 'approved' : 'pending'}`}>
          {user.role}
        </span>
        <span className="profile-downloads">
          {t('sent_this_week', { count: user.weeklySentTotal || 0 })}
        </span>
      </div>

      <div className="chart-wrapper">
        <Bar
          data={{
            labels: user.weeklySentLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: t('sent_this_week_label'),
                data: user.weeklySent || [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#2563eb',
                borderRadius: 10,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, ticks: { stepSize: 1 } },
            },
          }}
        />
      </div>

      <div className="profile-card-actions">
        <button type="button" className="ghost-btn" onClick={() => onView(user)}>
          <FiEye />
          <span>{t('view_activity')}</span>
        </button>

        {canPromote && (
          <button type="button" onClick={() => onPromote(user)} className="main-btn profile-action-btn">
            <FiUserPlus />
            <span>{t('promote_to_admin')}</span>
          </button>
        )}
      </div>
    </article>
  );
}
