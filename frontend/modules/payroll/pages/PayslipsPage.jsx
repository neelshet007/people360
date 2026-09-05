import React, { useState, useEffect } from 'react';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import PayrunStatusBadge from '../components/PayrunStatusBadge';
import { formatCurrency } from '../../../lib/utils';
import payrollApi from '../api/payrollApi';

/**
 * Payslips Master Page
 * Owner: P3 (Payroll)
 * Foundation view for searching and browsing generated employee payslip statements
 */
export default function PayslipsPage() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    async function loadPayslips() {
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
    }
    loadPayslips();
  }, [pagination.page]);

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
      header: 'Department',
      accessor: 'department',
      render: (row) => <span>{row.department || '—'}</span>,
    },
    {
      header: 'Worked / Absent',
      accessor: 'days',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem' }}>
          {row.worked_days || 0}d worked / {row.absent_days || 0}d absent
        </span>
      ),
    },
    {
      header: 'Gross Salary',
      accessor: 'gross_amount',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(row.gross_amount || 0)}
        </span>
      ),
    },
    {
      header: 'Deductions',
      accessor: 'total_deductions',
      render: (row) => (
        <span style={{ color: 'var(--danger-600, #dc2626)' }}>
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
  ];

  return (
    <PageContainer
      title="Payslips"
      subtitle="Generated individual employee compensation statements and payment histories"
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
            title="No payslips generated"
            description="Employee payslips will appear here once periodic payrun batches have been computed."
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
    </PageContainer>
  );
}
