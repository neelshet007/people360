import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import RaiseConcernModal from '../components/RaiseConcernModal';
import concernsApi from '../api/concernsApi';
import {
  MessageSquareIcon,
  ClockIcon,
  SearchIcon,
  PlusIcon,
  ChevronRightIcon,
  CalendarIcon,
} from '../../../components/ui/Icons';

export default function MyConcernsPage() {
  const navigate = useNavigate();
  const [concerns, setConcerns] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showRaiseModal, setShowRaiseModal] = useState(false);

  const fetchConcerns = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, metricsRes] = await Promise.all([
        concernsApi.getConcerns({
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          search: search || undefined,
        }),
        concernsApi.getMetrics(),
      ]);
      setConcerns(listRes.data?.concerns || []);
      setMetrics(metricsRes.data || null);
    } catch (err) {
      console.error('[MyConcernsPage] Error loading concerns:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search]);

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
        return <Badge variant="warning">Action Needed</Badge>;
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

  return (
    <PageContainer
      title="My Concerns"
      subtitle="Direct two-way case communication with HR Management & Payroll"
      actions={
        <Button
          variant="primary"
          onClick={() => setShowRaiseModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusIcon size={16} /> Raise a Concern
        </Button>
      }
    >
      {/* ── Metric Cards ── */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={kpiCardStyle}>
            <div style={kpiLabel}>Total Cases</div>
            <div style={kpiValue}>{metrics.total}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabel}>In Progress / Review</div>
            <div style={{ ...kpiValue, color: 'var(--primary-600, #4f46e5)' }}>
              {metrics.under_review + metrics.in_progress}
            </div>
          </div>
          <div style={{ ...kpiCardStyle, borderLeft: metrics.waiting_for_employee > 0 ? '3px solid #f59e0b' : undefined }}>
            <div style={kpiLabel}>Needs Your Reply</div>
            <div style={{ ...kpiValue, color: metrics.waiting_for_employee > 0 ? '#b45309' : 'var(--neutral-800)' }}>
              {metrics.waiting_for_employee}
            </div>
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
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Input
              placeholder="Search by code or subject..."
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
                { value: 'WAITING_FOR_EMPLOYEE', label: 'Action Needed' },
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
        </div>
      </Card>

      {/* ── Concerns List ── */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-500)' }}>Loading concerns...</div>
        </Card>
      ) : concerns.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-50, #eef2ff)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <MessageSquareIcon size={24} color="var(--primary-600, #4f46e5)" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--neutral-800)', margin: '0 0 4px 0' }}>
            No concerns found
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', margin: '0 0 16px 0', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
            {search || statusFilter || categoryFilter
              ? 'No records match your active search or filters.'
              : 'You do not have any active or previous concerns on record.'}
          </p>
          <Button variant="primary" onClick={() => setShowRaiseModal(true)}>
            + Raise Your First Concern
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {concerns.map((c) => (
            <Card
              key={c.id}
              hoverable
              onClick={() => navigate(`/concerns/${c.id}`)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: '16px 18px',
                borderLeft: c.status === 'WAITING_FOR_EMPLOYEE' ? '4px solid #f59e0b' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700, #4338ca)', backgroundColor: 'var(--primary-50, #eef2ff)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--primary-100, #e0e7ff)' }}>
                      {c.concern_code}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 500 }}>
                      {getCategoryLabel(c.category)}
                    </span>
                    <span style={{ color: 'var(--neutral-300)' }}>•</span>
                    {getPriorityBadge(c.priority)}
                  </div>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                    {c.subject}
                  </h4>

                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--neutral-600)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {c.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '6px' }}>{getStatusBadge(c.status)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <ClockIcon size={12} />
                      {new Date(c.updated_at || c.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </div>
                  </div>

                  <ChevronRightIcon size={18} color="var(--neutral-400)" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
