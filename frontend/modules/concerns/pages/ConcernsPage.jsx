import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import Table from '../../../components/ui/Table';
import Avatar from '../../../components/ui/Avatar';
import RaiseConcernModal from '../components/RaiseConcernModal';
import concernsApi from '../api/concernsApi';
import {
  MessageSquareIcon,
  SearchIcon,
  PlusIcon,
  FilterIcon,
  ClockIcon,
} from '../../../components/ui/Icons';

export default function ConcernsPage() {
  const navigate = useNavigate();
  const [concerns, setConcerns] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showRaiseModal, setShowRaiseModal] = useState(false);

  const fetchConcerns = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, metricsRes] = await Promise.all([
        concernsApi.getConcerns({
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
          search: search || undefined,
        }),
        concernsApi.getMetrics(),
      ]);
      setConcerns(listRes.data?.concerns || []);
      setMetrics(metricsRes.data || null);
    } catch (err) {
      console.error('[ConcernsPage] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, search]);

  useEffect(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="neutral">Open</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="primary">Under Review</Badge>;
      case 'WAITING_FOR_EMPLOYEE':
        return <Badge variant="warning">Waiting for Employee</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">In Progress</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">Closed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem' }}>● URGENT</span>;
      case 'HIGH':
        return <span style={{ color: '#f97316', fontWeight: 600, fontSize: '0.75rem' }}>● High</span>;
      case 'MEDIUM':
        return <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: '0.75rem' }}>● Medium</span>;
      default:
        return <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>● Low</span>;
    }
  };

  const getCategoryLabel = (cat) => {
    const map = {
      ATTENDANCE: 'Attendance',
      TIME_OFF: 'Time Off',
      PAYROLL: 'Payroll',
      CONTRACT: 'Contract',
      WORKPLACE: 'Workplace',
      POLICY: 'Policy',
      OTHER: 'General',
    };
    return map[cat] || cat;
  };

  const columns = [
    {
      header: 'Case ID & Subject',
      accessor: 'subject',
      render: (row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700)', backgroundColor: 'var(--primary-50)', padding: '1px 6px', borderRadius: '4px' }}>
              {row.concern_code}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
              {getCategoryLabel(row.category)}
            </span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900)', fontSize: '0.875rem' }}>
            {row.subject}
          </div>
        </div>
      ),
    },
    {
      header: 'Regarding Employee',
      accessor: 'subject_employee_code',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar name={`${row.subject_first_name} ${row.subject_last_name}`} size={28} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--neutral-900)' }}>
              {row.subject_first_name} {row.subject_last_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
              {row.subject_department}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => getPriorityBadge(row.priority),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Assigned To',
      accessor: 'assigned_to_name',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: row.assigned_to_name ? 'var(--neutral-800)' : 'var(--neutral-400)' }}>
          {row.assigned_to_name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Updated',
      accessor: 'updated_at',
      render: (row) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
          {new Date(row.updated_at || row.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      render: (row) => (
        <Button
          variant="secondary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/concerns/${row.id}`);
          }}
        >
          Open Case →
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Concern Communication"
      subtitle="HR case management, employee inquiries, and audit-logged communication"
      actions={
        <Button
          variant="primary"
          onClick={() => setShowRaiseModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusIcon size={16} /> Raise Concern
        </Button>
      }
    >
      {/* ── KPI Counter Cards ── */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={kpiCardStyle}>
            <div style={kpiLabel}>Total Concerns</div>
            <div style={kpiValue}>{metrics.total}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabel}>Open</div>
            <div style={{ ...kpiValue, color: 'var(--neutral-700)' }}>{metrics.open}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabel}>Under Review</div>
            <div style={{ ...kpiValue, color: 'var(--primary-600, #4f46e5)' }}>{metrics.under_review}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabel}>Waiting for Employee</div>
            <div style={{ ...kpiValue, color: '#d97706' }}>{metrics.waiting_for_employee}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabel}>Urgent / High</div>
            <div style={{ ...kpiValue, color: '#dc2626' }}>{metrics.urgent_high}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabel}>Resolved</div>
            <div style={{ ...kpiValue, color: 'var(--success-600, #16a34a)' }}>{metrics.resolved}</div>
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <Card style={{ marginBottom: '18px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Input
              placeholder="Search by code, subject, employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'OPEN', label: 'Open' },
                { value: 'UNDER_REVIEW', label: 'Under Review' },
                { value: 'WAITING_FOR_EMPLOYEE', label: 'Waiting for Employee' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                { value: 'ATTENDANCE', label: 'Attendance' },
                { value: 'TIME_OFF', label: 'Time Off' },
                { value: 'PAYROLL', label: 'Payroll' },
                { value: 'CONTRACT', label: 'Contract' },
                { value: 'WORKPLACE', label: 'Workplace' },
                { value: 'POLICY', label: 'Policy' },
                { value: 'OTHER', label: 'General' },
              ]}
            />
          </div>

          <div style={{ width: '140px' }}>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* ── Table Card ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          columns={columns}
          data={concerns}
          loading={loading}
          emptyText="No concerns match your active filter criteria."
          onRowClick={(row) => navigate(`/concerns/${row.id}`)}
        />
      </Card>

      {/* ── Raise Concern Modal ── */}
      <RaiseConcernModal
        isOpen={showRaiseModal}
        onClose={() => setShowRaiseModal(false)}
        onSuccess={() => fetchConcerns()}
      />
    </PageContainer>
  );
}

const kpiCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '14px 16px',
  border: '1px solid var(--neutral-200, #e2e8f0)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
};

const kpiLabel = {
  fontSize: '0.75rem',
  color: 'var(--neutral-500)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '4px',
};

const kpiValue = {
  fontSize: '1.4rem',
  fontWeight: 800,
  color: 'var(--neutral-900)',
};
