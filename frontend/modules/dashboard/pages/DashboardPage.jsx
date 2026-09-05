import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/feedback/Loading';
import Alert from '../../../components/feedback/Alert';
import { apiClient } from '../../../lib/api/apiClient';
import { formatCurrency } from '../../../lib/utils';
import {
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  CreditCardIcon,
  BanknoteIcon,
  RefreshIcon,
  PlusIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '../../../components/ui/Icons';

/**
 * Enterprise Role-Tailored Dashboard
 * Organized strictly by operational workflows: Workforce, Daily Operations, Payroll Execution, and Attention Required
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load platform dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [role]);

  const getRoleHeader = () => {
    switch (role) {
      case 'EMPLOYEE':
        return {
          title: `Welcome, ${user?.name || 'Team Member'}`,
          subtitle: 'Employee Self-Service Desk — Real-time attendance, leave balances, and take-home compensation',
          badge: 'Self Service Portal',
        };
      case 'HR_MANAGER':
        return {
          title: 'HR Operations Hub',
          subtitle: 'Active workforce registry, daily shift schedules, attendance compliance, and leave approvals',
          badge: 'People Operations',
        };
      case 'HR_PAYROLL_USER':
        return {
          title: 'Payroll Processing Desk',
          subtitle: 'Periodic payrun batch execution, itemized payslips, and compensation audit trails',
          badge: 'Payroll Operations',
        };
      case 'HR_PAYROLL_MANAGER':
        return {
          title: 'HR & Payroll Executive Desk',
          subtitle: 'Complete workforce management, salary structure rules, and payroll disbursement sign-offs',
          badge: 'Executive Command',
        };
      case 'ADMIN':
      default:
        return {
          title: 'PeoplePay360 Master Console',
          subtitle: 'Integrated Enterprise HR & Automated Statutory Payroll — System Operations & Governance',
          badge: 'System Administrator',
        };
    }
  };

  const headerInfo = getRoleHeader();

  // Calculation helpers from real backend stats
  const totalEmployees = stats?.employees?.total ?? stats?.total_employees ?? 0;
  const activeContracts = stats?.contracts?.active ?? stats?.active_contracts ?? 0;
  const pendingOnboarding = stats?.pending_onboarding ?? stats?.employees?.inactive ?? 0;

  const presentCount = stats?.attendance?.present ?? stats?.today_attendance?.present ?? 0;
  const lateCount = stats?.attendance?.late ?? stats?.today_attendance?.late ?? 0;
  const halfDayCount = stats?.attendance?.half_day ?? stats?.today_attendance?.half_day ?? 0;
  const absentCount = stats?.attendance?.absent ?? stats?.today_attendance?.absent ?? 0;
  const totalAttendanceToday = presentCount + lateCount + halfDayCount + absentCount;

  const attendanceRate = totalAttendanceToday > 0
    ? Math.round(((presentCount + lateCount) / totalAttendanceToday) * 100)
    : 100;

  const departmentList = stats?.payroll?.by_department ?? stats?.by_department ?? [];
  const maxDeptSpend = Math.max(...departmentList.map((d) => parseFloat(d.net_payout || d.total_net || 0)), 1);

  const payrunsList = stats?.payroll?.trends ?? stats?.trends ?? [];
  const latestPayrun = stats?.latest_payrun || (payrunsList.length > 0 ? payrunsList[payrunsList.length - 1] : null);

  const totalNetDisbursed = stats?.payroll?.total_disbursed ?? stats?.payroll_overview?.total_net_disbursed ?? 0;
  const totalGrossProcessed = stats?.payroll?.total_gross ?? stats?.payroll_overview?.total_gross_processed ?? 0;
  const totalPayrunsCount = stats?.payroll?.total_payruns ?? stats?.payroll_overview?.total_payruns_count ?? 0;
  const pendingLeavesCount = stats?.timeoff?.pending ?? stats?.pending_leaves_count ?? 0;

  const isEmployee = role === 'EMPLOYEE' || stats?.role === 'EMPLOYEE';

  // Employee-specific calculated values
  const empAllocations = stats?.timeoff?.allocations || [];
  const totalAllocatedLeaves = empAllocations.reduce((sum, a) => sum + parseFloat(a.allocated_days || 0), 0);
  const totalRemainingLeaves = empAllocations.reduce((sum, a) => sum + parseFloat(a.remaining_days || 0), 0);
  const totalUsedLeaves = empAllocations.reduce((sum, a) => sum + parseFloat(a.used_days || 0), 0);

  const empAttendanceSummary = stats?.attendance?.summary || { present: 0, late: 0, half_day: 0, total_hours: 0 };
  const empRecentAttendance = stats?.attendance?.recent || [];
  const empLatestPayslip = stats?.payroll?.latest_payslip || null;
  const empRecentPayslips = stats?.payroll?.recent_payslips || [];
  const empContract = stats?.contract || null;
  const empInfo = stats?.employee || user || {};

  return (
    <PageContainer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{headerInfo.title}</span>
          <Badge variant="neutral">{headerInfo.badge}</Badge>
        </div>
      }
      subtitle={headerInfo.subtitle}
      actions={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="secondary" size="sm" onClick={fetchStats} icon={<RefreshIcon size={14} />}>
            Refresh
          </Button>

          {isEmployee && (
            <Button variant="primary" size="sm" onClick={() => navigate('/time-off')} icon={<PlusIcon size={14} />}>
              Request Leave
            </Button>
          )}

          {(role === 'HR_MANAGER' || role === 'HR_PAYROLL_MANAGER' || role === 'ADMIN') && (
            <Button variant="primary" size="sm" onClick={() => navigate('/employees/new')} icon={<PlusIcon size={14} />}>
              Add Employee
            </Button>
          )}

          {role === 'HR_PAYROLL_USER' && (
            <Button variant="primary" size="sm" onClick={() => navigate('/payroll/payruns')} icon={<CreditCardIcon size={14} />}>
              Open Payruns
            </Button>
          )}
        </div>
      }
    >
      {loading && <Loading message="Querying live metrics from PostgreSQL..." />}

      {error && (
        <Alert
          type="danger"
          title="Dashboard Synchronization Error"
          message={error}
          action={
            <Button variant="secondary" size="sm" onClick={fetchStats}>
              Retry
            </Button>
          }
        />
      )}

      {!loading && stats && isEmployee && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* EMPLOYEE HERO PROFILE BANNER */}
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-900, #0f172a)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                }}
              >
                {empInfo?.first_name?.[0] || 'E'}{empInfo?.last_name?.[0] || 'M'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                    {empInfo?.display_name || `${empInfo?.first_name || ''} ${empInfo?.last_name || ''}`.trim() || 'Employee'}
                  </h3>
                  <Badge variant="success">Active Status</Badge>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                  {empInfo?.designation || 'Specialist'} • {empInfo?.department || 'Operations'} • ID: {empInfo?.employee_code || 'EMP-360'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                  Assigned Shift
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
                  {empContract?.schedule_name || 'Standard 40h Workweek'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                  Agreement Binding
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
                  {empContract?.contract_type || 'Permanent Contract'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                  Statutory Structure
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
                  {empContract?.structure_name || 'Standard Executive CTC'}
                </div>
              </div>
            </div>
          </div>

          {/* EMPLOYEE KPI STRIP */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            {/* KPI 1: Logged Attendance Hours */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Hours Worked This Period</span>
                <ClockIcon size={16} color="var(--primary-600, #2563eb)" />
              </div>
              <div className="pp-stat-value">{empAttendanceSummary.total_hours} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>hrs</span></div>
              <div className="pp-stat-sub">
                <span style={{ color: 'var(--success, #059669)', fontWeight: 600 }}>{empAttendanceSummary.present} Present</span>
                <span> • {empAttendanceSummary.late} Late • {empAttendanceSummary.half_day} Half Day</span>
              </div>
            </div>

            {/* KPI 2: Available Leave Quota */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Available Leave Quota</span>
                <CalendarIcon size={16} color="var(--success, #059669)" />
              </div>
              <div className="pp-stat-value">{totalRemainingLeaves} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span></div>
              <div className="pp-stat-sub">
                <span>{totalUsedLeaves} used of {totalAllocatedLeaves} allocated days</span>
              </div>
            </div>

            {/* KPI 3: Contract Wage Rate */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Contracted Wage Rate</span>
                <BanknoteIcon size={16} color="var(--brand-900, #0f172a)" />
              </div>
              <div className="pp-stat-value" style={{ fontSize: '1.45rem' }}>
                {formatCurrency(empContract?.wage_rate || 0)}
              </div>
              <div className="pp-stat-sub">
                <span>Binding monthly gross compensation</span>
              </div>
            </div>

            {/* KPI 4: Latest Net Disbursed Payout */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Latest Net Pay</span>
                <CreditCardIcon size={16} color="var(--warning, #d97706)" />
              </div>
              <div className="pp-stat-value" style={{ fontSize: '1.45rem' }}>
                {empLatestPayslip ? formatCurrency(empLatestPayslip.net_amount) : '₹0'}
              </div>
              <div className="pp-stat-sub">
                <span>Cycle: {empLatestPayslip?.payrun_name || 'Current'} (</span>
                <Badge variant={empLatestPayslip?.status === 'PAID' ? 'success' : 'neutral'}>
                  {empLatestPayslip?.status || 'PENDING'}
                </Badge>
                <span>)</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: ATTENDANCE AUDIT & LEAVE BALANCES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Recent Attendance Log */}
            <Card
              title="Recent Shift Attendance"
              subtitle="Personal clock-in / clock-out entries from live PostgreSQL registry"
              actions={
                <Link to="/my-attendance" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>Full Registry</span>
                  <ChevronRightIcon size={12} />
                </Link>
              }
            >
              {empRecentAttendance.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>
                  No attendance entries logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {empRecentAttendance.map((rec) => {
                    const statusVariant = rec.status === 'PRESENT' ? 'success' : rec.status === 'LATE' ? 'warning' : 'neutral';
                    const formattedDate = rec.date ? new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : 'N/A';
                    return (
                      <div
                        key={rec.id}
                        style={{
                          padding: '10px 14px',
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main, #0f172a)' }}>
                            {formattedDate}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                            {rec.clock_in ? new Date(rec.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            {' → '}
                            {rec.clock_out ? new Date(rec.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            {rec.notes ? ` • ${rec.notes}` : ''}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-main, #0f172a)' }}>
                            {rec.total_hours || 0} hrs
                          </div>
                          <div style={{ marginTop: '2px' }}>
                            <Badge variant={statusVariant}>{rec.status}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Leave Balance Quotas */}
            <Card
              title="Statutory Leave Allocations"
              subtitle="2026 accrued entitlements and remaining balances"
              actions={
                <Link to="/time-off" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>Manage Time Off</span>
                  <ChevronRightIcon size={12} />
                </Link>
              }
            >
              {empAllocations.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>
                  No leave quotas assigned for the current calendar year.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {empAllocations.map((alloc) => {
                    const allocated = parseFloat(alloc.allocated_days || 0);
                    const remaining = parseFloat(alloc.remaining_days || 0);
                    const used = parseFloat(alloc.used_days || 0);
                    const pct = allocated > 0 ? Math.round((remaining / allocated) * 100) : 0;

                    return (
                      <div key={alloc.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                            {alloc.type_name}
                            <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 400, marginLeft: '6px', fontSize: '0.75rem' }}>
                              ({alloc.type_code})
                            </span>
                          </span>
                          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-main, #0f172a)' }}>
                            {remaining} / {allocated} Days Left
                          </span>
                        </div>
                        <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--neutral-100, #f1f5f9)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              backgroundColor: pct > 40 ? 'var(--success, #059669)' : pct > 15 ? 'var(--warning, #d97706)' : 'var(--danger, #dc2626)',
                              borderRadius: '3px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
                          {used} days utilized • {alloc.is_paid ? 'Statutory Paid' : 'Unpaid'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* SECTION 3: COMPENSATION AUDIT & TWO-WAY CONCERN DESK */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Payslips History */}
            <Card
              title="Disbursed Compensation Statements"
              subtitle="Audited gross-to-net breakdown and salary slips"
              actions={
                <Link to="/payroll/payslips" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>All Payslips</span>
                  <ChevronRightIcon size={12} />
                </Link>
              }
            >
              {empRecentPayslips.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>
                  No historical payslips generated yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {empRecentPayslips.map((ps) => (
                    <div
                      key={ps.id}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main, #0f172a)' }}>
                          {ps.payrun_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                          Gross: {formatCurrency(ps.gross_amount)} • Deductions: {formatCurrency(ps.total_deductions)}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-main, #0f172a)' }}>
                          {formatCurrency(ps.net_amount)}
                        </div>
                        <div style={{ marginTop: '2px' }}>
                          <Badge variant={ps.status === 'PAID' ? 'success' : 'neutral'}>{ps.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Concerns & Inquiries Desk */}
            <Card
              title="Employee HR Desk & Inquiries"
              subtitle="Two-way structured communication channel with People Operations"
              actions={
                <Link to="/my-concerns" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>My Concerns</span>
                  <ChevronRightIcon size={12} />
                </Link>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--neutral-50, #f8fafc)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <CheckCircleIcon size={16} color="var(--primary-600, #2563eb)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                      Direct Channel to HR & Management
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                      Submit inquiries regarding payroll calculations, shift rectifications, or statutory policy queries.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/my-concerns')} style={{ flex: 1 }}>
                    View My Inquiries
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => navigate('/my-attendance')} style={{ flex: 1 }}>
                    Clock-in / Clock-out
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {!loading && stats && !isEmployee && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SECTION 1: WORKFLOW KPI STRIP */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            {/* KPI 1: Workforce */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Active Workforce</span>
                <UsersIcon size={16} color="var(--primary-600, #2563eb)" />
              </div>
              <div className="pp-stat-value">{totalEmployees}</div>
              <div className="pp-stat-sub">
                <span style={{ color: 'var(--success, #059669)', fontWeight: 600 }}>{activeContracts} Active Contracts</span>
                <span>• {pendingOnboarding} Pending</span>
              </div>
            </div>

            {/* KPI 2: Attendance Rate */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Attendance Today</span>
                <ClockIcon size={16} color="var(--success, #059669)" />
              </div>
              <div className="pp-stat-value">{attendanceRate}%</div>
              <div className="pp-stat-sub">
                <span>{presentCount} Present • {lateCount} Late • {absentCount} Absent</span>
              </div>
            </div>

            {/* KPI 3: Payroll Net Disbursed */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Total Net Disbursed</span>
                <BanknoteIcon size={16} color="var(--brand-900, #0f172a)" />
              </div>
              <div className="pp-stat-value" style={{ fontSize: '1.45rem' }}>
                {formatCurrency(totalNetDisbursed)}
              </div>
              <div className="pp-stat-sub">
                <span>Gross: {formatCurrency(totalGrossProcessed)}</span>
              </div>
            </div>

            {/* KPI 4: Operations & Batches */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Payrun Batches</span>
                <CreditCardIcon size={16} color="var(--warning, #d97706)" />
              </div>
              <div className="pp-stat-value">{totalPayrunsCount}</div>
              <div className="pp-stat-sub">
                <span>Latest: </span>
                <Badge variant={latestPayrun?.status === 'PAID' ? 'success' : latestPayrun?.status === 'VALIDATED' ? 'warning' : 'neutral'}>
                  {latestPayrun?.status || 'COMPLETED'}
                </Badge>
              </div>
            </div>
          </div>

          {/* SECTION 2: OPERATIONAL WORKFLOWS & VISUAL INSIGHTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Card A: Department Payroll Disbursement */}
            <Card
              title="Department Payroll Allocation"
              subtitle="Live gross-to-net disbursement proportions by department"
              actions={
                <Link to="/payroll/payruns" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>View Batches</span>
                  <ChevronRightIcon size={12} />
                </Link>
              }
            >
              {departmentList.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>
                  No departmental payroll data recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {departmentList.slice(0, 5).map((dept) => {
                    const deptSpend = parseFloat(dept.net_payout || dept.total_net || 0);
                    const staffCount = dept.employee_count || dept.payslip_count || 0;
                    const pct = Math.round((deptSpend / maxDeptSpend) * 100);
                    return (
                      <div key={dept.department}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                            {dept.department}
                            <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 400, marginLeft: '6px', fontSize: '0.75rem' }}>
                              ({staffCount} staff)
                            </span>
                          </span>
                          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-main, #0f172a)' }}>
                            {formatCurrency(deptSpend)}
                          </span>
                        </div>
                        <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--neutral-100, #f1f5f9)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              backgroundColor: 'var(--brand-900, #0f172a)',
                              borderRadius: '3px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Card B: Shift & Attendance Compliance */}
            <Card
              title="Daily Attendance Compliance"
              subtitle="Real-time check-in status across scheduled shifts"
              actions={
                <Link to="/attendance" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>Full Registry</span>
                  <ChevronRightIcon size={12} />
                </Link>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--success-bg, #ecfdf5)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--success-border, #a7f3d0)' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--success-dark, #065f46)' }}>{presentCount}</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--success, #059669)', textTransform: 'uppercase', marginTop: '2px' }}>Present</div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--warning-bg, #fffbeb)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--warning-border, #fde68a)' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--warning-dark, #92400e)' }}>{lateCount}</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--warning, #d97706)', textTransform: 'uppercase', marginTop: '2px' }}>Late</div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--neutral-100, #f1f5f9)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--neutral-200, #e2e8f0)' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--neutral-700, #334155)' }}>{halfDayCount}</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase', marginTop: '2px' }}>Half Day</div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--danger-bg, #fef2f2)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--danger-border, #fecaca)' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--danger-dark, #991b1b)' }}>{absentCount}</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--danger, #dc2626)', textTransform: 'uppercase', marginTop: '2px' }}>Absent</div>
                </div>
              </div>

              {/* Progress Proportions Bar */}
              <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', backgroundColor: 'var(--neutral-200, #e2e8f0)' }}>
                {totalAttendanceToday > 0 ? (
                  <>
                    <div style={{ width: `${(presentCount / totalAttendanceToday) * 100}%`, backgroundColor: 'var(--success, #059669)' }} title="Present" />
                    <div style={{ width: `${(lateCount / totalAttendanceToday) * 100}%`, backgroundColor: 'var(--warning, #d97706)' }} title="Late" />
                    <div style={{ width: `${(halfDayCount / totalAttendanceToday) * 100}%`, backgroundColor: 'var(--neutral-400, #94a3b8)' }} title="Half Day" />
                    <div style={{ width: `${(absentCount / totalAttendanceToday) * 100}%`, backgroundColor: 'var(--danger, #dc2626)' }} title="Absent" />
                  </>
                ) : (
                  <div style={{ width: '100%', backgroundColor: 'var(--neutral-300, #cbd5e1)' }} />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                <span>Shift compliance: {attendanceRate}%</span>
                <span>Active working schedule: 40 hrs/wk standard</span>
              </div>
            </Card>
          </div>

          {/* SECTION 3: RECENT PAYRUN PIPELINE & ATTENTION REQUIRED */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Card C: Periodic Payrun Execution Pipeline */}
            <Card
              title="Recent Payrun Execution Batches"
              subtitle="Chronological audit of computed, validated, and disbursed payrolls"
            >
              {payrunsList.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>
                  No historical payrun batches recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {payrunsList.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/payroll/payruns/${p.id}`)}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-50, #f8fafc)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main, #0f172a)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                          Period: {p.pay_period_start?.split('T')[0]} → {p.pay_period_end?.split('T')[0]}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-main, #0f172a)' }}>
                          {formatCurrency(p.total_net || 0)}
                        </div>
                        <div style={{ marginTop: '3px' }}>
                          <Badge variant={p.status === 'PAID' ? 'success' : p.status === 'VALIDATED' ? 'warning' : 'neutral'}>
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Card D: Attention & Compliance Alert Center */}
            <Card
              title="Operational Attention Required"
              subtitle="Items awaiting managerial review or system verification"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--neutral-50, #f8fafc)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <AlertTriangleIcon size={16} color="var(--warning, #d97706)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                      Pending Leave Requests ({pendingLeavesCount})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                      {pendingLeavesCount > 0 ? 'Leave applications submitted by team members awaiting approval.' : 'All statutory leave applications currently reviewed.'}
                    </div>
                  </div>
                  {pendingLeavesCount > 0 && (
                    <Link to="/time-off" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600 }}>
                      Review →
                    </Link>
                  )}
                </div>

                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--neutral-50, #f8fafc)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <CheckCircleIcon size={16} color="var(--success, #059669)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                      Statutory Formula Integrity
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                      Indian payroll gross-to-net engine verified against active rules and PostgreSQL contracts.
                    </div>
                  </div>
                  <Link to="/payroll/salary-rules" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600 }}>
                    Rules →
                  </Link>
                </div>

                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--neutral-50, #f8fafc)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <UsersIcon size={16} color="var(--primary-600, #2563eb)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                      Workforce Contracts Binding
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                      {activeContracts} of {totalEmployees} employees have legally binding active agreements.
                    </div>
                  </div>
                  <Link to="/contracts" style={{ fontSize: '0.75rem', color: 'var(--primary-600, #2563eb)', fontWeight: 600 }}>
                    Manage →
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
