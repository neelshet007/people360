import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import PayrunStatusBadge from '../components/PayrunStatusBadge';
import PayrunWizardModal from '../components/PayrunWizardModal';
import { formatCurrency } from '../../../lib/utils';
import payrollApi from '../api/payrollApi';

/**
 * Payruns List Page
 * Owner: P3 (Payroll)
 * Foundation view for managing periodic batch payroll executions
 */
export default function PayrunListPage() {
  const navigate = useNavigate();

  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Create Payrun Wizard Modal State
  const [showWizard, setShowWizard] = useState(false);

  const fetchPayruns = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;

      const response = await payrollApi.getPayruns(params);
      setPayruns(response.data || []);
      if (response.meta) {
        setPagination(response.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payrun batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, [pagination.page, statusFilter]);

  const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'COMPUTED', label: 'Computed' },
    { value: 'VALIDATED', label: 'Validated' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PAID', label: 'Paid' },
  ];

  const columns = [
    {
      header: 'Payrun Name & Batch',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link
              to={row.payrun_type === 'BONUS' ? '/payroll/bonus' : `/payroll/payruns/${row.id}`}
              style={{ fontWeight: 600, color: 'var(--primary-600, #4f46e5)', textDecoration: 'none' }}
            >
              {row.name}
            </Link>
            {row.payrun_type === 'BONUS' && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                BONUS
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>ID: {row.id.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      header: 'Pay Period',
      accessor: 'period',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-700, #334155)' }}>
          {row.pay_period_start ? row.pay_period_start.split('T')[0] : '—'} →{' '}
          {row.pay_period_end ? row.pay_period_end.split('T')[0] : '—'}
        </span>
      ),
    },
    {
      header: 'Salary Structure',
      accessor: 'structure',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-800, #1e293b)', fontWeight: 500 }}>
          {row.salary_structure_name ? `${row.salary_structure_name}` : 'Standard Corporate'}
        </span>
      ),
    },
    {
      header: 'Staff Count',
      accessor: 'employee_count',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-700, #334155)' }}>
          {row.employee_count || (row.total_gross > 0 ? 'Active' : 0)} employees
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <PayrunStatusBadge status={row.status} />,
    },
    {
      header: 'Gross Amount',
      accessor: 'total_gross',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>
          {formatCurrency(row.total_gross || 0)}
        </span>
      ),
    },
    {
      header: 'Net Disbursed',
      accessor: 'total_net',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--success-700, #15803d)' }}>
          {formatCurrency(row.total_net || 0)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => navigate(`/payroll/payruns/${row.id}`)}>
          Open Payrun
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Payruns"
      subtitle="Periodic compensation execution batches & Indian gross-to-net processing"
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={() => navigate('/payroll/bonus')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            🎁 Allocate Bonus
          </Button>
          <Button variant="primary" onClick={() => setShowWizard(true)}>
            + Initialize Payrun
          </Button>
        </div>
      }
    >
      {error && (
        <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '220px' }}>
            <Select
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filter by Status"
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)' }}>
            Total Batches: <strong>{pagination.total}</strong>
          </div>
        </div>
      </Card>

      {/* Payruns Table */}
      <Card noPadding>
        {loading ? (
          <Loading message="Loading payrun batches..." />
        ) : payruns.length === 0 ? (
          <EmptyState
            title="No payrun batches found"
            description="Initialize a new payrun batch to begin processing periodic payroll."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowWizard(true)}>
                + Initialize Payrun
              </Button>
            }
          />
        ) : (
          <>
            <Table columns={columns} data={payruns} />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </Card>

      {/* Payrun Wizard Modal */}
      {showWizard && (
        <PayrunWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onCreated={() => fetchPayruns()}
        />
      )}
    </PageContainer>
  );
}
