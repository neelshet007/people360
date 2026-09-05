import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/feedback/EmptyState';
import { setStoredToken } from '../lib/auth';

// P1 — Core HR Module Pages
import EmployeeListPage from '../modules/employees/pages/EmployeeListPage';
import EmployeeKanbanPage from '../modules/employees/pages/EmployeeKanbanPage';
import EmployeeDetailPage from '../modules/employees/pages/EmployeeDetailPage';
import EmployeeFormPage from '../modules/employees/pages/EmployeeFormPage';

import ContractListPage from '../modules/contracts/pages/ContractListPage';
import ContractDetailPage from '../modules/contracts/pages/ContractDetailPage';
import ContractFormPage from '../modules/contracts/pages/ContractFormPage';

import ScheduleListPage from '../modules/schedules/pages/ScheduleListPage';
import ScheduleDetailPage from '../modules/schedules/pages/ScheduleDetailPage';
import ScheduleFormPage from '../modules/schedules/pages/ScheduleFormPage';

// P2 — HR Operations Module Pages
import { AttendanceListPage } from '../modules/attendance';
import { TimeOffPage } from '../modules/timeoff';

// P3 — Payroll Module Pages
import {
  PayrunListPage,
  PayrunDetailPage,
  SalaryStructuresPage,
  SalaryRulesPage,
  PayslipsPage,
} from '../modules/payroll';

/**
 * Dashboard View — PeoplePay360 Overview
 */
function DashboardView() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Platform Dashboard"
      subtitle="Welcome to PeoplePay360 — Integrated HR & Automated Payroll Platform"
    >
      {/* Platform Welcome Banner */}
      <Card style={{ marginBottom: '24px', backgroundColor: 'var(--primary-50, #eef2ff)', borderColor: 'var(--primary-200, #c7d2fe)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-900, #312e81)', margin: 0 }}>
              Workforce Master & Platform Operational Status
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--primary-700, #4338ca)', marginTop: '4px', margin: 0 }}>
              P1 Core HR foundation is active. Employees, contracts, and working schedules are connected to the central pipeline.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" size="sm" onClick={() => navigate('/employees/new')}>
              Add Employee
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/employees/kanban')}>
              Kanban Board
            </Button>
          </div>
        </div>
      </Card>

      {/* Domain Quick Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <Card
          title="Core HR (P1)"
          subtitle="Workforce Master Records"
          actions={<span style={{ fontSize: '0.75rem', color: 'var(--primary-600, #4f46e5)', fontWeight: 600 }}>Active</span>}
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-600, #475569)', marginBottom: '16px' }}>
            Central employee registry, legal employment contracts, and working shift calendar policies.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/employees')}>
              Directory
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/employees/kanban')}>
              Kanban
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/contracts')}>
              Contracts
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/schedules')}>
              Schedules
            </Button>
          </div>
        </Card>

        <Card
          title="HR Operations (P2)"
          subtitle="Daily Attendance & Leaves"
          actions={<span style={{ fontSize: '0.75rem', color: 'var(--neutral-400, #94a3b8)' }}>Extensible</span>}
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-600, #475569)', marginBottom: '16px' }}>
            Time tracking, daily check-in logs, leave category balances, and employee absence requests.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/attendance')}>
              Attendance
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/time-off')}>
              Time Off
            </Button>
          </div>
        </Card>

        <Card
          title="Payroll (P3)"
          subtitle="Compensation & Payruns"
          actions={<span style={{ fontSize: '0.75rem', color: 'var(--neutral-400, #94a3b8)' }}>Extensible</span>}
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-600, #475569)', marginBottom: '16px' }}>
            Salary structures, deduction rules, periodic payrun execution batches, and itemized payslips.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/payroll/payruns')}>
              Payruns
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/payroll/payslips')}>
              Payslips
            </Button>
          </div>
        </Card>
      </div>

      {/* Integration Pipeline Graphic */}
      <Card title="Connected Platform Pipeline" subtitle="Data flow across team ownership boundaries">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '16px 8px',
          }}
        >
          <div style={{ textAlign: 'center', padding: '12px 16px', backgroundColor: 'var(--neutral-50, #f8fafc)', borderRadius: '8px', flex: 1, minWidth: '130px' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>👤</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>1. Employee (P1)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Onboard staff</div>
          </div>
          <span>➔</span>
          <div style={{ textAlign: 'center', padding: '12px 16px', backgroundColor: 'var(--neutral-50, #f8fafc)', borderRadius: '8px', flex: 1, minWidth: '130px' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>📝</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>2. Contract (P1)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Wage terms</div>
          </div>
          <span>➔</span>
          <div style={{ textAlign: 'center', padding: '12px 16px', backgroundColor: 'var(--neutral-50, #f8fafc)', borderRadius: '8px', flex: 1, minWidth: '130px' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>⏰</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>3. Schedule (P1)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Shift calendar</div>
          </div>
          <span>➔</span>
          <div style={{ textAlign: 'center', padding: '12px 16px', backgroundColor: 'var(--neutral-50, #f8fafc)', borderRadius: '8px', flex: 1, minWidth: '130px' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>📅</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>4. Attendance (P2)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Hours logged</div>
          </div>
          <span>➔</span>
          <div style={{ textAlign: 'center', padding: '12px 16px', backgroundColor: 'var(--neutral-50, #f8fafc)', borderRadius: '8px', flex: 1, minWidth: '130px' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>💳</div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>5. Payrun (P3)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Gross-to-net</div>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}





/**
 * Authentication Boundary / Login View
 */
function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStoredToken('mock-jwt-auth-session-token');
      setLoading(false);
      navigate('/dashboard');
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--neutral-100, #f1f5f9)',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-600, #4f46e5)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              marginBottom: '12px',
              boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)',
            }}
          >
            P
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-900, #0f172a)', margin: 0 }}>
            PeoplePay360
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px' }}>
            Integrated HR & Automated Payroll Platform
          </p>
        </div>

        <Card title="Sign In to Your Account" subtitle="Access workforce management and self-service">
          <form onSubmit={handleSignIn} style={{ marginTop: '16px' }}>
            <Input
              label="Email Address"
              id="login_email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
            />

            <Input
              label="Password"
              id="login_password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Sign In
            </Button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link to="/dashboard" style={{ fontSize: '0.8125rem', color: 'var(--primary-600, #4f46e5)', fontWeight: 500 }}>
              Continue as Guest / Enter Platform →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Main Application Routing Component
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />

          {/* Core HR — Employees (P1) */}
          <Route path="employees" element={<EmployeeListPage />} />
          <Route path="employees/kanban" element={<EmployeeKanbanPage />} />
          <Route path="employees/new" element={<EmployeeFormPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="employees/:id/edit" element={<EmployeeFormPage />} />

          {/* Core HR — Contracts (P1) */}
          <Route path="contracts" element={<ContractListPage />} />
          <Route path="contracts/new" element={<ContractFormPage />} />
          <Route path="contracts/:id" element={<ContractDetailPage />} />
          <Route path="contracts/:id/edit" element={<ContractFormPage />} />

          {/* Core HR — Working Schedules (P1) */}
          <Route path="schedules" element={<ScheduleListPage />} />
          <Route path="schedules/new" element={<ScheduleFormPage />} />
          <Route path="schedules/:id" element={<ScheduleDetailPage />} />
          <Route path="schedules/:id/edit" element={<ScheduleFormPage />} />

          {/* HR Operations — P2 Foundation Views */}
          <Route path="attendance" element={<AttendanceListPage />} />
          <Route path="time-off" element={<TimeOffPage />} />

          {/* Payroll — P3 Foundation Views */}
          <Route path="payroll">
            <Route index element={<Navigate to="payruns" replace />} />
            <Route path="salary-structures" element={<SalaryStructuresPage />} />
            <Route path="salary-rules" element={<SalaryRulesPage />} />
            <Route path="payruns" element={<PayrunListPage />} />
            <Route path="payruns/:id" element={<PayrunDetailPage />} />
            <Route path="payslips" element={<PayslipsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
