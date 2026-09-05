import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import PayrunStatusBadge from '../components/PayrunStatusBadge';
import payrollApi from '../api/payrollApi';

/**
 * Payrun Detail Page
 * Owner: P3 (Payroll)
 * Foundation view for a single payrun batch and its itemized payslips
 */
export default function PayrunDetailPage() {
  const { id } = useParams();

  const [payrun, setPayrun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await payrollApi.getPayrunById(id);
        setPayrun(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load payrun batch details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <PageContainer title="Payrun Details">
        <Loading message="Loading payrun batch..." />
      </PageContainer>
    );
  }

  if (error || !payrun) {
    return (
      <PageContainer title="Payrun Details">
        <Alert type="danger" title="Error">
          {error || 'Payrun batch not found'}
        </Alert>
        <div style={{ marginTop: '16px' }}>
          <Link to="/payroll/payruns" style={{ color: 'var(--primary-600, #4f46e5)' }}>
            ← Back to Payruns
          </Link>
        </div>
      </PageContainer>
    );
  }

  const payslipColumns = [
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
      header: 'Worked / Absent Days',
      accessor: 'days',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem' }}>
          {row.worked_days || 0} worked / {row.absent_days || 0} absent
        </span>
      ),
    },
    {
      header: 'Gross Amount',
      accessor: 'gross_amount',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          ${parseFloat(row.gross_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Deductions',
      accessor: 'total_deductions',
      render: (row) => (
        <span style={{ color: 'var(--danger-600, #dc2626)' }}>
          -${parseFloat(row.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Net Pay',
      accessor: 'net_amount',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--success-700, #15803d)' }}>
          ${parseFloat(row.net_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
      breadcrumbs={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/payroll/payruns" style={{ color: 'var(--primary-600, #4f46e5)' }}>
            Payruns
          </Link>
          <span>/</span>
          <span>{payrun.name}</span>
        </div>
      }
      title={payrun.name}
      subtitle={`Pay Period: ${payrun.pay_period_start} → ${payrun.pay_period_end}`}
      actions={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <PayrunStatusBadge status={payrun.status} />
          <Link to="/payroll/payruns">
            <Button variant="secondary" size="sm">
              Back to Payruns
            </Button>
          </Link>
        </div>
      }
    >
      {/* Financial Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase' }}>
            Total Gross Compensation
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-900, #0f172a)', marginTop: '4px' }}>
            ${parseFloat(payrun.total_gross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase' }}>
            Total Deductions & Tax
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger-600, #dc2626)', marginTop: '4px' }}>
            ${parseFloat(payrun.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase' }}>
            Total Net Disbursed
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-700, #15803d)', marginTop: '4px' }}>
            ${parseFloat(payrun.total_net || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>
      </div>

      {/* Batch Payslips Table */}
      <Card
        title="Batch Employee Payslips"
        subtitle="Individual payslips generated and verified for this payroll cycle"
        noPadding
      >
        {(!payrun.payslips || payrun.payslips.length === 0) ? (
          <EmptyState
            title="No payslips generated in this batch"
            description="When payroll calculations are executed for this payrun, individual employee payslips will appear here."
          />
        ) : (
          <Table columns={payslipColumns} data={payrun.payslips} />
        )}
      </Card>
    </PageContainer>
  );
}
