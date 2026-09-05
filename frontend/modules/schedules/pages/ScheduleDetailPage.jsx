import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/feedback/Loading';
import ErrorState from '../../../components/feedback/ErrorState';
import { useSchedule } from '../hooks/useSchedule';

/**
 * Working Schedule Detail Page
 * Owner: P1 (Core HR)
 */
export default function ScheduleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { schedule, loading, error, refetch } = useSchedule(id);

  if (loading) {
    return (
      <PageContainer title="Schedule Details">
        <Loading message="Loading schedule policy..." />
      </PageContainer>
    );
  }

  if (error || !schedule) {
    return (
      <PageContainer title="Schedule Details">
        <ErrorState
          title="Schedule Not Found"
          message={error || `Could not find schedule #${id}.`}
          onRetry={refetch}
        />
        <div style={{ marginTop: '16px' }}>
          <Button variant="secondary" onClick={() => navigate('/schedules')}>
            Back to Schedules
          </Button>
        </div>
      </PageContainer>
    );
  }

  const name = schedule.name || `Schedule #${schedule.id}`;
  const hoursPerDay = Number(schedule.standard_hours_per_day || 8.0);
  const daysPerWeek = Number(schedule.standard_days_per_week || 5);
  const breakMinutes = Number(schedule.break_duration_minutes || 60);
  const weeklyHours = Number(schedule.total_weekly_hours || hoursPerDay * daysPerWeek);

  const daysList =
    Array.isArray(schedule.days_config) && schedule.days_config.length > 0
      ? schedule.days_config
      : [
          { day: 'Monday', is_working: daysPerWeek >= 1, start_time: '09:00', end_time: '18:00', break_duration_minutes: breakMinutes, daily_hours: hoursPerDay },
          { day: 'Tuesday', is_working: daysPerWeek >= 2, start_time: '09:00', end_time: '18:00', break_duration_minutes: breakMinutes, daily_hours: hoursPerDay },
          { day: 'Wednesday', is_working: daysPerWeek >= 3, start_time: '09:00', end_time: '18:00', break_duration_minutes: breakMinutes, daily_hours: hoursPerDay },
          { day: 'Thursday', is_working: daysPerWeek >= 4, start_time: '09:00', end_time: '18:00', break_duration_minutes: breakMinutes, daily_hours: hoursPerDay },
          { day: 'Friday', is_working: daysPerWeek >= 5, start_time: '09:00', end_time: '18:00', break_duration_minutes: breakMinutes, daily_hours: hoursPerDay },
          { day: 'Saturday', is_working: daysPerWeek >= 6, start_time: '09:00', end_time: '13:00', break_duration_minutes: 0, daily_hours: daysPerWeek >= 6 ? 4 : 0 },
          { day: 'Sunday', is_working: daysPerWeek >= 7, start_time: '', end_time: '', break_duration_minutes: 0, daily_hours: 0 },
        ];

  return (
    <PageContainer
      breadcrumbs={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/schedules" style={{ color: 'var(--primary-600, #4f46e5)' }}>
            Working Schedules
          </Link>
          <span>/</span>
          <span>{name}</span>
        </div>
      }
      title={name}
      subtitle="Working calendar policy for shifts, break durations, and automated weekly hours"
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => navigate('/schedules')}>
            Back
          </Button>
          <Button
            variant="primary"
            icon="✏️"
            onClick={() => navigate(`/schedules/${id}/edit`)}
          >
            Edit Schedule
          </Button>
        </div>
      }
    >
      {/* Overview Stat Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{name}</h2>
              <Badge variant={schedule.is_active !== false ? 'success' : 'neutral'} dot>
                {schedule.is_active !== false ? 'Active Policy' : 'Inactive Policy'}
              </Badge>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px', margin: 0 }}>
              Timezone: {schedule.timezone || 'UTC'} • System Policy ID: {schedule.id}
            </p>
          </div>

          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--primary-50, #eef2ff)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--primary-100, #e0e7ff)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-700, #4338ca)', display: 'block', fontWeight: 600 }}>
              Calculated Weekly Working Hours
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neutral-900, #0f172a)' }}>
              {weeklyHours.toFixed(2)} hrs / wk
            </span>
          </div>
        </div>
      </Card>

      {/* Grid: Policy Parameters + Shift Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <Card title="Policy Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Standard Working Days / Week</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{daysPerWeek} days</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Average Hours / Day</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{hoursPerDay.toFixed(2)} hours</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Default Lunch / Break Allocation</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{breakMinutes} minutes</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Applicable Timezone</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{schedule.timezone || 'UTC'}</div>
            </div>
          </div>
        </Card>

        <Card title="Weekly Working Calendar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {daysList.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: item.is_working ? 'var(--neutral-50, #f8fafc)' : '#ffffff',
                  border: '1px solid var(--neutral-200, #e2e8f0)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{item.day}</span>
                  {item.is_working && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', marginLeft: '8px' }}>
                      ({item.start_time} — {item.end_time}, {item.break_duration_minutes || 0}m break)
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: item.is_working ? 600 : 400,
                    color: item.is_working ? 'var(--primary-700, #4338ca)' : 'var(--neutral-400, #94a3b8)',
                    fontStyle: item.is_working ? 'normal' : 'italic',
                  }}
                >
                  {item.is_working ? `${item.daily_hours !== undefined ? item.daily_hours : (hoursPerDay)} hrs` : 'Rest Day'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
