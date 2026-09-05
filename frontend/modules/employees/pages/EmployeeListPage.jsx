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
import EmployeeStatusBadge from '../components/EmployeeStatusBadge';
import { useEmployees } from '../hooks/useEmployees';
import { formatDate } from '../../../lib/utils';

/**
 * Employee Directory List Page
 * Owner: P1 (Core HR)
 */
export default function EmployeeListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

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
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.name || 'Unnamed Employee';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar name={fullName} size="sm" />
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
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--neutral-700, #334155)' }}>
          {row.employee_code || `EMP-${row.id}`}
        </span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => row.department || row.dept || '-',
    },
    {
      header: 'Job Title / Role',
      accessor: 'designation',
      render: (row) => row.designation || row.job_title || row.role || '-',
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
      width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Employees Directory"
      subtitle="Core workforce records, personal details, and employment statuses"
      actions={
        <Button
          variant="primary"
          icon="➕"
          onClick={() => navigate('/employees/new')}
        >
          Add Employee
        </Button>
      }
    >
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
            leftIcon="🔍"
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
              icon="➕"
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
    </PageContainer>
  );
}
