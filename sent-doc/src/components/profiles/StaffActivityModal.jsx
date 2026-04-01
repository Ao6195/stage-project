import React from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { FiActivity, FiBarChart2, FiPieChart, FiTrendingUp, FiX } from 'react-icons/fi';
import { useLanguage } from '../../lib/i18n';

const RANGE_OPTIONS = ['week', 'twoWeeks', 'month'];

export default function StaffActivityModal({
  target,
  viewData,
  viewLoading,
  viewError,
  selectedRange,
  onRangeChange,
  onClose,
}) {
  const { t } = useLanguage();
  const activeRange = viewData?.activity?.[selectedRange] || { labels: [], data: [] };
  const shouldLoopDocuments = (viewData?.documents?.length || 0) >= 5;
  const scrollingDocuments = shouldLoopDocuments
    ? [...viewData.documents, ...viewData.documents]
    : viewData?.documents || [];
  const movingActivityLine = t('moving_activity_line');
  const sentOverTime = t('sent_over_time');
  const contributionMix = t('contribution_mix');

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-title"
      onClick={onClose}
    >
      <div className="modal-card staff-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="staff-modal-head">
          <div>
            <p className="dashboard-eyebrow">{t('staff_view')}</p>
            <h3 id="staff-title">{target.name || target.username}</h3>
            <p className="modal-copy">{target.email}</p>
          </div>
          <button type="button" className="staff-close-btn" onClick={onClose} aria-label={t('close')}>
            <FiX />
          </button>
        </div>

        {viewLoading ? (
          <div className="preview-empty staff-empty-state">
            <h3>{t('loading_activity')}</h3>
          </div>
        ) : viewError ? (
          <div className="feedback-panel error inline-feedback">{viewError}</div>
        ) : viewData ? (
          <div className="staff-modal-body">
            <div className="staff-stats-grid">
              <article className="dashboard-stat-card">
                <div className="stat-icon">
                  <FiActivity />
                </div>
                <span>{t('documents')}</span>
                <strong>{viewData.totals?.documents || 0}</strong>
              </article>
              <article className="dashboard-stat-card">
                <div className="stat-icon">
                  <FiTrendingUp />
                </div>
                <span>{t('total_score')}</span>
                <strong>{viewData.totals?.score || 0}</strong>
              </article>
              <article className="dashboard-stat-card">
                <div className="stat-icon">
                  <FiBarChart2 />
                </div>
                <span>{t('total_comments')}</span>
                <strong>{viewData.totals?.comments || 0}</strong>
              </article>
            </div>

            <section className="staff-section-block">
              <div className="staff-section-head">
                <div>
                  <p className="dashboard-eyebrow">{t('documents_sent_ever')}</p>
                  {movingActivityLine ? (
                    <h4 className="section-title-with-icon">
                      <FiActivity />
                      <span>{movingActivityLine}</span>
                    </h4>
                  ) : null}
                </div>
              </div>

              {viewData.documents?.length ? (
                <div className="staff-documents-marquee">
                  <div className={`staff-documents-track ${shouldLoopDocuments ? 'is-looping' : 'is-static'}`}>
                    {scrollingDocuments.map((document, index) => (
                      <Link
                        key={`${document._id || document.id}-${index}`}
                        to={`/documents/${document._id || document.id}`}
                        className="staff-document-chip"
                      >
                        <strong>{document.title}</strong>
                        <span>{document.department}</span>
                        <small>
                          {t('score')} {Number(document.score || 0) > 0 ? `+${document.score}` : document.score || 0}
                        </small>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="preview-empty staff-empty-state">
                  <h3>{t('no_documents_yet')}</h3>
                  <p>{t('no_documents_copy')}</p>
                </div>
              )}
            </section>

            <div className="staff-analytics-grid">
              <section className="surface-card staff-analytics-card">
                <div className="staff-section-head">
                <div>
                  <p className="dashboard-eyebrow">{t('contribution_volume')}</p>
                  {sentOverTime ? (
                    <h4 className="section-title-with-icon">
                      <FiBarChart2 />
                      <span>{sentOverTime}</span>
                    </h4>
                  ) : null}
                </div>
                <div className="staff-range-switcher">
                    {RANGE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`tab-btn ${selectedRange === option ? 'active' : ''}`}
                        onClick={() => onRangeChange(option)}
                      >
                        {t(option === 'week' ? 'this_week' : option === 'twoWeeks' ? 'two_weeks' : 'monthly')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="staff-chart-shell">
                  <Line
                    data={{
                      labels: activeRange.labels,
                      datasets: [
                        {
                          label: t('documents_sent'),
                          data: activeRange.data,
                          borderColor: '#2563eb',
                          backgroundColor: 'rgba(37, 99, 235, 0.14)',
                          pointBackgroundColor: '#2563eb',
                          pointBorderColor: '#ffffff',
                          pointRadius: 4,
                          pointHoverRadius: 5,
                          pointBorderWidth: 2,
                          borderWidth: 3,
                          tension: 0.34,
                          fill: true,
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
              </section>

              <section className="surface-card staff-analytics-card">
                <div className="staff-section-head">
                <div>
                  <p className="dashboard-eyebrow">{t('categories')}</p>
                  {contributionMix ? (
                    <h4 className="section-title-with-icon">
                      <FiPieChart />
                      <span>{contributionMix}</span>
                    </h4>
                  ) : null}
                </div>
                </div>

                <div className="staff-chart-shell">
                  <Pie
                    data={{
                      labels: viewData.contributions?.labels || ['Exploitation', 'Data', 'Security'],
                      datasets: [
                        {
                          data: viewData.contributions?.data || [0, 0, 0],
                          backgroundColor: ['#0f766e', '#2563eb', '#f59e0b'],
                          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
