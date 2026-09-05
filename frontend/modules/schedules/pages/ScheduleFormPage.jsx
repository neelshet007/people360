import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import FormSection from '../../../components/forms/FormSection';
import FormActions from '../../../components/forms/FormActions';
import Alert from '../../../components/feedback/Alert';
import Loading from '../../../components/feedback/Loading';
import Card from '../../../components/ui/Card';
import schedulesApi from '../api/schedulesApi';
import { useSchedule } from '../hooks/useSchedule';

const defaultDays = [
  { day: 'Monday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Tuesday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Wednesday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Thursday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Friday', is_working: true, start_time: '09:00', end_time: '18:00', break_duration_minutes: 60 },
  { day: 'Saturday', is_working: false, start_time: '09:00', end_time: '18:00', break_duration_minutes: 0 },
  { day: 'Sunday', is_working: false, start_time: '09:00', end_time: '18:00', break_duration_minutes: 0 },
];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = String(timeStr).trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

/**
 * Working Schedule Form Page (Create / Edit)
 * Owner: P1 (Core HR)
 * Live automatic weekly-hour calculation
 */
export default function ScheduleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { schedule, loading: loadingInitial } = useSchedule(id);

  const [formData, setFormData] = useState({
    name: '',
    timezone: 'UTC',
    is_active: true,
    days_config: defaultDays,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isEditMode && schedule) {
      setFormData({
        name: schedule.name || '',
        timezone: schedule.timezone || 'UTC',
        is_active: schedule.is_active !== false,
        days_config:
          Array.isArray(schedule.days_config) && schedule.days_config.length === 7
            ? schedule.days_config
            : defaultDays,
      });
    }
  }, [isEditMode, schedule]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleDayChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedDays = [...prev.days_config];
      updatedDays[index] = { ...updatedDays[index], [field]: value };
      return { ...prev, days_config: updatedDays };
    });
  };

  // Automated Weekly Hours Calculation
  const calculateDailyHours = (dayObj) => {
    if (!dayObj.is_working) return 0;
    const startMin = parseTimeToMinutes(dayObj.start_time);
    const endMin = parseTimeToMinutes(dayObj.end_time);
    const breakMin = parseInt(dayObj.break_duration_minutes || 0, 10);

    if (startMin !== null && endMin !== null && endMin > startMin) {
      const netWorkingMin = Math.max(0, endMin - startMin - breakMin);
      return Math.round((netWorkingMin / 60) * 100) / 100;
    }
    return 0;
  };

  const totalWeeklyHours = formData.days_config
    .reduce((sum, day) => sum + calculateDailyHours(day), 0)
    .toFixed(2);

  const activeDaysCount = formData.days_config.filter((d) => d.is_working).length;
  const avgHoursPerDay =
    activeDaysCount > 0 ? (Number(totalWeeklyHours) / activeDaysCount).toFixed(2) : '0.00';

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Schedule policy name is required';

    formData.days_config.forEach((dayObj) => {
      if (dayObj.is_working) {
        const startMin = parseTimeToMinutes(dayObj.start_time);
        const endMin = parseTimeToMinutes(dayObj.end_time);
        if (startMin === null || endMin === null) {
          errs.days = `Please specify valid 24h start and end times for ${dayObj.day}`;
        } else if (startMin >= endMin) {
          errs.days = `Start time must be earlier than end time on ${dayObj.day}`;
        } else {
          const shiftDuration = endMin - startMin;
          const breakMin = parseInt(dayObj.break_duration_minutes || 0, 10);
          if (breakMin >= shiftDuration) {
            errs.days = `Break duration on ${dayObj.day} cannot exceed shift duration (${shiftDuration} mins)`;
          }
        }
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        timezone: formData.timezone,
        is_active: formData.is_active,
        days_config: formData.days_config,
      };

      if (isEditMode) {
        await schedulesApi.updateSchedule(id, payload);
        setSuccessMessage('Working schedule updated successfully!');
      } else {
        await schedulesApi.createSchedule(payload);
        setSuccessMessage('Working schedule created successfully!');
      }

      setTimeout(() => {
        navigate('/schedules');
      }, 800);
    } catch (err) {
      setApiError(err.message || 'Failed to save working schedule policy.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditMode && loadingInitial) {
    return (
      <PageContainer title="Edit Schedule">
        <Loading message="Loading schedule policy..." />
      </PageContainer>
    );
  }

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
    { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  ];

  return (
    <PageContainer
      breadcrumbs={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/schedules" style={{ color: 'var(--primary-600, #4f46e5)' }}>
            Working Schedules
          </Link>
          <span>/</span>
          <span>{isEditMode ? 'Edit Schedule' : 'New Schedule'}</span>
        </div>
      }
      title={isEditMode ? 'Edit Working Schedule' : 'Define Working Schedule Policy'}
      subtitle="Configure standard work calendars, shift lengths, and automated weekly hours"
    >
      {apiError && (
        <Alert type="danger" title="Submission Error">
          {apiError}
        </Alert>
      )}

      {errors.days && (
        <Alert type="danger" title="Schedule Timing Error">
          {errors.days}
        </Alert>
      )}

      {successMessage && (
        <Alert type="success" title="Success">
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FormSection
          title="Policy Identification"
          description="Basic schedule identity and operational timezone"
          columns={2}
        >
          <Input
            label="Schedule Name"
            id="name"
            required
            placeholder="e.g. Standard 40-Hour Work Week"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            helperText="Descriptive title used in employment contracts"
          />

          <Select
            label="Timezone"
            id="timezone"
            required
            options={timezoneOptions}
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
          />

          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '16px' }}>
            <Checkbox
              id="is_active"
              label="Active Schedule Policy"
              description="Available for assignment to employee contracts"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
            />
          </div>
        </FormSection>

        {/* Live Automatic Weekly Hours Summary Banner */}
        <Card
          style={{
            marginBottom: '24px',
            backgroundColor: 'var(--primary-50, #eef2ff)',
            borderColor: 'var(--primary-200, #c7d2fe)',
          }}
        >
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
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-700, #4338ca)', textTransform: 'uppercase' }}>
                Automated Calculation Engine (P1)
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900, #1e1b4b)', marginTop: '2px' }}>
                {totalWeeklyHours} <span style={{ fontSize: '1rem', fontWeight: 600 }}>hrs / week</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-600, #475569)' }}>Working Days</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--neutral-900, #0f172a)' }}>
                  {activeDaysCount} days
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-600, #475569)' }}>Avg Daily Shift</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--neutral-900, #0f172a)' }}>
                  {avgHoursPerDay} hrs
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Day-by-Day Shift Schedule Grid */}
        <Card
          title="Daily Shift Configuration"
          subtitle="Define working status, start/end shift hours, and lunch/break minutes for each day of the week"
          style={{ marginBottom: '24px' }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--neutral-200, #e2e8f0)', color: 'var(--neutral-600, #475569)' }}>
                  <th style={{ padding: '12px 8px', width: '120px' }}>Day</th>
                  <th style={{ padding: '12px 8px', width: '130px' }}>Working?</th>
                  <th style={{ padding: '12px 8px' }}>Start Time</th>
                  <th style={{ padding: '12px 8px' }}>End Time</th>
                  <th style={{ padding: '12px 8px' }}>Break Duration</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Daily Net Hours</th>
                </tr>
              </thead>
              <tbody>
                {formData.days_config.map((dayItem, idx) => {
                  const dailyH = calculateDailyHours(dayItem);
                  return (
                    <tr
                      key={dayItem.day}
                      style={{
                        borderBottom: '1px solid var(--neutral-100, #f1f5f9)',
                        backgroundColor: dayItem.is_working ? 'transparent' : 'var(--neutral-50, #f8fafc)',
                      }}
                    >
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{dayItem.day}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <Checkbox
                          id={`working_${idx}`}
                          label={dayItem.is_working ? 'Working' : 'Off'}
                          checked={dayItem.is_working}
                          onChange={(e) => handleDayChange(idx, 'is_working', e.target.checked)}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input
                          type="time"
                          disabled={!dayItem.is_working}
                          value={dayItem.start_time || ''}
                          onChange={(e) => handleDayChange(idx, 'start_time', e.target.value)}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid var(--neutral-300, #cbd5e1)',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            opacity: dayItem.is_working ? 1 : 0.5,
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input
                          type="time"
                          disabled={!dayItem.is_working}
                          value={dayItem.end_time || ''}
                          onChange={(e) => handleDayChange(idx, 'end_time', e.target.value)}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid var(--neutral-300, #cbd5e1)',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            opacity: dayItem.is_working ? 1 : 0.5,
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            disabled={!dayItem.is_working}
                            value={dayItem.break_duration_minutes ?? 60}
                            onChange={(e) => handleDayChange(idx, 'break_duration_minutes', e.target.value)}
                            style={{
                              width: '70px',
                              padding: '6px 10px',
                              border: '1px solid var(--neutral-300, #cbd5e1)',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              opacity: dayItem.is_working ? 1 : 0.5,
                            }}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>mins</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: dayItem.is_working ? 'var(--neutral-900, #0f172a)' : 'var(--neutral-400, #94a3b8)' }}>
                        {dailyH.toFixed(2)} h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <FormActions
          onCancel={() => navigate('/schedules')}
          submitLabel={isEditMode ? 'Update Schedule' : 'Save Schedule'}
          loading={submitting}
        />
      </form>
    </PageContainer>
  );
}
