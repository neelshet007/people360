import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import Tabs from '../../../components/ui/Tabs';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/feedback/Loading';
import ErrorState from '../../../components/feedback/ErrorState';
import ConfirmationDialog from '../../../components/feedback/ConfirmationDialog';
import Alert from '../../../components/feedback/Alert';
import EmployeeStatusBadge from '../components/EmployeeStatusBadge';
import { useEmployee } from '../hooks/useEmployee';
import employeesApi from '../api/employeesApi';
import { formatDate } from '../../../lib/utils';

/**
 * Employee Profile — 360 Degree Workforce Hub
 * Owner: P1 (Core HR)
 */
export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { employee, loading, error, refetch } = useEmployee(id);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeactivate = async () => {
    setIsDeleting(true);
    try {
      await employeesApi.deleteEmployee(id);
      setActionSuccess('Employee has been marked as TERMINATED.');
      setShowDeactivateDialog(false);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to deactivate employee');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Employee Profile">
        <Loading message="Loading employee 360 profile..." />
      </PageContainer>
    );
  }

  if (error || !employee) {
    return (
      <PageContainer title="Employee Profile">
        <ErrorState
          title="Employee Not Found"
          message={error || `Could not find an employee with ID ${id}.`}
          onRetry={refetch}
        />
        <div style={{ marginTop: '16px' }}>
          <Button variant="secondary" onClick={() => navigate('/employees')}>
            Back to Employees Directory
          </Button>
        </div>
      </PageContainer>
    );
  }

  const fullName = employee.display_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unnamed';

  const tabs = [
    { id: 'overview', label: 'Overview & Personal', icon: '👤' },
    { id: 'contact', label: 'Contact Details', icon: '📞' },
    { id: 'contract', label: 'Contracts (P1)', icon: '📝' },
    { id: 'schedule', label: 'Schedule (P1)', icon: '⏰' },
    { id: 'attendance', label: 'Attendance (P2)', icon: '📅' },
    { id: 'time-off', label: 'Time Off (P2)', icon: '🏖️' },
    { id: 'payroll', label: 'Payroll & Payslips (P3)', icon: '💳' },
  ];

  return (
    <PageContainer
      breadcrumbs={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/employees" style={{ color: 'var(--primary-600, #4f46e5)' }}>
            Employees
          </Link>
          <span>/</span>
          <span>{fullName}</span>
        </div>
      }
      title={fullName}
      subtitle={`Authoritative Record • Code: ${employee.employee_code}`}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => navigate('/employees')}>
            Directory
          </Button>
          <Button
            variant="primary"
            icon="✏️"
            onClick={() => navigate(`/employees/${id}/edit`)}
          >
            Edit Profile
          </Button>
          {employee.status !== 'TERMINATED' && employee.status !== 'INACTIVE' && (
            <Button
              variant="danger"
              onClick={() => setShowDeactivateDialog(true)}
            >
              Deactivate
            </Button>
          )}
        </div>
      }
    >
      {actionSuccess && (
        <Alert type="success" title="Status Updated">
          {actionSuccess}
        </Alert>
      )}

      {/* 360-Degree Header Hub Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Avatar name={fullName} size="xl" status={employee.status === 'ACTIVE' ? 'online' : 'offline'} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{fullName}</h2>
                <EmployeeStatusBadge status={employee.status} />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px', margin: 0 }}>
                {employee.designation} • {employee.department}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-400, #94a3b8)', marginTop: '4px', margin: 0 }}>
                Joined on {formatDate(employee.date_of_joining)} (UUID: {employee.id})
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              padding: '12px 20px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', display: 'block' }}>Email</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-800, #1e293b)' }}>
                {employee.email || '-'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', display: 'block' }}>Phone</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-800, #1e293b)' }}>
                {employee.phone || '-'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Detail Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} style={{ marginBottom: '20px' }} />

      {/* Tab 1: Overview & Personal */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <Card title="Workforce Placement" subtitle="Organizational hierarchy and employment status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Employee Code</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{employee.employee_code}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Department</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.department}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Job Position / Title</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.designation}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Date of Joining</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatDate(employee.date_of_joining)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>System Record ID</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontFamily: 'var(--font-mono)' }}>{employee.id}</div>
              </div>
            </div>
          </Card>

          <Card title="Personal Identification" subtitle="Official identity records">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>First Name</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.first_name}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Last Name</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.last_name}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Gender</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.gender || 'Not Specified'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Date of Birth</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatDate(employee.date_of_birth)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>National / Tax ID</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.national_id || '-'}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Contact */}
      {activeTab === 'contact' && (
        <Card title="Contact & Address Information">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Primary Work Email</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.email}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Phone Number</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.phone || '-'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Emergency Contact Name</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.emergency_contact_name || '-'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Emergency Contact Phone</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.emergency_contact_phone || '-'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Residential Address</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>
                {employee.address || 'No residential address recorded.'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Contracts (P1) */}
      {activeTab === 'contract' && (
        <Card
          title="Employment Contracts (P1 — Core HR)"
          subtitle="Agreements defining employment terms, duration, and baseline wages"
          actions={
            <Button
              variant="outline"
              size="sm"
              icon="➕"
              onClick={() => navigate('/contracts/new')}
            >
              Issue New Contract
            </Button>
          }
        >
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Active Primary Contract for {fullName}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
                Bound to Employee Code: {employee.employee_code}
              </div>
            </div>
            <Link to="/contracts" style={{ color: 'var(--primary-600, #4f46e5)', fontWeight: 600, fontSize: '0.8125rem' }}>
              Open Contracts Module →
            </Link>
          </div>
        </Card>
      )}

      {/* Tab 4: Working Schedule (P1) */}
      {activeTab === 'schedule' && (
        <Card
          title="Working Schedule Policy (P1 — Core HR)"
          subtitle="Work calendar, shifts, and weekly expected hours"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/schedules')}
            >
              Configure Schedules
            </Button>
          }
        >
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Assigned Shift: Standard Full-Time (40h/week)</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
                Mon – Fri (09:00 — 17:00) • 60 mins break
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>
      )}

      {/* Tab 5: Attendance (P2 Integration Boundary) */}
      {activeTab === 'attendance' && (
        <Card
          title="Attendance Logs (P2 — HR Operations)"
          subtitle="Daily check-in / check-out records and calculated worked hours"
        >
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px dashed var(--neutral-300, #cbd5e1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📅</div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--neutral-800, #1e293b)', margin: 0 }}>
              HR Operations Attendance Link Point
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', marginTop: '6px', maxWidth: '460px', margin: '6px auto 16px auto' }}>
              When P2 activates the Attendance module, daily biometric and manual clock logs anchored to employee ID <code>{employee.id}</code> will stream here.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/attendance')}>
              View Attendance Overview
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 6: Time Off (P2 Integration Boundary) */}
      {activeTab === 'time-off' && (
        <Card
          title="Time Off & Leaves (P2 — HR Operations)"
          subtitle="Leave quota allocations, submitted requests, and approved balances"
        >
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px dashed var(--neutral-300, #cbd5e1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🏖️</div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--neutral-800, #1e293b)', margin: 0 }}>
              Leave Allocation & Absence Link Point
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', marginTop: '6px', maxWidth: '460px', margin: '6px auto 16px auto' }}>
              Employee leave balances and requests managed under P2 HR Operations will link directly to this profile hub.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/time-off')}>
              View Time Off Overview
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 7: Payroll & Payslips (P3 Integration Boundary) */}
      {activeTab === 'payroll' && (
        <Card
          title="Payroll & Payslips (P3 — Payroll)"
          subtitle="Salary calculation blueprints and periodic issued pay statements"
        >
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px dashed var(--neutral-300, #cbd5e1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💳</div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--neutral-800, #1e293b)', margin: 0 }}>
              P3 Payroll Integration Hub
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', marginTop: '6px', maxWidth: '460px', margin: '6px auto 16px auto' }}>
              P3 synthesizes contract wage rates (from P1) and approved presence (from P2) to calculate gross-to-net payruns and generate itemized payslips for this employee.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={() => navigate('/payroll/payruns')}>
                View Payruns
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/payroll/payslips')}>
                View Payslips
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Deactivation Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Employee Record"
        message={`Are you sure you want to deactivate ${fullName}? Their employment status will be changed to TERMINATED.`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </PageContainer>
  );
}
