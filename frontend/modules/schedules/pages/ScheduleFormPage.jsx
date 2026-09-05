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
import schedulesApi from '../api/schedulesApi';
import { useSchedule } from '../hooks/useSchedule';

/**
 * Working Schedule Form Page (Create / Edit)
 * Owner: P1 (Core HR)
 */
export default function ScheduleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { schedule, loading: loadingInitial } = useSchedule(id);

  const [formData, setFormData] = useState({
    name: '',
    standard_hours_per_day: '8',
    standard_days_per_week: '5',
    break_duration_minutes: '60',
    timezone: 'UTC',
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isEditMode && schedule) {
      setFormData({
        name: schedule.name || '',
        standard_hours_per_day: String(schedule.standard_hours_per_day || '8'),
        standard_days_per_week: String(schedule.standard_days_per_week || '5'),
        break_duration_minutes: String(schedule.break_duration_minutes || '60'),
        timezone: schedule.timezone || 'UTC',
        is_active: schedule.is_active !== false,
      });
    }
  }, [isEditMode, schedule]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Schedule policy name is required';

    const hours = Number(formData.standard_hours_per_day);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      errs.standard_hours_per_day = 'Hours per day must be between 1 and 24';
    }

    const days = Number(formData.standard_days_per_week);
    if (isNaN(days) || days <= 0 || days > 7) {
      errs.standard_days_per_week = 'Days per week must be between 1 and 7';
    }

    const breaks = Number(formData.break_duration_minutes);
    if (isNaN(breaks) || breaks < 0) {
      errs.break_duration_minutes = 'Break minutes must be non-negative';
    }

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
        standard_hours_per_day: Number(formData.standard_hours_per_day),
        standard_days_per_week: Number(formData.standard_days_per_week),
        break_duration_minutes: Number(formData.break_duration_minutes),
        timezone: formData.timezone,
        is_active: formData.is_active,
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
      subtitle="Configure standard work calendars, shift lengths, and break periods"
    >
      {apiError && (
        <Alert type="danger" title="Submission Error">
          {apiError}
        </Alert>
      )}

      {successMessage && (
        <Alert type="success" title="Success">
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FormSection
          title="Policy Identification & Schedule Hours"
          description="Basic schedule rules applied across employees"
          columns={2}
        >
          <Input
            label="Schedule Name"
            id="name"
            required
            placeholder="e.g. Standard Full-Time (40h/week)"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            helperText="Descriptive title for employee contract binding"
          />

          <Select
            label="Timezone"
            id="timezone"
            required
            options={timezoneOptions}
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
          />

          <Input
            label="Standard Working Hours / Day"
            id="standard_hours_per_day"
            type="number"
            required
            step="0.5"
            placeholder="8"
            value={formData.standard_hours_per_day}
            onChange={(e) => handleChange('standard_hours_per_day', e.target.value)}
            error={errors.standard_hours_per_day}
            helperText="Expected daily shift duration (excluding breaks)"
          />

          <Input
            label="Standard Working Days / Week"
            id="standard_days_per_week"
            type="number"
            required
            placeholder="5"
            value={formData.standard_days_per_week}
            onChange={(e) => handleChange('standard_days_per_week', e.target.value)}
            error={errors.standard_days_per_week}
            helperText="Typically 5 days (Monday through Friday)"
          />

          <Input
            label="Daily Break Duration (Minutes)"
            id="break_duration_minutes"
            type="number"
            required
            placeholder="60"
            value={formData.break_duration_minutes}
            onChange={(e) => handleChange('break_duration_minutes', e.target.value)}
            error={errors.break_duration_minutes}
            helperText="Standard lunch or pause allocation"
          />

          <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '16px' }}>
            <Checkbox
              id="is_active"
              label="Active Schedule Policy"
              description="Available for new contract assignments"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
            />
          </div>
        </FormSection>

        <FormActions
          onCancel={() => navigate('/schedules')}
          submitLabel={isEditMode ? 'Update Schedule' : 'Save Schedule'}
          loading={submitting}
        />
      </form>
    </PageContainer>
  );
}
