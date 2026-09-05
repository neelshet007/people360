import React, { useState, useEffect } from 'react';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import Pagination from '../../../components/ui/Pagination';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import TimeOffStatusBadge from '../components/TimeOffStatusBadge';
import timeoffApi from '../api/timeoffApi';
import employeesApi from '../../employees/api/employeesApi';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircleIcon, XIcon, PlusIcon, SearchIcon, RefreshIcon, FilterIcon } from '../../../components/ui/Icons';

/**
 * Time Off Master Page
 * Owner: P2 (HR Operations)
 * Foundation view for Leave Requests, Allocations, and Policy Categories
 */
export default function TimeOffPage() {
  const { user, hasPermission } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const canApprove =
    user?.role === 'ADMIN' ||
    user?.role === 'HR_MANAGER' ||
    user?.role === 'HR_PAYROLL_MANAGER' ||
    hasPermission('timeoff.approve');

  const [activeTab, setActiveTab] = useState('requests');

  // Requests State
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [errorReqs, setErrorReqs] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [actionLoadingId, setActionLoadingId] = useState(null);


  // Types State
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // Allocations State & Filters
  const [allocations, setAllocations] = useState([]);
  const [loadingAllocs, setLoadingAllocs] = useState(false);
  const [errorAllocs, setErrorAllocs] = useState(null);
  const [balanceFilters, setBalanceFilters] = useState({
    search: '',
    department: '',
    time_off_type_id: '',
    balance_status: '',
    employment_status: '',
  });

  // Employees for Dropdowns
  const [employees, setEmployees] = useState([]);

  // Submit Request Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [detectedScheduleInfo, setDetectedScheduleInfo] = useState(null);
  const [newRequest, setNewRequest] = useState({
    employee_id: '',
    time_off_type_id: '',
    start_date: '',
    end_date: '',
    total_days: '1',
    reason: '',
  });

  const detectWorkingDays = async (startDate, endDate, empId) => {
    if (!startDate || !endDate) {
      setDetectedScheduleInfo(null);
      return;
    }
    const applicantId = isEmployee ? user?.employeeId : (empId || newRequest.employee_id);

    // Immediate client-side fallback calculation excluding Sat (6) and Sun (0)
    try {
      const s = new Date(startDate + 'T00:00:00');
      const e = new Date(endDate + 'T00:00:00');
      if (s <= e) {
        let count = 0;
        let c = new Date(s);
        while (c <= e) {
          const d = c.getDay();
          if (d !== 0 && d !== 6) count++;
          c.setDate(c.getDate() + 1);
        }
        setNewRequest((prev) => ({ ...prev, total_days: String(count) }));
      }
    } catch (err) {
      // ignore
    }

    // Authoritative backend schedule calculation
    try {
      const res = await timeoffApi.calculateWorkingDays({
        employee_id: applicantId,
        start_date: startDate,
        end_date: endDate,
      });
      if (res?.data) {
        setDetectedScheduleInfo(res.data);
        setNewRequest((prev) => ({ ...prev, total_days: String(res.data.working_days) }));
      }
    } catch (err) {
      console.warn('Live working days detection:', err.message);
    }
  };

  const fetchRequests = async () => {
    setLoadingReqs(true);
    setErrorReqs(null);
    try {
      const res = await timeoffApi.getRequests({ page: pagination.page, limit: pagination.limit });
      setRequests(res.data || []);
      if (res.meta) setPagination(res.meta);
    } catch (err) {
      setErrorReqs(err.message || 'Failed to load time off requests');
    } finally {
      setLoadingReqs(false);
    }
  };

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await timeoffApi.getTypes();
      setTypes(res.data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchAllocations = async (filtersToApply = balanceFilters) => {
    setLoadingAllocs(true);
    setErrorAllocs(null);
    try {
      const cleanParams = {};
      if (filtersToApply.search && filtersToApply.search.trim()) cleanParams.search = filtersToApply.search.trim();
      if (filtersToApply.department) cleanParams.department = filtersToApply.department;
      if (filtersToApply.time_off_type_id) cleanParams.time_off_type_id = filtersToApply.time_off_type_id;
      if (filtersToApply.balance_status) cleanParams.balance_status = filtersToApply.balance_status;
      if (filtersToApply.employment_status) cleanParams.employment_status = filtersToApply.employment_status;

      const res = await timeoffApi.getAllocations(cleanParams);
      setAllocations(res.data || []);
    } catch (err) {
      setErrorAllocs(err.message || 'Failed to load employee leave balances');
    } finally {
      setLoadingAllocs(false);
    }
  };

  const handleResetBalanceFilters = () => {
    const emptyFilters = {
      search: '',
      department: '',
      time_off_type_id: '',
      balance_status: '',
      employment_status: '',
    };
    setBalanceFilters(emptyFilters);
    fetchAllocations(emptyFilters);
  };

  useEffect(() => {
    if (activeTab !== 'allocations') return;
    const timer = setTimeout(() => {
      fetchAllocations(balanceFilters);
    }, 200);
    return () => clearTimeout(timer);
  }, [balanceFilters, activeTab]);

  const handleOpenModal = () => {
    setModalError(null);
    setDetectedScheduleInfo(null);
    setNewRequest({
      employee_id: isEmployee ? (user?.employeeId || '') : '',
      time_off_type_id: '',
      start_date: '',
      end_date: '',
      total_days: '1',
      reason: '',
    });
    setShowModal(true);
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoadingId(id);
    try {
      await timeoffApi.updateRequestStatus(id, { status });
      await fetchRequests();
      await fetchAllocations();
    } catch (err) {
      alert(err.message || `Failed to ${status.toLowerCase()} request`);
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchTypes();
    fetchAllocations();
  }, [pagination.page]);

  useEffect(() => {
    async function loadEmployees() {
      if (isEmployee) return; // Employee role only requests for self
      try {
        const res = await employeesApi.getEmployees({ limit: 100 });
        setEmployees(res.data || []);
      } catch (err) {
        // ignore
      }
    }
    loadEmployees();
  }, [isEmployee]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const applicantId = isEmployee ? user?.employeeId : newRequest.employee_id;
    if (!applicantId || !newRequest.time_off_type_id || !newRequest.start_date || !newRequest.end_date) {
      setModalError('Please complete all required fields');
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      await timeoffApi.createRequest({
        ...newRequest,
        employee_id: applicantId,
        total_days: parseFloat(newRequest.total_days || 1),
      });
      setShowModal(false);
      setNewRequest({
        employee_id: isEmployee ? (user?.employeeId || '') : '',
        time_off_type_id: '',
        start_date: '',
        end_date: '',
        total_days: '1',
        reason: '',
      });
      fetchRequests();
      fetchAllocations();
    } catch (err) {
      setModalError(err.message || 'Failed to submit time off request');
    } finally {
      setSubmitting(false);
    }
  };

  const requestColumns = [
    {
      header: 'Employee',
      accessor: 'employee_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>
            {row.employee_name || 'Staff Member'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>{row.employee_code}</div>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      accessor: 'leave_type_name',
      render: (row) => <span>{row.leave_type_name || 'Standard Leave'}</span>,
    },
    {
      header: 'Duration',
      accessor: 'dates',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem' }}>
          {row.start_date} → {row.end_date} (<strong>{row.total_days}d</strong>)
        </span>
      ),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-600, #475569)' }}>
          {row.reason || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <TimeOffStatusBadge status={row.status} />,
    },
    ...(canApprove
      ? [
          {
            header: 'HR Actions',
            accessor: 'actions',
            render: (row) => {
              if (row.status === 'PENDING') {
                const isLoading = actionLoadingId === row.id;
                return (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleUpdateStatus(row.id, 'APPROVED')}
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm, 6px)',
                        border: 'none',
                        backgroundColor: 'var(--success-600, #16a34a)',
                        color: '#ffffff',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'opacity 0.15s ease',
                      }}
                      title="Approve leave request"
                    >
                      <CheckCircleIcon size={13} /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleUpdateStatus(row.id, 'REJECTED')}
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm, 6px)',
                        border: '1px solid var(--danger-300, #fca5a5)',
                        backgroundColor: 'var(--danger-50, #fef2f2)',
                        color: 'var(--danger-700, #b91c1c)',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background-color 0.15s ease',
                      }}
                      title="Refuse leave request"
                    >
                      <XIcon size={13} /> Refuse
                    </button>
                  </div>
                );
              }
              return (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {row.status === 'APPROVED' ? <><CheckCircleIcon size={13} color="var(--success-600, #16a34a)" /> Approved</> : row.status === 'REJECTED' ? <><XIcon size={13} color="var(--danger-600, #dc2626)" /> Refused</> : '—'}
                </span>
              );
            },
          },
        ]
      : []),
  ];


  const typeColumns = [
    {
      header: 'Leave Type Name',
      accessor: 'name',
      render: (row) => (
        <div style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>{row.name}</div>
      ),
    },
    {
      header: 'Code',
      accessor: 'code',
      render: (row) => (
        <code style={{ fontSize: '0.8125rem', backgroundColor: 'var(--neutral-100, #f1f5f9)', padding: '2px 6px', borderRadius: '4px' }}>
          {row.code}
        </code>
      ),
    },
    {
      header: 'Paid Leave',
      accessor: 'is_paid',
      render: (row) => (
        <Badge variant={row.is_paid ? 'success' : 'neutral'}>
          {row.is_paid ? 'Paid' : 'Unpaid'}
        </Badge>
      ),
    },
    {
      header: 'Annual Allocation Cap',
      accessor: 'max_days_allowed',
      render: (row) => <span>{row.max_days_allowed} days/year</span>,
    },
  ];

  const departmentOptions = React.useMemo(() => {
    const deps = new Set();
    employees.forEach((e) => { if (e.department) deps.add(e.department); });
    allocations.forEach((a) => { if (a.department) deps.add(a.department); });
    return Array.from(deps).sort().map((d) => ({ value: d, label: d }));
  }, [employees, allocations]);

  const typeOptions = React.useMemo(() => {
    return types.map((t) => ({ value: t.id, label: t.name }));
  }, [types]);

  const balanceStatusOptions = [
    { value: 'HEALTHY', label: 'Healthy (> 3 days)' },
    { value: 'LOW', label: 'Low Balance (1–3 days)' },
    { value: 'EXHAUSTED', label: 'Exhausted (0 days)' },
    { value: 'OVERDRAWN', label: 'Overdrawn (< 0 days)' },
  ];

  const employmentStatusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'TERMINATED', label: 'Terminated' },
  ];

  const hasActiveBalanceFilters = Boolean(
    balanceFilters.search ||
    balanceFilters.department ||
    balanceFilters.time_off_type_id ||
    balanceFilters.balance_status ||
    balanceFilters.employment_status
  );

  const balanceColumns = [
    {
      header: 'Employee',
      accessor: 'employee_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
            {row.employee_name || 'Staff Member'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
            {row.employee_code || '—'}
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #334155)', fontWeight: 500 }}>
          {row.department || '—'}
        </span>
      ),
    },
    {
      header: 'Time Off Type',
      accessor: 'leave_type_name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-primary, #0f172a)' }}>
            {row.leave_type_name}
          </span>
          {row.leave_type_code && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--neutral-100, #f1f5f9)', color: 'var(--text-muted, #64748b)' }}>
              {row.leave_type_code}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Allocated',
      accessor: 'allocated_days',
      render: (row) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          {parseFloat(row.allocated_days || 0).toFixed(1)} d
        </span>
      ),
    },
    {
      header: 'Used',
      accessor: 'used_days',
      render: (row) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary, #475569)' }}>
          {parseFloat(row.used_days || 0).toFixed(1)} d
        </span>
      ),
    },
    {
      header: 'Pending',
      accessor: 'pending_days',
      render: (row) => {
        const p = parseFloat(row.pending_days || 0);
        return (
          <span style={{ fontVariantNumeric: 'tabular-nums', color: p > 0 ? 'var(--warning-700, #b45309)' : 'var(--text-muted, #94a3b8)', fontWeight: p > 0 ? 600 : 400 }}>
            {p > 0 ? `${p.toFixed(1)} d` : '0.0 d'}
          </span>
        );
      },
    },
    {
      header: 'Remaining',
      accessor: 'remaining_days',
      render: (row) => {
        const rem = parseFloat(row.remaining_days !== undefined ? row.remaining_days : (row.allocated_days - row.used_days) || 0);
        const color = rem > 3 ? 'var(--success-700, #15803d)' : rem > 0 ? 'var(--warning-700, #b45309)' : rem === 0 ? 'var(--text-muted, #64748b)' : 'var(--danger-700, #b91c1c)';
        return (
          <strong style={{ fontVariantNumeric: 'tabular-nums', color, fontSize: '0.875rem' }}>
            {rem.toFixed(1)} d
          </strong>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'balance_status',
      render: (row) => {
        const bs = (row.balance_status || 'HEALTHY').toUpperCase();
        const badgeVariant = bs === 'HEALTHY' ? 'success' : bs === 'LOW' ? 'warning' : bs === 'OVERDRAWN' ? 'danger' : 'neutral';
        const label = bs === 'HEALTHY' ? 'Healthy' : bs === 'LOW' ? 'Low Balance' : bs === 'OVERDRAWN' ? 'Overdrawn' : 'Exhausted';
        return <Badge variant={badgeVariant} dot>{label}</Badge>;
      },
    },
    {
      header: 'Employment',
      accessor: 'employment_status',
      render: (row) => {
        const st = (row.employment_status || 'ACTIVE').toUpperCase();
        const variant = st === 'ACTIVE' ? 'success' : st === 'ON_LEAVE' ? 'info' : 'neutral';
        return <Badge variant={variant}>{st.replace('_', ' ')}</Badge>;
      },
    },
  ];

  const tabs = [
    { id: 'requests', label: 'Leave Requests' },
    { id: 'types', label: 'Leave Types Catalog' },
    { id: 'allocations', label: 'Employee Balances' },
  ];

  return (
    <PageContainer
      title="Time Off"
      subtitle={
        isEmployee
          ? "My Time Off • Submit leave applications, check approval status, and monitor vacation balance"
          : "HR Operations • Vacation requests, sick leaves, and annual allocation quotas"
      }
      actions={
        <Button id="btn-request-timeoff" variant="primary" icon={<PlusIcon size={16} />} onClick={handleOpenModal}>
          Request Time Off
        </Button>
      }
    >
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} style={{ marginBottom: '20px' }} />

      {activeTab === 'requests' && (
        <>
          {errorReqs && (
            <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
              {errorReqs}
            </Alert>
          )}

          <Card noPadding>
            {loadingReqs ? (
              <Loading message="Loading leave applications..." />
            ) : requests.length === 0 ? (
              <EmptyState
                title="No time off requests found"
                description={
                  isEmployee
                    ? "You haven't submitted any leave applications yet. Click below to request time off."
                    : "Staff members have not submitted any active leave applications yet."
                }
                action={
                  <Button id="btn-request-timeoff-empty" variant="primary" size="sm" icon={<PlusIcon size={16} />} onClick={handleOpenModal}>
                    Request Time Off
                  </Button>
                }
              />

            ) : (
              <>
                <Table columns={requestColumns} data={requests} />
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
                />
              </>
            )}
          </Card>
        </>
      )}

      {activeTab === 'types' && (
        <Card noPadding>
          {loadingTypes ? (
            <Loading message="Loading leave policy catalog..." />
          ) : types.length === 0 ? (
            <EmptyState title="No leave categories found" description="Leave policies will be configured here." />
          ) : (
            <Table columns={typeColumns} data={types} />
          )}
        </Card>
      )}

      {activeTab === 'allocations' && (
        <>
          {/* Filter Toolbar */}
          <Card style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Search Employee
                </label>
                <Input
                  id="filter-balance-search"
                  placeholder="Name or employee code..."
                  value={balanceFilters.search}
                  onChange={(e) => setBalanceFilters((prev) => ({ ...prev, search: e.target.value }))}
                  leftIcon={<SearchIcon size={14} color="var(--text-muted, #94a3b8)" />}
                />
              </div>

              {!isEmployee && (
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Department
                  </label>
                  <Select
                    id="filter-balance-department"
                    placeholder="All Departments"
                    value={balanceFilters.department}
                    onChange={(e) => setBalanceFilters((prev) => ({ ...prev, department: e.target.value }))}
                    options={departmentOptions}
                  />
                </div>
              )}

              <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Time Off Type
                </label>
                <Select
                  id="filter-balance-type"
                  placeholder="All Leave Types"
                  value={balanceFilters.time_off_type_id}
                  onChange={(e) => setBalanceFilters((prev) => ({ ...prev, time_off_type_id: e.target.value }))}
                  options={typeOptions}
                />
              </div>

              <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Balance Status
                </label>
                <Select
                  id="filter-balance-status"
                  placeholder="All Statuses"
                  value={balanceFilters.balance_status}
                  onChange={(e) => setBalanceFilters((prev) => ({ ...prev, balance_status: e.target.value }))}
                  options={balanceStatusOptions}
                />
              </div>

              {!isEmployee && (
                <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Employment
                  </label>
                  <Select
                    id="filter-balance-employment"
                    placeholder="All Employment"
                    value={balanceFilters.employment_status}
                    onChange={(e) => setBalanceFilters((prev) => ({ ...prev, employment_status: e.target.value }))}
                    options={employmentStatusOptions}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                <Button
                  id="btn-reset-balance-filters"
                  variant="secondary"
                  disabled={!hasActiveBalanceFilters}
                  onClick={handleResetBalanceFilters}
                  style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshIcon size={14} /> Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Active Filters / Result Count Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #475569)' }}>
              Showing <strong>{allocations.length}</strong> {allocations.length === 1 ? 'leave quota' : 'leave quotas'}
              {hasActiveBalanceFilters && (
                <span style={{ color: 'var(--primary-600, #2563eb)', marginLeft: '6px', fontWeight: 600 }}>
                  • Filters Active
                </span>
              )}
            </div>
            {hasActiveBalanceFilters && (
              <button
                type="button"
                onClick={handleResetBalanceFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600, #2563eb)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Error Alert */}
          {errorAllocs && (
            <Alert type="danger" title="Failed to load employee balances" style={{ marginBottom: '16px' }}>
              {errorAllocs}
              <div style={{ marginTop: '8px' }}>
                <Button size="sm" variant="secondary" onClick={() => fetchAllocations(balanceFilters)}>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}

          {/* Balance Table Card */}
          <Card noPadding>
            {loadingAllocs ? (
              <Loading message="Filtering employee leave balances..." />
            ) : allocations.length === 0 ? (
              <EmptyState
                title={hasActiveBalanceFilters ? "No balances match selected filters" : "No leave quotas allocated"}
                description={
                  hasActiveBalanceFilters
                    ? "No employee leave quotas matched your active filter criteria. Try adjusting or resetting your filters."
                    : "Per-employee annual leave balances and quotas will be displayed here."
                }
                action={
                  hasActiveBalanceFilters ? (
                    <Button variant="secondary" size="sm" onClick={handleResetBalanceFilters} icon={<RefreshIcon size={14} />}>
                      Reset Filters
                    </Button>
                  ) : null
                }
              />
            ) : (
              <Table columns={balanceColumns} data={allocations} />
            )}
          </Card>
        </>
      )}

      {/* Submit Leave Request Modal */}
      {showModal && (
        <Modal
          title={isEmployee ? "Request My Time Off" : "Submit Time Off Application"}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={submitting} onClick={handleCreateSubmit}>
                Submit Application
              </Button>
            </>
          }
        >
          {modalError && (
            <Alert type="danger" style={{ marginBottom: '16px' }}>
              {modalError}
            </Alert>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isEmployee ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-700, #334155)', marginBottom: '6px' }}>
                  Applicant Employee
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--neutral-50, #f8fafc)',
                    border: '1px solid var(--neutral-300, #cbd5e1)',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.875rem',
                    color: 'var(--neutral-900, #0f172a)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤</span>
                    <span>{user?.name || 'Self'}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-700, #4338ca)', backgroundColor: 'var(--primary-50, #eef2ff)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {user?.employeeId || 'EMPLOYEE'}
                  </span>
                </div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px' }}>
                  Your leave application will be submitted for approval to the HR Manager.
                </span>
              </div>
            ) : (
              <Select
                label="Applicant Employee"
                required
                options={[
                  { value: '', label: 'Select employee...' },
                  ...employees.map((e) => ({
                    value: e.id,
                    label: `${e.display_name || `${e.first_name} ${e.last_name}`} (${e.employee_code})`,
                  })),
                ]}
                value={newRequest.employee_id}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewRequest((prev) => ({ ...prev, employee_id: val }));
                  if (newRequest.start_date && newRequest.end_date) {
                    detectWorkingDays(newRequest.start_date, newRequest.end_date, val);
                  }
                }}
              />
            )}

            <Select
              label="Leave Category"
              required
              options={[
                { value: '', label: 'Select category...' },
                ...types.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.code})${t.is_paid === false ? ' — Unpaid (Deducts Pay)' : ''}`,
                })),
              ]}
              value={newRequest.time_off_type_id}
              onChange={(e) => setNewRequest((prev) => ({ ...prev, time_off_type_id: e.target.value }))}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Start Date"
                type="date"
                required
                value={newRequest.start_date}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewRequest((prev) => ({ ...prev, start_date: val }));
                  if (val && newRequest.end_date) {
                    detectWorkingDays(val, newRequest.end_date, newRequest.employee_id);
                  }
                }}
              />
              <Input
                label="End Date"
                type="date"
                required
                value={newRequest.end_date}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewRequest((prev) => ({ ...prev, end_date: val }));
                  if (newRequest.start_date && val) {
                    detectWorkingDays(newRequest.start_date, val, newRequest.employee_id);
                  }
                }}
              />
            </div>

            <div>
              <Input
                label="Total Working Days"
                type="number"
                step="0.5"
                required
                value={newRequest.total_days}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, total_days: e.target.value }))}
              />
              {detectedScheduleInfo && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '8px 12px',
                    backgroundColor: detectedScheduleInfo.working_days > 0 ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${detectedScheduleInfo.working_days > 0 ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: detectedScheduleInfo.working_days > 0 ? '#166534' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{detectedScheduleInfo.working_days > 0 ? '✓' : '⚠️'}</span>
                  <span>
                    <strong>{detectedScheduleInfo.working_days} working day(s) detected</strong>
                    {detectedScheduleInfo.non_working_days > 0
                      ? ` (${detectedScheduleInfo.non_working_days} off-day(s) like Sat/Sun excluded per ${detectedScheduleInfo.schedule_name || 'work schedule'}).`
                      : ` (per ${detectedScheduleInfo.schedule_name || 'work schedule'}).`}
                  </span>
                </div>
              )}
            </div>

            <Textarea
              label="Reason / Notes"
              placeholder="e.g. Annual summer family vacation"
              value={newRequest.reason}
              onChange={(e) => setNewRequest((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
