import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LandingPage from '../modules/landing/pages/LandingPage';
import LoginPage from '../modules/auth/pages/LoginPage';
import AppLayout from '../components/layout/AppLayout';

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
import { AttendanceListPage, MyAttendancePage } from '../modules/attendance';
import { TimeOffPage } from '../modules/timeoff';

// P3 — Payroll Module Pages
import {
  PayrunListPage,
  PayrunDetailPage,
  SalaryStructuresPage,
  SalaryRulesPage,
  PayslipsPage,
  BonusAllocationPage,
} from '../modules/payroll';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';

// Concern Communication Module
import { ConcernsPage, MyConcernsPage, ConcernDetailPage } from '../modules/concerns';

/**
 * Main Application Routing Component with Authentication & RBAC Guard
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Enterprise Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Core HR — Employees (P1) */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
                  <EmployeeListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/kanban"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
                  <EmployeeKanbanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <EmployeeFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute>
                  <EmployeeDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <EmployeeFormPage />
                </ProtectedRoute>
              }
            />

            {/* Core HR — Contracts (P1) */}
            <Route
              path="/contracts"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ContractListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ContractFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ContractDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ContractFormPage />
                </ProtectedRoute>
              }
            />

            {/* Core HR — Working Schedules (P1) */}
            <Route
              path="/schedules"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ScheduleListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ScheduleFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ScheduleDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ScheduleFormPage />
                </ProtectedRoute>
              }
            />

            {/* HR Operations — P2 */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <AttendanceListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-attendance"
              element={
                <ProtectedRoute>
                  <MyAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off"
              element={
                <ProtectedRoute>
                  <TimeOffPage />
                </ProtectedRoute>
              }
            />

            {/* Payroll — P3 Foundation Views */}
            <Route
              path="/payroll/payruns"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
                  <PayrunListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payruns/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
                  <PayrunDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payslips"
              element={
                <ProtectedRoute>
                  <PayslipsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/salary-structures"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
                  <SalaryStructuresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/salary-rules"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
                  <SalaryRulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/bonus"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
                  <BonusAllocationPage />
                </ProtectedRoute>
              }
            />

            {/* Concern Communication Module */}
            <Route
              path="/concerns"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']}>
                  <ConcernsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-concerns"
              element={
                <ProtectedRoute>
                  <MyConcernsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/concerns/:id"
              element={
                <ProtectedRoute>
                  <ConcernDetailPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
