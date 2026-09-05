import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import Avatar from '../../../components/ui/Avatar';
import Pagination from '../../../components/ui/Pagination';
import EmptyState from '../../../components/feedback/EmptyState';
import ErrorState from '../../../components/feedback/ErrorState';
import ConfirmationDialog from '../../../components/feedback/ConfirmationDialog';
import Alert from '../../../components/feedback/Alert';
import EmployeeStatusBadge from '../components/EmployeeStatusBadge';
import { useEmployees } from '../hooks/useEmployees';
import employeesApi from '../api/employeesApi';
import { formatDate } from '../../../lib/utils';
import { SearchIcon, PlusIcon, TrashIcon, ListIcon, GridIcon } from '../../../components/ui/Icons';

/**
 * Employee Directory List Page
 * Owner: P1 (Core HR)
 */
export default function EmployeeListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Delete / Deactivate dialog state
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const {
    employees,
    loading,
    error,
    pagination,
    updateFilters,
    setPage,
    refetch,
  } = useEmployees();

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({
      search: searchTerm,
      department: selectedDept,
      status: selectedStatus,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedStatus('');
    updateFilters({ search: '', department: '', status: '' });
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await employeesApi.deleteEmployee(employeeToDelete.id);
      setActionSuccess(`Employee ${employeeToDelete.display_name || employeeToDelete.first_name} was deactivated.`);
      setEmployeeToDelete(null);
      refetch();
    } catch (err) {
      alert(err.message || 'Failed to deactivate employee.');
    } finally {
      setIsDeleting(false);
    }
  };

  const departmentOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  const columns = [
    {
      header: 'Employee',
      render: (row) => {
        const fullName = row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unnamed';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar name={fullName} size="sm" status={row.status === 'ACTIVE' ? 'online' : 'offline'} />
            <div>
              <Link
                to={`/employees/${row.id}`}
                style={{
                  fontWeight: 600,
                  color: 'var(--primary-700, #4338ca)',
                  fontSize: '0.875rem',
                  display: 'block',
                }}
              >
                {fullName}
              </Link>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
                {row.email || 'No email provided'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Code',
      accessor: 'employee_code',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--neutral-700, #334155)', fontWeight: 500 }}>
          {row.employee_code || `EMP-${row.id}`}
        </span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => row.department || '-',
    },
    {
      header: 'Job Title / Role',
      accessor: 'designation',
      render: (row) => row.designation || '-',
    },
    {
      header: 'Date of Joining',
      accessor: 'date_of_joining',
      render: (row) => formatDate(row.date_of_joining || row.created_at),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <EmployeeStatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      width: '140px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${row.id}`);
            }}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${row.id}/edit`);
            }}
          >
            Edit
          </Button>
          {row.status !== 'INACTIVE' && row.status !== 'TERMINATED' && (
            <button
              type="button"
              title="Deactivate Employee"
              onClick={(e) => {
                e.stopPropagation();
                setEmployeeToDelete(row);
              }}
              style={{
                border: '1px solid var(--border-subtle, #e2e8f0)',
                background: 'var(--bg-surface, #ffffff)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm, 6px)',
                color: 'var(--text-muted, #94a3b8)',
                padding: '5px 7px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--danger-600, #dc2626)';
                e.currentTarget.style.borderColor = 'var(--danger-300, #fca5a5)';
                e.currentTarget.style.backgroundColor = 'var(--danger-50, #fef2f2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
                e.currentTarget.style.borderColor = 'var(--border-subtle, #e2e8f0)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface, #ffffff)';
              }}
            >
              <TrashIcon size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Employees Directory"
      subtitle="Core workforce records, personal details, and employment statuses"
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
              variant="primary"
              size="sm"
              icon={<ListIcon size={14} />}
              style={{
                padding: '4px 10px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              List
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<GridIcon size={14} />}
              onClick={() => navigate('/employees/kanban')}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--neutral-600, #475569)',
                padding: '4px 10px',
              }}
            >
              Kanban
            </Button>
          </div>

          <Button
            variant="primary"
            icon={<PlusIcon size={16} />}
            onClick={() => navigate('/employees/new')}
          >
            Add Employee
          </Button>
        </div>
      }
    >
      {actionSuccess && (
        <Alert type="success" title="Action Completed">
          {actionSuccess}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <form
          onSubmit={handleSearch}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            alignItems: 'end',
          }}
        >
          <Input
            label="Search Directory"
            id="search"
            placeholder="Name, code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<SearchIcon size={16} />}
          />

          <Select
            label="Department"
            id="department"
            options={departmentOptions}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            placeholder="All Departments"
          />

          <Select
            label="Employment Status"
            id="status"
            options={statusOptions}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            placeholder="All Statuses"
          />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <Button type="submit" variant="primary" style={{ flex: 1 }}>
              Filter
            </Button>
            {(searchTerm || selectedDept || selectedStatus) && (
              <Button type="button" variant="secondary" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Main Content Area */}
      {error ? (
        <ErrorState
          title="Unable to load employees"
          message={error}
          onRetry={refetch}
        />
      ) : employees.length === 0 && !loading ? (
        <EmptyState
          title="No employees found"
          description={
            searchTerm || selectedDept || selectedStatus
              ? 'No employee records matched your filter criteria. Try resetting filters.'
              : 'Your workforce directory is empty. Get started by adding your first employee.'
          }
          action={
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={() => navigate('/employees/new')}
            >
              Add New Employee
            </Button>
          }
        />
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table
            columns={columns}
            data={employees}
            loading={loading}
            onRowClick={(row) => navigate(`/employees/${row.id}`)}
          />
          {pagination.total > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={setPage}
            />
          )}
        </Card>
      )}

      {/* Confirmation Dialog for Deactivation */}
      <ConfirmationDialog
        isOpen={Boolean(employeeToDelete)}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={confirmDelete}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${employeeToDelete?.display_name || employeeToDelete?.first_name}? Their status will be set to TERMINATED.`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </PageContainer>
  );
}
