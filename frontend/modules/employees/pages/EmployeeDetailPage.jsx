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
import EmployeeStatusBadge from '../components/EmployeeStatusBadge';
import { useEmployee } from '../hooks/useEmployee';
import { formatDate } from '../../../lib/utils';

/**
 * Employee Profile & Detail Page
 * Owner: P1 (Core HR)
 */
export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { employee, loading, error, refetch } = useEmployee(id);

  if (loading) {
    return (
      <PageContainer title="Employee Profile">
        <Loading message="Loading employee profile..." />
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

  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.name || 'Unnamed Employee';

  const tabs = [
    { id: 'overview', label: 'Overview & Profile', icon: '👤' },
    { id: 'contact', label: 'Contact & Address', icon: '📞' },
    { id: 'contract', label: 'Contracts', icon: '📝' },
    { id: 'schedule', label: 'Working Schedule', icon: '⏰' },
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
      subtitle={`Employee Code: ${employee.employee_code || `EMP-${employee.id}`}`}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => navigate('/employees')}>
            Back
          </Button>
          <Button
            variant="primary"
            icon="✏️"
            onClick={() => navigate(`/employees/${id}/edit`)}
          >
            Edit Profile
          </Button>
        </div>
      }
    >
      {/* Employee Quick Info Header Card */}
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
            <Avatar name={fullName} size="xl" status="online" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{fullName}</h2>
                <EmployeeStatusBadge status={employee.status} />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px', margin: 0 }}>
                {employee.designation || employee.role || 'Designation not specified'} • {employee.department || 'Department not specified'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-400, #94a3b8)', marginTop: '4px', margin: 0 }}>
                Joined on {formatDate(employee.date_of_joining || employee.created_at)}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
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

      {/* Profile Detail Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} style={{ marginBottom: '20px' }} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <Card title="Employment Information" subtitle="Workforce metadata and organization hierarchy">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Employee Code</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.employee_code || `EMP-${employee.id}`}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Department</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.department || 'Not Assigned'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Designation / Job Role</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.designation || 'Not Assigned'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Date of Joining</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatDate(employee.date_of_joining)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Employment Status</span>
                <div style={{ marginTop: '4px' }}><EmployeeStatusBadge status={employee.status} /></div>
              </div>
            </div>
          </Card>

          <Card title="Personal Information" subtitle="Individual identity and records">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Full Legal Name</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{fullName}</div>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>National ID / Tax ID</span>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Work Email</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{employee.email || '-'}</div>
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
                {employee.address || 'No address registered.'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Contracts */}
      {activeTab === 'contract' && (
        <Card
          title="Employment Contracts"
          subtitle="Contracts registered for this employee under P1 Core HR"
          actions={
            <Button
              variant="outline"
              size="sm"
              icon="➕"
              onClick={() => navigate('/contracts/new')}
            >
              New Contract
            </Button>
          }
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)', marginBottom: '16px' }}>
            Active employment terms and wage rates configured for {fullName}.
          </p>
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
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Primary Employment Agreement</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
                Type: Full-Time Permanent • Status: Active
              </div>
            </div>
            <Link to="/contracts" style={{ color: 'var(--primary-600, #4f46e5)', fontWeight: 600, fontSize: '0.8125rem' }}>
              Manage in Contracts →
            </Link>
          </div>
        </Card>
      )}

      {/* Tab 4: Working Schedule */}
      {activeTab === 'schedule' && (
        <Card
          title="Assigned Working Schedule"
          subtitle="Standard shifts and working days bound to this employee"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/schedules')}
            >
              View All Schedules
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
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Standard Full-Time Schedule (40h/week)</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px' }}>
                Mon – Fri: 09:00 - 17:00 • 8.0 hrs/day • 60 min lunch break
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
