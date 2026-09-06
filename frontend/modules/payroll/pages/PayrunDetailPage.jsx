import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import PayrunStatusBadge from '../components/PayrunStatusBadge';
import PayslipViewModal from '../components/PayslipViewModal';
import { formatCurrency } from '../../../lib/utils';
import payrollApi from '../api/payrollApi';
import {
  SlidersIcon,
  RefreshIcon,
  CheckCircleIcon,
  MailIcon,
  CreditCardIcon,
  FileTextIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
} from '../../../components/ui/Icons';

/**
 * Payrun Detail Page
 * Owner: P3 (Payroll)
 * Comprehensive management view for payrun lifecycle, warnings, and itemized payslips
 */
export default function PayrunDetailPage() {
  const { id } = useParams();

  const [payrun, setPayrun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lifecycle Action State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Payslip Modal State
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDetails = async () => {
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
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCompute = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await payrollApi.computePayrun(id);
      setPayrun(res.data);
      setActionSuccess('Payroll successfully computed using statutory Indian calculation engine.');
      fetchDetails();
    } catch (err) {
      setActionError(err.message || 'Failed to compute payrun');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await payrollApi.validatePayrun(id);
      setPayrun(res.data);
      setActionSuccess('Payrun batch validated successfully. Ready for final payment sign-off.');
      fetchDetails();
    } catch (err) {
      setActionError(err.message || 'Validation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!window.confirm('Confirm marking this entire payrun batch and all generated payslips as PAID?')) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await payrollApi.markPayrunPaid(id);
      setPayrun(res.data);
      setActionSuccess('Payrun batch successfully marked as PAID. Payout recorded in system.');
      fetchDetails();
    } catch (err) {
      setActionError(err.message || 'Failed to mark payrun as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmailPayslips = async () => {
    if (!window.confirm('Send payslip statements via email to all employees in this batch?')) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await payrollApi.emailPayrunPayslips(id);
      setActionSuccess(`Bulk Email Dispatch: ${res.data?.message || 'Payslip emails sent successfully!'}`);
    } catch (err) {
      setActionError(err.message || 'Failed to send payslip emails');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPayslip = (payslipId) => {
    setSelectedPayslipId(payslipId);
    setIsModalOpen(true);
  };

  if (loading && !payrun) {
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

  // Parse warnings & validation notes
  let warningsList = [];
  if (payrun.warnings) {
    try {
      warningsList = typeof payrun.warnings === 'string' ? JSON.parse(payrun.warnings) : payrun.warnings;
    } catch (e) {
      warningsList = [];
    }
  }

  let validationNotes = [];
  if (payrun.validation_notes) {
    try {
      validationNotes = typeof payrun.validation_notes === 'string' ? JSON.parse(payrun.validation_notes) : payrun.validation_notes;
    } catch (e) {
      validationNotes = [];
    }
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
      header: 'Worked / Absent Days',
      accessor: 'days',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem' }}>
          <strong>{row.worked_days || 0}d</strong> worked / {row.absent_days || 0}d absent
        </span>
      ),
    },
    {
      header: 'Gross Amount',
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
      header: 'Net Pay',
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
        <Button variant="secondary" size="sm" icon={<FileTextIcon size={14} />} onClick={() => handleOpenPayslip(row.id)}>
          View Payslip
        </Button>
      ),
    },
  ];

  const stepOrder = ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'];
  const currentStepKey = payrun.status === 'CONFIRMED' ? 'VALIDATED' : payrun.status;
  const currentIdx = stepOrder.indexOf(currentStepKey);

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
      subtitle={`Pay Period: ${payrun.pay_period_start ? payrun.pay_period_start.split('T')[0] : ''} → ${payrun.pay_period_end ? payrun.pay_period_end.split('T')[0] : ''} • Structure: ${payrun.salary_structure_name || 'Standard Corporate'}`}
      actions={
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <PayrunStatusBadge status={payrun.status} />

          {/* DRAFT STATE ACTION */}
          {payrun.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={handleCompute}
              icon={<SlidersIcon size={14} />}
            >
              Compute Payroll
            </Button>
          )}

          {/* COMPUTED STATE ACTIONS */}
          {payrun.status === 'COMPUTED' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={actionLoading}
                onClick={handleCompute}
                icon={<RefreshIcon size={14} />}
              >
                Recompute
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading}
                onClick={handleValidate}
                icon={<CheckCircleIcon size={14} />}
              >
                Validate Payrun
              </Button>
            </>
          )}

          {/* VALIDATED STATE ACTION */}
          {(payrun.status === 'VALIDATED' || payrun.status === 'CONFIRMED') && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={actionLoading}
                onClick={handleEmailPayslips}
                icon={<MailIcon size={14} />}
              >
                Email Payslips
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading}
                onClick={handleMarkPaid}
                icon={<CreditCardIcon size={14} />}
                style={{ backgroundColor: 'var(--success-600, #16a34a)' }}
              >
                Mark as Paid
              </Button>
            </>
          )}

          {/* PAID STATE BADGE & BULK EMAIL */}
          {payrun.status === 'PAID' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={actionLoading}
                onClick={handleEmailPayslips}
                icon={<MailIcon size={14} />}
              >
                Email Payslips
              </Button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--success-700, #15803d)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircleIcon size={14} /> Fully Paid on {payrun.execution_date ? new Date(payrun.execution_date).toLocaleDateString('en-IN') : 'Completed'}
              </span>
            </>
          )}

          <Link to="/payroll/payruns">
            <Button variant="secondary" size="sm">
              Back to Payruns
            </Button>
          </Link>
        </div>
      }
    >
      {/* Visual Workflow Lifecycle Progression */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 10px)',
          padding: '16px 20px',
        }}
      >
        {[
          { key: 'DRAFT', label: '1. Draft Scope', desc: 'Employee Contract Terms' },
          { key: 'COMPUTED', label: '2. Calculation Engine', desc: 'Rules & Attendance Evaluated' },
          { key: 'VALIDATED', label: '3. Audit Verification', desc: 'Managerial Sign-Off' },
          { key: 'PAID', label: '4. Disbursement', desc: 'Direct Deposit & Statements' },
        ].map((step, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx;

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  backgroundColor: isDone
                    ? 'var(--success-600, #16a34a)'
                    : isCurrent
                    ? 'var(--primary-600, #2563eb)'
                    : 'var(--neutral-100, #f1f5f9)',
                  color: isDone || isCurrent ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  flexShrink: 0,
                  boxShadow: isCurrent ? '0 0 0 3px var(--primary-100, #dbeafe)' : 'none',
                }}
              >
                {isDone ? <CheckCircleIcon size={16} /> : idx + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: isCurrent || isDone ? 700 : 500,
                    color: isCurrent || isDone ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #94a3b8)',
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: isCurrent ? 'var(--primary-700, #1d4ed8)' : 'var(--text-muted, #94a3b8)',
                  }}
                >
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Error / Success Feedback */}
      {actionError && (
        <Alert type="danger" title="Workflow Error" style={{ marginBottom: '16px' }}>
          {actionError}
        </Alert>
      )}

      {actionSuccess && (
        <Alert type="success" title="Success" style={{ marginBottom: '16px' }}>
          {actionSuccess}
        </Alert>
      )}

      {/* Financial Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase' }}>
            Employees Included
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--neutral-900, #0f172a)', marginTop: '4px' }}>
            {payrun.employee_count || (payrun.payslips ? payrun.payslips.length : 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
            Active Employment Contracts
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase' }}>
            Total Gross Compensation
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--neutral-900, #0f172a)', marginTop: '4px' }}>
            {formatCurrency(payrun.total_gross || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
            Basic + Allowances
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase' }}>
            Total Deductions & Tax
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger-600, #dc2626)', marginTop: '4px' }}>
            -{formatCurrency(payrun.total_deductions || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
            PF + PT + Insurance
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase' }}>
            Total Net Disbursed
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-700, #15803d)', marginTop: '4px' }}>
            {formatCurrency(payrun.total_net || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
            Total Net Payout in INR
          </div>
        </Card>
      </div>

      {/* Warnings & Validation Notes Panel */}
      {(warningsList.length > 0 || (validationNotes.length > 0 && payrun.status !== 'PAID')) && (
        <Card title="Validation & Payroll Audit Warnings" subtitle="System automated verification observations" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {warningsList.map((w, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  backgroundColor: w.type === 'ERROR' ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${w.type === 'ERROR' ? '#fecaca' : '#fde68a'}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: w.type === 'ERROR' ? '#991b1b' : '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                  {w.type === 'ERROR' ? <AlertTriangleIcon size={16} color="var(--danger-600, #dc2626)" /> : <AlertTriangleIcon size={16} color="var(--warning-600, #d97706)" />}
                </span>
                <span>
                  <strong>{w.employee_name ? `${w.employee_name}: ` : ''}</strong>
                  {w.message}
                </span>
              </div>
            ))}

            {validationNotes.filter((n) => n.status === 'PASSED').map((n, idx) => (
              <div
                key={`val-${idx}`}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                  <CheckCircleIcon size={16} color="var(--success-600, #16a34a)" />
                </span>
                <span>{n.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

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
            action={
              payrun.status === 'DRAFT' && (
                <Button variant="primary" size="sm" onClick={handleCompute} loading={actionLoading}>
                  Compute Payroll Now
                </Button>
              )
            }
          />
        ) : (
          <Table columns={payslipColumns} data={payrun.payslips} />
        )}
      </Card>

      {/* Individual Payslip View Modal */}
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
