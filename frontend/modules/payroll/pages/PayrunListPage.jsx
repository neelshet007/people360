import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import PayrunStatusBadge from '../components/PayrunStatusBadge';
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

  // Create Payrun Modal State
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [newPayrun, setNewPayrun] = useState({
    name: '',
    pay_period_start: '',
    pay_period_end: '',
  });

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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newPayrun.name.trim() || !newPayrun.pay_period_start || !newPayrun.pay_period_end) {
      setModalError('Please fill in all required fields');
      return;
    }
    setCreating(true);
    setModalError(null);
    try {
      await payrollApi.createPayrun(newPayrun);
      setShowModal(false);
      setNewPayrun({ name: '', pay_period_start: '', pay_period_end: '' });
      fetchPayruns();
    } catch (err) {
      setModalError(err.message || 'Failed to initialize payrun batch');
    } finally {
      setCreating(false);
    }
  };

  const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'COMPUTING', label: 'Computing' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PAID', label: 'Paid' },
  ];

  const columns = [
    {
      header: 'Payrun Name & Batch',
      accessor: 'name',
      render: (row) => (
        <div>
          <Link
            to={`/payroll/payruns/${row.id}`}
            style={{ fontWeight: 600, color: 'var(--primary-600, #4f46e5)', textDecoration: 'none' }}
          >
            {row.name}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>ID: {row.id.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      header: 'Pay Period',
      accessor: 'period',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-700, #334155)' }}>
          {row.pay_period_start} → {row.pay_period_end}
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
          ${parseFloat(row.total_gross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Net Payout',
      accessor: 'total_net',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--success-700, #15803d)' }}>
          ${parseFloat(row.total_net || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => navigate(`/payroll/payruns/${row.id}`)}>
          View Batch
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Payruns"
      subtitle="Periodic compensation execution batches & gross-to-net processing"
      actions={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Initialize Payrun
        </Button>
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
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                Initialize Payrun
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

      {/* Initialize Payrun Modal */}
      {showModal && (
        <Modal
          title="Initialize Payrun Batch"
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={creating} onClick={handleCreateSubmit}>
                Create Draft Payrun
              </Button>
            </>
          }
        >
          {modalError && (
            <Alert type="danger" style={{ marginBottom: '16px' }}>
              {modalError}
            </Alert>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Payrun Batch Name"
              required
              placeholder="e.g. November 2026 Monthly Payrun"
              value={newPayrun.name}
              onChange={(e) => setNewPayrun((prev) => ({ ...prev, name: e.target.value }))}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Period Start Date"
                type="date"
                required
                value={newPayrun.pay_period_start}
                onChange={(e) => setNewPayrun((prev) => ({ ...prev, pay_period_start: e.target.value }))}
              />
              <Input
                label="Period End Date"
                type="date"
                required
                value={newPayrun.pay_period_end}
                onChange={(e) => setNewPayrun((prev) => ({ ...prev, pay_period_end: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
