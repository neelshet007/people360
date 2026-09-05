import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import EmptyState from '../components/feedback/EmptyState';

// Module View Placeholders (Preserving strict ownership and boundaries - no business logic)
function DashboardView() {
  return (
    <PageContainer title="Dashboard" subtitle="Welcome to PeoplePay360 Integrated HR & Payroll Platform">
      <Card title="System Overview" subtitle="Status of integrated workforce and payroll services">
        <EmptyState
          title="No recent activity"
          description="System services are operational. When modules are activated, summary metrics will appear here."
        />
      </Card>
    </PageContainer>
  );
}

function EmployeesView() {
  return (
    <PageContainer title="Employees" subtitle="Owner: P1 — Core HR">
      <Card title="Employee Directory" subtitle="Central workforce master records">
        <EmptyState
          title="No employees found"
          description="P1 Core HR employee records will be listed here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function ContractsView() {
  return (
    <PageContainer title="Contracts" subtitle="Owner: P1 — Core HR">
      <Card title="Employment Contracts" subtitle="Employment terms, wage rates, and schedule links">
        <EmptyState
          title="No contracts found"
          description="P1 Core HR contract records will be listed here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function SchedulesView() {
  return (
    <PageContainer title="Working Schedules" subtitle="Owner: P1 — Core HR">
      <Card title="Schedules & Shifts" subtitle="Standard working hours, shifts, and weekly rest days">
        <EmptyState
          title="No working schedules configured"
          description="P1 Core HR schedule definitions will appear here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function AttendanceView() {
  return (
    <PageContainer title="Attendance" subtitle="Owner: P2 — HR Operations">
      <Card title="Daily Attendance Logs" subtitle="Clock-in/out tracking and worked hour calculations">
        <EmptyState
          title="No attendance records found"
          description="P2 HR Operations attendance logs will be displayed here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function TimeOffView() {
  return (
    <PageContainer title="Time Off" subtitle="Owner: P2 — HR Operations">
      <Card title="Leave Requests & Allocations" subtitle="Employee leave requests, approvals, and balances">
        <EmptyState
          title="No time off requests found"
          description="P2 HR Operations leave requests and allocations will appear here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function SalaryStructuresView() {
  return (
    <PageContainer title="Salary Structures" subtitle="Owner: P3 — Payroll">
      <Card title="Salary Structures" subtitle="Compensation blueprints and rule groupings">
        <EmptyState
          title="No salary structures found"
          description="P3 Payroll salary structures will be configured here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function SalaryRulesView() {
  return (
    <PageContainer title="Salary Rules" subtitle="Owner: P3 — Payroll">
      <Card title="Salary Calculation Rules" subtitle="Rules for basic salary, allowances, and deductions">
        <EmptyState
          title="No salary rules configured"
          description="P3 Payroll calculation rules will be managed here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function PayrunsView() {
  return (
    <PageContainer title="Payruns" subtitle="Owner: P3 — Payroll">
      <Card title="Payroll Batches" subtitle="Periodic payrun executions and batch processing">
        <EmptyState
          title="No payruns recorded"
          description="P3 Payroll batch calculations will be initiated and managed here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function PayslipsView() {
  return (
    <PageContainer title="Payslips" subtitle="Owner: P3 — Payroll">
      <Card title="Generated Payslips" subtitle="Itemized individual employee pay statements">
        <EmptyState
          title="No payslips generated"
          description="P3 Payroll payslips will be published here once implemented."
        />
      </Card>
    </PageContainer>
  );
}

function LoginView() {
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
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Card title="PeoplePay360" subtitle="Sign in to your account">
          <EmptyState
            title="Authentication Placeholder"
            description="Secure sign-in form will be integrated here."
          />
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="employees" element={<EmployeesView />} />
          <Route path="contracts" element={<ContractsView />} />
          <Route path="schedules" element={<SchedulesView />} />
          <Route path="attendance" element={<AttendanceView />} />
          <Route path="time-off" element={<TimeOffView />} />
          <Route path="payroll">
            <Route index element={<Navigate to="salary-structures" replace />} />
            <Route path="salary-structures" element={<SalaryStructuresView />} />
            <Route path="salary-rules" element={<SalaryRulesView />} />
            <Route path="payruns" element={<PayrunsView />} />
            <Route path="payslips" element={<PayslipsView />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
