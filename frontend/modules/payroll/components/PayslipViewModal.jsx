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

  const handlePrintPdf = () => {
    if (!payslip) return;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;

    const earningsRows = (earnings.length > 0
      ? earnings.map(
          (e) => `
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
            <span style="color:#334155;">${e.rule_name} <span style="color:#94a3b8; font-size:11px;">(${e.rule_code})</span></span>
            <span style="font-weight:600; color:#0f172a;">${formatCurrency(e.amount)}</span>
          </div>`
        )
      : `
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Gross Basic & Allowances</span>
          <span style="font-weight:600;">${formatCurrency(payslip.gross_amount)}</span>
        </div>`
    ).join('');

    const deductionsRows = (deductions.length > 0
      ? deductions.map(
          (d) => `
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
            <span style="color:#334155;">${d.rule_name} <span style="color:#94a3b8; font-size:11px;">(${d.rule_code})</span></span>
            <span style="font-weight:600; color:#dc2626;">-${formatCurrency(d.amount)}</span>
          </div>`
        )
      : `
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Statutory Deductions</span>
          <span style="font-weight:600; color:#dc2626;">-${formatCurrency(payslip.total_deductions)}</span>
        </div>`
    ).join('');

    const statusBadge = payslip.status === 'PAID'
      ? `<span style="background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; padding:3px 10px; border-radius:9999px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;">Paid</span>`
      : `<span style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:3px 10px; border-radius:9999px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;">${payslip.status || 'Verified'}</span>`;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Statement - ${payslip.employee_name || 'Payslip'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            body {
              background: #ffffff;
              color: #0f172a;
              padding: 10px;
            }
          </style>
        </head>
        <body>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #e2e8f0;">
            <span style="font-size:16px; font-weight:800; color:#0f172a;">Salary Statement / Payslip</span>
            ${statusBadge}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e2e8f0; padding-bottom:14px; margin-bottom:16px;">
            <div>
              <div style="font-size:20px; font-weight:900; color:#4338ca; letter-spacing:-0.02em;">PeoplePay360</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">Integrated HR & Automated Payroll Platform (India Locale)</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px; font-weight:700; color:#334155;">Payslip Ref: ${payslip.id.slice(0, 8).toUpperCase()}</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">Batch: ${payslip.payrun_name || 'September 2026 Monthly Payrun'}</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; background-color:#f8fafc; padding:14px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:16px;">
            <div>
              <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Employee Name</div>
              <div style="font-weight:700; font-size:13px; color:#0f172a; margin-top:2px;">${payslip.employee_name || 'Rahul Sharma'}</div>
              <div style="font-size:11px; color:#64748b; margin-top:1px;">${payslip.employee_code || 'EMP-IN-1001'}</div>
            </div>
            <div>
              <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Designation & Dept</div>
              <div style="font-weight:600; font-size:13px; color:#1e293b; margin-top:2px;">${payslip.designation || 'Principal Software Architect'}</div>
              <div style="font-size:11px; color:#64748b; margin-top:1px;">${payslip.department || 'Engineering'}</div>
            </div>
            <div>
              <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Payroll Period</div>
              <div style="font-weight:600; font-size:12px; color:#1e293b; margin-top:2px;">
                ${payslip.pay_period_start ? payslip.pay_period_start.split('T')[0] : '2026-08-31'} → ${payslip.pay_period_end ? payslip.pay_period_end.split('T')[0] : '2026-09-29'}
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:1px;">Standard Days: 22.0</div>
            </div>
            <div>
              <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Attendance Payout Days</div>
              <div style="font-weight:700; font-size:13px; color:#15803d; margin-top:2px;">${payslip.worked_days || '5.00'} Worked Days</div>
              <div style="font-size:11px; color:#64748b; margin-top:1px;">Absent: ${payslip.absent_days || '0.00'} days</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
              <div style="padding:8px 12px; background-color:#f1f5f9; font-weight:700; font-size:11px; color:#1e293b; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between;">
                <span>EARNINGS & ALLOWANCES</span>
                <span>AMOUNT</span>
              </div>
              <div style="padding:10px 12px; min-height:120px;">
                ${earningsRows}
              </div>
              <div style="padding:10px 12px; background-color:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-weight:700; font-size:13px; color:#0f172a;">
                <span>Total Gross Earnings</span>
                <span style="color:#4338ca;">${formatCurrency(payslip.gross_amount)}</span>
              </div>
            </div>

            <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
              <div style="padding:8px 12px; background-color:#f1f5f9; font-weight:700; font-size:11px; color:#1e293b; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between;">
                <span>DEDUCTIONS & TAX</span>
                <span>AMOUNT</span>
              </div>
              <div style="padding:10px 12px; min-height:120px;">
                ${deductionsRows}
              </div>
              <div style="padding:10px 12px; background-color:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-weight:700; font-size:13px; color:#0f172a;">
                <span>Total Deductions</span>
                <span style="color:#dc2626;">-${formatCurrency(payslip.total_deductions)}</span>
              </div>
            </div>
          </div>

          <div style="padding:14px 18px; background-color:#f0fdf4; border:2px solid #bbf7d0; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
              <div style="font-size:11px; font-weight:800; color:#166534; text-transform:uppercase; letter-spacing:0.04em;">Net Salary Payable (Take-Home)</div>
              <div style="font-size:11px; color:#15803d; margin-top:2px;">Disbursed via Corporate Direct Bank Transfer • Verified by HR Operations</div>
            </div>
            <div style="font-size:24px; font-weight:900; color:#15803d;">
              ${formatCurrency(payslip.net_amount)}
            </div>
          </div>

          <div style="text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:10px;">
            This is a computer-generated document from PeoplePay360 India Payroll Engine.
          </div>
        </body>
      </html>
    `);
    doc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1500);
    }, 200);
  };

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
            onClick={handlePrintPdf}
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
