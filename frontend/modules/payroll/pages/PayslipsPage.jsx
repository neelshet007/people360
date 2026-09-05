import React, { useState, useEffect } from 'react';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import PayrunStatusBadge from '../components/PayrunStatusBadge';
import PayslipViewModal from '../components/PayslipViewModal';
import { formatCurrency } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';
import payrollApi from '../api/payrollApi';

/**
 * Payslips Master Page
 * Owner: P3 (Payroll)
 * Individual employee compensation statements and payment histories
 */
export default function PayslipsPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal State
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPayslips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollApi.getPayslips({ page: pagination.page, limit: pagination.limit });
      setPayslips(res.data || []);
      if (res.meta) {
        setPagination(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, [pagination.page]);

  const handleOpenPayslip = (id) => {
    setSelectedPayslipId(id);
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'Employee',
      accessor: 'employee_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>
            {row.employee_name || 'Staff Member'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>{row.employee_code}</div>
        </div>
      ),
    },
    {
      header: 'Department & Role',
      accessor: 'department',
      render: (row) => (
        <div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-800, #1e293b)' }}>{row.department || '—'}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>{row.designation}</div>
        </div>
      ),
    },
    {
      header: 'Worked / Absent',
      accessor: 'days',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem' }}>
          <strong>{row.worked_days || 0}d</strong> worked / {row.absent_days || 0}d absent
        </span>
      ),
    },
    {
      header: 'Gross Salary',
      accessor: 'gross_amount',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>
          {formatCurrency(row.gross_amount || 0)}
        </span>
      ),
    },
    {
      header: 'Deductions',
      accessor: 'total_deductions',
      render: (row) => (
        <span style={{ color: 'var(--danger-600, #dc2626)', fontWeight: 600 }}>
          -{formatCurrency(row.total_deductions || 0)}
        </span>
      ),
    },
    {
      header: 'Net Disbursed',
      accessor: 'net_amount',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--success-700, #15803d)' }}>
          {formatCurrency(row.net_amount || 0)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <PayrunStatusBadge status={row.status} />,
    },
    {
      header: 'Statement',
      accessor: 'action',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => handleOpenPayslip(row.id)}>
          📄 View Payslip
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title={isEmployee ? 'My Payslips' : 'Payslips'}
      subtitle={
        isEmployee
          ? 'Personal compensation statements, statutory tax deductions, and verified net take-home salary'
          : 'Generated employee compensation statements and corporate payroll payment histories'
      }
    >
      {error && (
        <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      <Card noPadding>
        {loading ? (
          <Loading message="Loading employee payslips..." />
        ) : payslips.length === 0 ? (
          <EmptyState
            title="No payslips found"
            description={
              isEmployee
                ? "You don't have any generated payslips yet. They will appear here once payroll is processed."
                : 'Employee payslips will appear here once periodic payrun batches have been computed.'
            }
          />
        ) : (
          <>
            <Table columns={columns} data={payslips} />
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

      {/* Individual Payslip Modal */}
      {selectedPayslipId && isModalOpen && (
        <PayslipViewModal
          payslipId={selectedPayslipId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayslipId(null);
          }}
        />
      )}
    </PageContainer>
  );
}
