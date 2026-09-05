import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import EmptyState from '../../../components/feedback/EmptyState';
import ErrorState from '../../../components/feedback/ErrorState';
import ContractStatusBadge from '../components/ContractStatusBadge';
import { useContracts } from '../hooks/useContracts';
import { formatDate, formatCurrency } from '../../../lib/utils';

/**
 * Contracts List Page
 * Owner: P1 (Core HR)
 */
export default function ContractListPage() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const {
    contracts,
    loading,
    error,
    pagination,
    updateFilters,
    setPage,
    refetch,
  } = useContracts();

  const handleFilterChange = (status, type) => {
    setSelectedStatus(status);
    setSelectedType(type);
    updateFilters({ status, contract_type: type });
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'TERMINATED', label: 'Terminated' },
  ];

  const contractTypeOptions = [
    { value: 'Permanent Full-Time', label: 'Permanent Full-Time' },
    { value: 'Fixed Term', label: 'Fixed Term' },
    { value: 'Part-Time', label: 'Part-Time' },
    { value: 'Contractor', label: 'Contractor' },
    { value: 'Internship', label: 'Internship' },
  ];

  const columns = [
    {
      header: 'Contract Reference',
      render: (row) => (
        <Link
          to={`/contracts/${row.id}`}
          style={{ fontWeight: 600, color: 'var(--primary-700, #4338ca)' }}
        >
          {row.reference || `CNT-${row.id}`}
        </Link>
      ),
    },
    {
      header: 'Employee',
      render: (row) => {
        const empName = row.employee_name || `${row.employee?.first_name || ''} ${row.employee?.last_name || ''}`.trim() || `Employee #${row.employee_id || '-'}`;
        return (
          <div>
            <div style={{ fontWeight: 500, color: 'var(--neutral-900, #0f172a)' }}>{empName}</div>
            {row.employee_id && (
              <Link to={`/employees/${row.employee_id}`} style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
                View Employee Profile
              </Link>
            )}
          </div>
        );
      },
    },
    {
      header: 'Contract Type',
      accessor: 'contract_type',
      render: (row) => row.contract_type || 'Full-Time',
    },
    {
      header: 'Wage Rate',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {row.wage_rate ? formatCurrency(Number(row.wage_rate)) : '-'}
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 400, marginLeft: '4px' }}>
            / {row.wage_type || 'month'}
          </span>
        </span>
      ),
    },
    {
      header: 'Start Date',
      render: (row) => formatDate(row.start_date),
    },
    {
      header: 'End Date',
      render: (row) => (row.end_date ? formatDate(row.end_date) : 'Indefinite'),
    },
    {
      header: 'Status',
      render: (row) => <ContractStatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/contracts/${row.id}`);
            }}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/contracts/${row.id}/edit`);
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
      title="Employment Contracts"
      subtitle="Define terms of employment, base wage rates, and link to working schedules"
      actions={
        <Button
          variant="primary"
          icon="➕"
          onClick={() => navigate('/contracts/new')}
        >
          New Contract
        </Button>
      }
    >
      {/* Filters */}
      <Card style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            alignItems: 'end',
          }}
        >
          <Select
            label="Contract Type"
            id="contract_type"
            options={contractTypeOptions}
            value={selectedType}
            onChange={(e) => handleFilterChange(selectedStatus, e.target.value)}
            placeholder="All Contract Types"
          />

          <Select
            label="Contract Status"
            id="status"
            options={statusOptions}
            value={selectedStatus}
            onChange={(e) => handleFilterChange(e.target.value, selectedType)}
            placeholder="All Statuses"
          />

          {(selectedStatus || selectedType) && (
            <div style={{ marginBottom: '12px' }}>
              <Button
                variant="secondary"
                onClick={() => handleFilterChange('', '')}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Main Content */}
      {error ? (
        <ErrorState
          title="Failed to load contracts"
          message={error}
          onRetry={refetch}
        />
      ) : contracts.length === 0 && !loading ? (
        <EmptyState
          title="No contracts found"
          description="Employment contracts define compensation terms and bind employees to work schedules. Create the first contract to begin."
          action={
            <Button
              variant="primary"
              icon="➕"
              onClick={() => navigate('/contracts/new')}
            >
              Issue New Contract
            </Button>
          }
        />
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Table
            columns={columns}
            data={contracts}
            loading={loading}
            onRowClick={(row) => navigate(`/contracts/${row.id}`)}
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
