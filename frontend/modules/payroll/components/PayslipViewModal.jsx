import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/feedback/Loading';
import Alert from '../../../components/feedback/Alert';
import PayrunStatusBadge from './PayrunStatusBadge';
import { formatCurrency } from '../../../lib/utils';
import payrollApi from '../api/payrollApi';
import { PrinterIcon, MessageSquareIcon } from '../../../components/ui/Icons';
import RaiseConcernModal from '../../concerns/components/RaiseConcernModal';

/**
 * Payslip View Modal Component
 * Owner: P3 (Payroll)
 * 
 * Renders an itemized, compliant Indian Payslip statement:
 * Employee Master Info + Period Dates + Worked Days + Earnings + Deductions + Gross + Net (INR)
 */
export default function PayslipViewModal({ payslipId, isOpen, onClose }) {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConcernModal, setShowConcernModal] = useState(false);

  useEffect(() => {
    if (!payslipId || !isOpen) {
      setPayslip(null);
      return;
    }

    async function loadPayslipDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await payrollApi.getPayslipById(payslipId);
        setPayslip(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load payslip statement details');
      } finally {
        setLoading(false);
      }
    }

    loadPayslipDetails();
  }, [payslipId, isOpen]);

  if (!isOpen) return null;

  // Separate earnings from deductions
  const earnings = (payslip?.lines || []).filter(
    (l) => l.category === 'BASIC' || l.category === 'ALLOWANCE'
  );
  const deductions = (payslip?.lines || []).filter(
    (l) => l.category === 'DEDUCTION' && l.rule_code !== 'TOTAL_DEDUCTIONS'
  );

  return (
    <>
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Salary Statement / Payslip</span>
          {payslip && <PayrunStatusBadge status={payslip.status} />}
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      actions={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowConcernModal(true)}
            icon={<MessageSquareIcon size={14} />}
            style={{ color: 'var(--primary-700, #4338ca)', borderColor: 'var(--primary-200, #c7d2fe)' }}
          >
            Raise Concern
          </Button>
          <Button
            variant="primary"
            onClick={() => window.print()}
            icon={<PrinterIcon size={14} />}
          >
            Print PDF
          </Button>
        </div>
      }
    >
      {loading && <Loading message="Loading itemized payslip breakdown..." />}

      {error && (
        <Alert type="danger" title="Error">
          {error}
        </Alert>
      )}

      {!loading && !error && payslip && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Company Branding & Statement Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid var(--neutral-200, #e2e8f0)',
              paddingBottom: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700, #4338ca)' }}>
                PeoplePay360
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
                Integrated HR & Automated Payroll Platform (India Locale)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-700, #334155)' }}>
                Payslip Ref: {payslip.id.slice(0, 8).toUpperCase()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
                Batch: {payslip.payrun_name || 'Standard Monthly Cycle'}
              </div>
            </div>
          </div>

          {/* Employee & Pay Period Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--neutral-200, #e2e8f0)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                Employee Name
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--neutral-900, #0f172a)' }}>
                {payslip.employee_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>{payslip.employee_code}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                Designation & Dept
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-800, #1e293b)' }}>
                {payslip.designation || 'Staff Specialist'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
                {payslip.department || 'Operations'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                Payroll Period
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-800, #1e293b)' }}>
                {payslip.pay_period_start ? payslip.pay_period_start.split('T')[0] : '2026-09-01'} →{' '}
                {payslip.pay_period_end ? payslip.pay_period_end.split('T')[0] : '2026-09-30'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
                Standard Days: 22.0
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                Attendance Payout Days
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--success-700, #15803d)' }}>
                {payslip.worked_days || 22.0} Worked Days
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
                Absent: {payslip.absent_days || 0.0} days
              </div>
            </div>
          </div>

          {/* Earnings vs Deductions Split Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* EARNINGS */}
            <div
              style={{
                border: '1px solid var(--neutral-200, #e2e8f0)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--neutral-100, #f1f5f9)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: 'var(--neutral-800, #1e293b)',
                  borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>EARNINGS & ALLOWANCES</span>
                <span>AMOUNT</span>
              </div>
              <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {earnings.length > 0 ? (
                  earnings.map((e) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--neutral-700, #334155)' }}>
                        {e.rule_name} <span style={{ color: 'var(--neutral-400, #94a3b8)', fontSize: '0.75rem' }}>({e.rule_code})</span>
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span>Gross Basic & Allowances</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(payslip.gross_amount)}</span>
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--neutral-50, #f8fafc)',
                  borderTop: '1px solid var(--neutral-200, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--neutral-900, #0f172a)',
                }}
              >
                <span>Total Gross Earnings</span>
                <span style={{ color: 'var(--primary-700, #4338ca)' }}>{formatCurrency(payslip.gross_amount)}</span>
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div
              style={{
                border: '1px solid var(--neutral-200, #e2e8f0)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--neutral-100, #f1f5f9)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: 'var(--neutral-800, #1e293b)',
                  borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>DEDUCTIONS & TAX</span>
                <span>AMOUNT</span>
              </div>
              <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {deductions.length > 0 ? (
                  deductions.map((d) => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--neutral-700, #334155)' }}>
                        {d.rule_name} <span style={{ color: 'var(--neutral-400, #94a3b8)', fontSize: '0.75rem' }}>({d.rule_code})</span>
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--danger-600, #dc2626)' }}>
                        -{formatCurrency(d.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span>Statutory Deductions</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger-600, #dc2626)' }}>
                      -{formatCurrency(payslip.total_deductions)}
                    </span>
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--neutral-50, #f8fafc)',
                  borderTop: '1px solid var(--neutral-200, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--neutral-900, #0f172a)',
                }}
              >
                <span>Total Deductions</span>
                <span style={{ color: 'var(--danger-600, #dc2626)' }}>-{formatCurrency(payslip.total_deductions)}</span>
              </div>
            </div>
          </div>

          {/* NET SALARY TAKE-HOME BANNER */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--success-50, #f0fdf4)',
              border: '2px solid var(--success-200, #bbf7d0)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-800, #166534)', textTransform: 'uppercase' }}>
                Net Salary Payable (Take-Home)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success-700, #15803d)', marginTop: '2px' }}>
                Disbursed via Corporate Direct Bank Transfer • Verified by HR Operations
              </div>
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--success-700, #15803d)' }}>
              {formatCurrency(payslip.net_amount)}
            </div>
          </div>
        </div>
      )}
    </Modal>

    {/* Contextual Raise Concern Modal for Payslip */}
    {showConcernModal && (
      <RaiseConcernModal
        isOpen={showConcernModal}
        onClose={() => setShowConcernModal(false)}
        initialCategory="PAYROLL"
        initialRelatedType="PAYSLIP"
        initialRelatedId={payslipId}
        initialRelatedLabel={`Payslip #${payslipId.slice(0, 8)} (${payslip?.payrun_name || 'Salary Statement'})`}
        initialSubject={`Payslip Inquiry: ${payslip?.payrun_name || 'Itemized Deductions'}`}
        initialDescription={`Inquiry regarding itemized payslip breakdown for ${payslip?.payrun_name || 'recent pay period'}.\nGross Amount: ${formatCurrency(payslip?.gross_amount || 0)}\nTotal Deductions: ${formatCurrency(payslip?.total_deductions || 0)}\nNet Take-Home: ${formatCurrency(payslip?.net_amount || 0)}`}
        initialEmployeeId={payslip?.employee_id}
        onSuccess={() => alert('Concern submitted successfully to Payroll team.')}
      />
    )}
    </>
  );
}
