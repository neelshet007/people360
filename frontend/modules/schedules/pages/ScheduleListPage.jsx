import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/feedback/EmptyState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useSchedules } from '../hooks/useSchedules';
import { PlusIcon } from '../../../components/ui/Icons';

/**
 * Working Schedules List Page
 * Owner: P1 (Core HR)
 */
export default function ScheduleListPage() {
  const navigate = useNavigate();
  const { schedules, loading, error, refetch } = useSchedules();

  const columns = [
    {
      header: 'Schedule Policy Name',
      render: (row) => (
        <div>
          <Link
            to={`/schedules/${row.id}`}
            style={{ fontWeight: 600, color: 'var(--primary-700, #4338ca)' }}
          >
            {row.name || `Schedule #${row.id}`}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
            {row.timezone || 'UTC'}
          </div>
        </div>
      ),
    },
    {
      header: 'Hours / Day',
      accessor: 'standard_hours_per_day',
      render: (row) => `${row.standard_hours_per_day || 8.0} hrs`,
    },
    {
      header: 'Days / Week',
      accessor: 'standard_days_per_week',
      render: (row) => `${row.standard_days_per_week || 5} days`,
    },
    {
      header: 'Total Weekly Hours',
      render: (row) => {
        const total = (row.standard_hours_per_day || 8) * (row.standard_days_per_week || 5);
        return <span style={{ fontWeight: 600 }}>{total} hrs</span>;
      },
    },
    {
      header: 'Break Duration',
      render: (row) => `${row.break_duration_minutes || 60} mins`,
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.is_active !== false ? 'success' : 'neutral'} dot>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/schedules/${row.id}`);
            }}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/schedules/${row.id}/edit`);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Working Schedules"
      subtitle="Standard shift configurations, daily working hours, and weekly rest days"
      actions={
        <Button
          variant="primary"
          icon={<PlusIcon size={16} />}
          onClick={() => navigate('/schedules/new')}
        >
          New Schedule
        </Button>
      }
    >
      {error ? (
        <ErrorState
          title="Failed to load working schedules"
          message={error}
          onRetry={refetch}
        />
      ) : schedules.length === 0 && !loading ? (
        <EmptyState
          title="No working schedules configured"
          description="Working schedules define shift duration and weekly work calendars. Attendance tracking and payroll work hour evaluations depend on these definitions."
          action={
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={() => navigate('/schedules/new')}
            >
              Configure First Schedule
            </Button>
          }
        />
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table
            columns={columns}
            data={schedules}
            loading={loading}
            onRowClick={(row) => navigate(`/schedules/${row.id}`)}
          />
        </Card>
      )}
    </PageContainer>
  );
}
