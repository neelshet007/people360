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
  const totalEmployees = stats?.total_employees || 0;
  const activeContracts = stats?.active_contracts || 0;
  const presentCount = stats?.today_attendance?.present || 0;
  const lateCount = stats?.today_attendance?.late || 0;
  const halfDayCount = stats?.today_attendance?.half_day || 0;
  const absentCount = stats?.today_attendance?.absent || 0;
  const totalAttendanceToday = presentCount + lateCount + halfDayCount + absentCount;

  const attendanceRate = totalAttendanceToday > 0
    ? Math.round(((presentCount + lateCount) / totalAttendanceToday) * 100)
    : 100;

  const departmentList = stats?.by_department || [];
  const maxDeptSpend = Math.max(...departmentList.map((d) => d.net_payout || 0), 1);

  const payrunsList = stats?.trends || [];
  const latestPayrun = stats?.latest_payrun || null;

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

          {role === 'EMPLOYEE' && (
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

      {!loading && stats && (
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
                <span>• {stats?.pending_onboarding || 0} Pending</span>
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
                {formatCurrency(stats?.payroll_overview?.total_net_disbursed || 0)}
              </div>
              <div className="pp-stat-sub">
                <span>Gross: {formatCurrency(stats?.payroll_overview?.total_gross_processed || 0)}</span>
              </div>
            </div>

            {/* KPI 4: Operations & Batches */}
            <div className="pp-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pp-stat-label">Payrun Batches</span>
                <CreditCardIcon size={16} color="var(--warning, #d97706)" />
              </div>
              <div className="pp-stat-value">{stats?.payroll_overview?.total_payruns_count || 0}</div>
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
                    const pct = Math.round(((dept.net_payout || 0) / maxDeptSpend) * 100);
                    return (
                      <div key={dept.department}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                            {dept.department}
                            <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 400, marginLeft: '6px', fontSize: '0.75rem' }}>
                              ({dept.employee_count} staff)
                            </span>
                          </span>
                          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-main, #0f172a)' }}>
                            {formatCurrency(dept.net_payout || 0)}
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
                      Pending Leave Requests ({stats?.pending_leaves_count || 0})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                      {stats?.pending_leaves_count > 0 ? 'Leave applications submitted by team members awaiting approval.' : 'All statutory leave applications currently reviewed.'}
                    </div>
                  </div>
                  {stats?.pending_leaves_count > 0 && (
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
