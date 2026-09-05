import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Avatar from '../../../components/ui/Avatar';
import EmployeeStatusBadge from '../components/EmployeeStatusBadge';
import Loading from '../../../components/feedback/Loading';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import { useEmployees } from '../hooks/useEmployees';

/**
 * Employee Kanban Board Page
 * Owner: P1 (Core HR)
 * Displays employees grouped by status columns using the authoritative Employee API
 */
export default function EmployeeKanbanPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Fetch all employees for Kanban view
  const {
    employees,
    loading,
    error,
    updateFilters,
    refetch,
  } = useEmployees({ limit: 100 });

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: searchTerm, department: selectedDept });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    updateFilters({ search: '', department: '' });
  };

  const departmentOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
  ];

  // Grouping columns by authoritative status values
  const columns = [
    {
      id: 'ACTIVE',
      title: 'Active Workforce',
      color: 'var(--success, #10b981)',
      bgColor: 'var(--success-bg, #ecfdf5)',
      borderColor: 'var(--success-border, #a7f3d0)',
    },
    {
      id: 'ON_LEAVE',
      title: 'On Leave',
      color: 'var(--warning-dark, #b45309)',
      bgColor: 'var(--warning-bg, #fffbeb)',
      borderColor: 'var(--warning-border, #fde68a)',
    },
    {
      id: 'INACTIVE',
      title: 'Inactive / Offboarded',
      color: 'var(--neutral-600, #475569)',
      bgColor: 'var(--neutral-100, #f1f5f9)',
      borderColor: 'var(--neutral-300, #cbd5e1)',
    },
  ];

  const getEmployeesByStatus = (status) => {
    return employees.filter((emp) => {
      const s = (emp.status || 'ACTIVE').toUpperCase();
      if (status === 'INACTIVE') {
        return s === 'INACTIVE' || s === 'TERMINATED';
      }
      return s === status;
    });
  };

  return (
    <PageContainer
      title="Employee Directory"
      subtitle="Workforce master records, organization roles, and status workflows"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Switcher: List | Kanban */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--neutral-100, #f1f5f9)',
              padding: '3px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              icon="☰"
              onClick={() => navigate('/employees')}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--neutral-600, #475569)',
                padding: '4px 10px',
              }}
            >
              List
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="▦"
              style={{
                padding: '4px 10px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              Kanban
            </Button>
          </div>

          <Button
            variant="primary"
            icon="➕"
            onClick={() => navigate('/employees/new')}
          >
            Add Employee
          </Button>
        </div>
      }
    >
      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <form
          onSubmit={handleSearch}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            alignItems: 'end',
          }}
        >
          <Input
            label="Search Directory"
            id="search_kanban"
            placeholder="Search by name, code, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon="🔍"
          />

          <Select
            label="Department Filter"
            id="dept_kanban"
            options={departmentOptions}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            placeholder="All Departments"
          />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <Button type="submit" variant="primary" style={{ flex: 1 }}>
              Filter
            </Button>
            {(searchTerm || selectedDept) && (
              <Button type="button" variant="secondary" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Main Kanban Content */}
      {loading ? (
        <Loading message="Loading employee kanban board..." />
      ) : error ? (
        <ErrorState
          title="Unable to load employee kanban"
          message={error}
          onRetry={refetch}
        />
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description={
            searchTerm || selectedDept
              ? 'No employee records matched your filter criteria.'
              : 'Your workforce directory is empty. Get started by adding your first employee.'
          }
          action={
            <Button
              variant="primary"
              icon="➕"
              onClick={() => navigate('/employees/new')}
            >
              Add First Employee
            </Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {columns.map((col) => {
            const columnEmployees = getEmployeesByStatus(col.id);

            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: 'var(--neutral-100, #f1f5f9)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  border: '1px solid var(--neutral-200, #e2e8f0)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 240px)',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: col.color,
                      }}
                    />
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--neutral-900, #0f172a)', margin: 0 }}>
                      {col.title}
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full, 9999px)',
                      backgroundColor: col.bgColor,
                      color: col.color,
                      border: `1px solid ${col.borderColor}`,
                    }}
                  >
                    {columnEmployees.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div
                  style={{
                    padding: '12px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    flex: 1,
                  }}
                >
                  {columnEmployees.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 12px',
                        textAlign: 'center',
                        color: 'var(--neutral-400, #94a3b8)',
                        fontSize: '0.8125rem',
                        border: '1px dashed var(--neutral-300, #cbd5e1)',
                        borderRadius: 'var(--radius-md, 8px)',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      No employees in this status
                    </div>
                  ) : (
                    columnEmployees.map((emp) => {
                      const fullName = emp.display_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unnamed';

                      return (
                        <div
                          key={emp.id}
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: 'var(--radius-md, 8px)',
                            border: '1px solid var(--neutral-200, #e2e8f0)',
                            boxShadow: 'var(--shadow-xs)',
                            padding: '14px',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            e.currentTarget.style.borderColor = 'var(--primary-300, #a5b4fc)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                            e.currentTarget.style.borderColor = 'var(--neutral-200, #e2e8f0)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Avatar name={fullName} size="md" status={emp.status === 'ACTIVE' ? 'online' : 'offline'} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-900, #0f172a)' }}>
                                  {fullName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontFamily: 'var(--font-mono)' }}>
                                  {emp.employee_code}
                                </div>
                              </div>
                            </div>
                            <EmployeeStatusBadge status={emp.status} />
                          </div>

                          <div style={{ borderTop: '1px solid var(--neutral-100, #f1f5f9)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--neutral-700, #334155)' }}>
                              {emp.designation || 'Staff'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontSize: '0.6875rem',
                                  padding: '2px 6px',
                                  backgroundColor: 'var(--neutral-100, #f1f5f9)',
                                  borderRadius: '4px',
                                  color: 'var(--neutral-600, #475569)',
                                }}
                              >
                                {emp.department}
                              </span>

                              <span style={{ fontSize: '0.75rem', color: 'var(--primary-600, #4f46e5)', fontWeight: 500 }}>
                                Profile →
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
