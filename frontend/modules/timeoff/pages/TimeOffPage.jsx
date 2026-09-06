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
import { CheckCircleIcon, XIcon, PlusIcon, SearchIcon, RefreshIcon, FilterIcon, MessageSquareIcon, EditIcon } from '../../../components/ui/Icons';
import RaiseConcernModal from '../../concerns/components/RaiseConcernModal';

/**
 * Time Off Master Page
 * Owner: P2 (HR Operations)
 * Foundation view for Leave Requests, Allocations, and Policy Categories
 */
export default function TimeOffPage() {
  const { user, role, hasPermission } = useAuth();
  const currentRole = (role || user?.role || '').toUpperCase();
  const isEmployee = currentRole === 'EMPLOYEE';
  const canApprove =
    currentRole === 'ADMIN' ||
    currentRole === 'HR_MANAGER' ||
    currentRole === 'HR_PAYROLL_MANAGER' ||
    currentRole === 'HR_PAYROLL_USER' ||
    hasPermission('timeoff.approve');
  const canManageTypes =
    currentRole === 'ADMIN' ||
    currentRole === 'HR_MANAGER' ||
    currentRole === 'HR_PAYROLL_MANAGER' ||
    hasPermission('timeoff.write');

  const formatCleanDate = (dStr) => {
    if (!dStr) return '—';
    const clean = dStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[month - 1]} ${day}, ${year}`;
    }
    return clean;
  };

  const [activeTab, setActiveTab] = useState('requests');

  // Requests State
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [errorReqs, setErrorReqs] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [actionLoadingId, setActionLoadingId] = useState(null);


  // Types State & Catalogue Management
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [savingType, setSavingType] = useState(false);
  const [typeModalError, setTypeModalError] = useState(null);
  const [typeForm, setTypeForm] = useState({
    name: '',
    code: '',
    description: '',
    is_paid: true,
    allocation_method: 'FIXED_ANNUAL',
    annual_allocation: '12',
    requires_approval: true,
    allow_employee_request: true,
    allow_half_day: true,
    carry_forward_allowed: false,
    carry_forward_limit: '0',
    is_active: true,
  });

  // Comp Off Live Balance State for Request Modal
  const [employeeCompOffBal, setEmployeeCompOffBal] = useState(null);
  const [loadingCompOffBal, setLoadingCompOffBal] = useState(false);

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

  const [concernModalConfig, setConcernModalConfig] = useState({ isOpen: false, row: null });

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
      console.error('Failed to fetch leave types:', err);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleOpenCreateType = () => {
    setEditingType(null);
    setTypeForm({
      name: '',
      code: '',
      description: '',
      is_paid: true,
      allocation_method: 'FIXED_ANNUAL',
      annual_allocation: '12',
      requires_approval: true,
      allow_employee_request: true,
      allow_half_day: true,
      carry_forward_allowed: false,
      carry_forward_limit: '0',
      is_active: true,
    });
    setTypeModalError(null);
    setShowTypeModal(true);
  };

  const handleOpenEditType = (t) => {
    setEditingType(t);
    setTypeForm({
      name: t.name || '',
      code: t.code || '',
      description: t.description || '',
      is_paid: t.is_paid !== false,
      allocation_method: t.allocation_method || 'FIXED_ANNUAL',
      annual_allocation: t.annual_allocation !== null && t.annual_allocation !== undefined ? String(t.annual_allocation) : '',
      requires_approval: t.requires_approval !== false,
      allow_employee_request: t.allow_employee_request !== false,
      allow_half_day: t.allow_half_day !== false,
      carry_forward_allowed: Boolean(t.carry_forward_allowed),
      carry_forward_limit: String(t.carry_forward_limit || '0'),
      is_active: t.is_active !== false,
    });
    setTypeModalError(null);
    setShowTypeModal(true);
  };

  const handleToggleTypeStatus = async (t) => {
    try {
      await timeoffApi.updateType(t.id, { is_active: !t.is_active });
      await fetchTypes();
    } catch (err) {
      alert('Failed to update leave type status: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim() || !typeForm.code.trim()) {
      setTypeModalError('Leave type Name and unique Code are required.');
      return;
    }
    setSavingType(true);
    setTypeModalError(null);
    try {
      const isEarnedOrUnlimited = typeForm.allocation_method === 'EARNED' || typeForm.allocation_method === 'UNLIMITED';
      const payload = {
        name: typeForm.name.trim(),
        code: typeForm.code.trim().toUpperCase(),
        description: typeForm.description,
        is_paid: Boolean(typeForm.is_paid),
        allocation_method: typeForm.allocation_method,
        annual_allocation: isEarnedOrUnlimited ? null : (typeForm.annual_allocation ? parseFloat(typeForm.annual_allocation) : null),
        requires_approval: Boolean(typeForm.requires_approval),
        allow_employee_request: Boolean(typeForm.allow_employee_request),
        allow_half_day: Boolean(typeForm.allow_half_day),
        carry_forward_allowed: Boolean(typeForm.carry_forward_allowed),
        carry_forward_limit: typeForm.carry_forward_allowed ? parseFloat(typeForm.carry_forward_limit || 0) : 0,
        is_active: Boolean(typeForm.is_active),
      };

      if (editingType) {
        await timeoffApi.updateType(editingType.id, payload);
      } else {
        await timeoffApi.createType(payload);
      }
      setShowTypeModal(false);
      await fetchTypes();
    } catch (err) {
      setTypeModalError(err.response?.data?.error?.message || err.message);
    } finally {
      setSavingType(false);
    }
  };

  // Watch for Comp Off selection in Leave Request modal to fetch live available balance
  useEffect(() => {
    const selectedType = types.find((t) => t.id === newRequest.time_off_type_id);
    const targetEmpId = isEmployee ? user?.employeeId : newRequest.employee_id;
    if (selectedType && (selectedType.allocation_method === 'EARNED' || selectedType.code === 'COMP_OFF') && targetEmpId) {
      setLoadingCompOffBal(true);
      timeoffApi.getCompOffBalance(targetEmpId)
        .then((res) => {
          setEmployeeCompOffBal(res.data?.data || res.data || null);
        })
        .catch(() => setEmployeeCompOffBal(null))
        .finally(() => setLoadingCompOffBal(false));
    } else {
      setEmployeeCompOffBal(null);
    }
  }, [newRequest.time_off_type_id, newRequest.employee_id, isEmployee, user, types]);

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

    const selectedType = types.find((t) => t.id === newRequest.time_off_type_id);
    const reqDays = parseFloat(newRequest.total_days || 1);
    if (selectedType && (selectedType.allocation_method === 'EARNED' || selectedType.code === 'COMP_OFF')) {
      const available = employeeCompOffBal ? parseFloat(employeeCompOffBal.available_days || 0) : 0;
      if (reqDays > available) {
        setModalError(`Insufficient Compensatory Off balance. You requested ${reqDays} day(s) but have only ${available} day(s) available.`);
        return;
      }
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
        <span style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
          {formatCleanDate(row.start_date)} → {formatCleanDate(row.end_date)}{' '}
          <strong style={{ color: 'var(--text-main, #0f172a)' }}>({row.total_days}d</strong>)
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
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => {
        const isLoading = actionLoadingId === row.id;
        const isOwner = user?.employeeId && row.employee_id === user.employeeId;

        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 1. APPROVAL / REJECTION BUTTONS FOR MANAGERS */}
            {canApprove && row.status === 'PENDING' && (
              <>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleUpdateStatus(row.id, 'APPROVED')}
                  style={{
                    padding: '5px 11px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--success-600, #16a34a)',
                    color: '#ffffff',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
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
                    padding: '5px 11px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--danger-300, #fca5a5)',
                    backgroundColor: 'var(--danger-50, #fef2f2)',
                    color: 'var(--danger-700, #b91c1c)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'background-color 0.15s ease',
                  }}
                  title="Reject leave request"
                >
                  <XIcon size={13} /> Reject
                </button>
              </>
            )}

            {/* 2. CANCEL BUTTON FOR EMPLOYEES ON THEIR OWN PENDING LEAVE */}
            {!canApprove && isOwner && row.status === 'PENDING' && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleUpdateStatus(row.id, 'CANCELLED')}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid var(--neutral-300, #cbd5e1)',
                  backgroundColor: '#ffffff',
                  color: 'var(--neutral-700, #334155)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Cancel my pending leave request"
              >
                <XIcon size={13} /> Cancel
              </button>
            )}

            {/* 3. RAISE CONCERN BUTTON */}
            <button
              type="button"
              onClick={() =>
                setConcernModalConfig({
                  isOpen: true,
                  row,
                })
              }
              style={{
                background: '#ffffff',
                border: '1px solid var(--neutral-200, #e2e8f0)',
                borderRadius: '6px',
                padding: '4px 9px',
                fontSize: '0.75rem',
                color: 'var(--primary-700, #4338ca)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-400, #818cf8)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--neutral-200, #e2e8f0)')}
              title="Raise HR concern or clarification regarding this leave"
            >
              <MessageSquareIcon size={12} color="var(--primary-600, #4f46e5)" /> Raise Concern
            </button>
          </div>
        );
      },
    },
  ];


  const typeColumns = [
    {
      header: 'Leave Type Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{row.name}</div>
          {row.description && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', maxWidth: '280px', lineHeight: '1.3', marginTop: '2px' }}>
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Code',
      accessor: 'code',
      render: (row) => (
        <code style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--neutral-100, #f1f5f9)', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em' }}>
          {row.code}
        </code>
      ),
    },
    {
      header: 'Pay Type',
      accessor: 'is_paid',
      render: (row) => (
        <Badge variant={row.is_paid ? 'success' : 'warning'}>
          {row.is_paid ? 'Paid' : 'Unpaid (LWP)'}
        </Badge>
      ),
    },
    {
      header: 'Allocation Model',
      accessor: 'allocation_method',
      render: (row) => {
        const method = row.allocation_method || 'FIXED_ANNUAL';
        if (method === 'EARNED' || row.code === 'COMP_OFF') {
          return <Badge variant="primary">Earned (Extra Work)</Badge>;
        }
        if (method === 'UNLIMITED') {
          return <Badge variant="info">Unlimited / No Cap</Badge>;
        }
        if (method === 'MANUAL') {
          return <Badge variant="neutral">Manual Grant</Badge>;
        }
        if (method === 'ACCRUED_MONTHLY') {
          return <Badge variant="secondary">Accrued Monthly</Badge>;
        }
        return <Badge variant="neutral">Fixed Annual</Badge>;
      },
    },
    {
      header: 'Allocation Quota',
      accessor: 'annual_allocation',
      render: (row) => {
        if (row.allocation_method === 'EARNED' || row.code === 'COMP_OFF') {
          return (
            <span style={{ fontSize: '0.8125rem', color: 'var(--primary-700, #4338ca)', fontWeight: 600 }}>
              Earned via Attendance
            </span>
          );
        }
        if (row.allocation_method === 'UNLIMITED') {
          return <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>No Annual Limit</span>;
        }
        if (row.annual_allocation !== null && row.annual_allocation !== undefined) {
          return <span style={{ fontWeight: 600 }}>{row.annual_allocation} days/yr</span>;
        }
        return <span>{row.max_days_allowed || 0} days/yr</span>;
      },
    },
    {
      header: 'Policy Rules',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', color: 'var(--text-secondary, #475569)' }}>
          <span>{row.allow_employee_request !== false ? '✓ Employee Request' : '✗ Admin Only'}</span>
          <span>{row.allow_half_day !== false ? '✓ Half-Day Allowed' : '✗ Full Day Only'}</span>
          {row.carry_forward_allowed && (
            <span style={{ color: 'var(--primary-600, #4f46e5)', fontWeight: 500 }}>
              Carry Forward (max {row.carry_forward_limit || 0}d)
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active !== false ? 'success' : 'neutral'} dot>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    ...(canManageTypes
      ? [
          {
            header: 'Actions',
            render: (row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenEditType(row)}
                  style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <EditIcon size={12} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant={row.is_active !== false ? 'ghost' : 'secondary'}
                  onClick={() => handleToggleTypeStatus(row)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    color: row.is_active !== false ? 'var(--danger-600, #dc2626)' : 'var(--success-600, #16a34a)',
                  }}
                >
                  {row.is_active !== false ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ),
          },
        ]
      : []),
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
      header: 'Allocated / Earned',
      accessor: 'allocated_days',
      render: (row) => {
        const isEarned = row.allocation_method === 'EARNED' || row.leave_type_code === 'COMP_OFF';
        if (isEarned) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--primary-700, #4338ca)' }}>
                {parseFloat(row.allocated_days || 0).toFixed(1)} d
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--primary-600, #4f46e5)', fontWeight: 500 }}>
                Earned Entitlement
              </span>
            </div>
          );
        }
        if (row.allocation_method === 'UNLIMITED') {
          return (
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', fontStyle: 'italic' }}>
              Unlimited
            </span>
          );
        }
        return (
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {parseFloat(row.allocated_days || 0).toFixed(1)} d
          </span>
        );
      },
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
      header: 'Available',
      accessor: 'remaining_days',
      render: (row) => {
        const isEarned = row.allocation_method === 'EARNED' || row.leave_type_code === 'COMP_OFF';
        const rem = parseFloat(row.remaining_days !== undefined ? row.remaining_days : (row.allocated_days - row.used_days) || 0);
        const color = rem > 3 ? 'var(--success-700, #15803d)' : rem > 0 ? 'var(--warning-700, #b45309)' : rem === 0 ? 'var(--text-muted, #64748b)' : 'var(--danger-700, #b91c1c)';
        return (
          <div>
            <strong style={{ fontVariantNumeric: 'tabular-nums', color, fontSize: '0.875rem' }}>
              {rem.toFixed(1)} d
            </strong>
            {isEarned && (
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748b)' }}>
                Approved available
              </div>
            )}
          </div>
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
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                Time Off Type Catalogue
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary, #475569)' }}>
                Configure company leave categories, pay eligibility, allocation models (Fixed Annual, Earned Comp Off, Unlimited), and request policies.
              </p>
            </div>
            {canManageTypes && (
              <Button
                id="btn-create-timeoff-type"
                variant="primary"
                icon={<PlusIcon size={16} />}
                onClick={handleOpenCreateType}
              >
                Create Time Off Type
              </Button>
            )}
          </div>

          <Card noPadding>
            {loadingTypes ? (
              <Loading message="Loading leave policy catalog..." />
            ) : types.length === 0 ? (
              <EmptyState
                title="No leave categories found"
                description="Configure your organization's leave policies, compensatory off, and time off catalog here."
                action={
                  canManageTypes ? (
                    <Button variant="primary" size="sm" icon={<PlusIcon size={16} />} onClick={handleOpenCreateType}>
                      Create Time Off Type
                    </Button>
                  ) : null
                }
              />
            ) : (
              <Table columns={typeColumns} data={types} />
            )}
          </Card>
        </>
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
                ...types
                  .filter((t) => t.is_active !== false && (!isEmployee || t.allow_employee_request !== false))
                  .map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.code})${t.is_paid === false ? ' — Unpaid (Deducts Pay)' : ''}${t.allocation_method === 'EARNED' || t.code === 'COMP_OFF' ? ' — Earned Entitlement' : ''}`,
                  })),
              ]}
              value={newRequest.time_off_type_id}
              onChange={(e) => setNewRequest((prev) => ({ ...prev, time_off_type_id: e.target.value }))}
            />

            {/* Dynamic Leave Type Context Banner */}
            {(() => {
              const selectedType = types.find((t) => t.id === newRequest.time_off_type_id);
              if (!selectedType) return null;

              const isEarned = selectedType.allocation_method === 'EARNED' || selectedType.code === 'COMP_OFF';
              if (isEarned) {
                const avail = employeeCompOffBal ? parseFloat(employeeCompOffBal.available_days || 0) : 0;
                const reqDays = parseFloat(newRequest.total_days || 1);
                const hasEnough = avail >= reqDays;

                return (
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: hasEnough ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${hasEnough ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      color: hasEnough ? '#166534' : '#991b1b',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⭐</span> Compensatory Off Earned Balance
                      </span>
                      <span style={{ fontSize: '0.875rem' }}>
                        {loadingCompOffBal ? 'Fetching...' : `${avail} Day(s) Available`}
                      </span>
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '0.75rem', opacity: 0.9 }}>
                      Earned from extra work: <strong>{employeeCompOffBal?.earned_days || 0}d</strong> • Used: <strong>{employeeCompOffBal?.used_days || 0}d</strong> • Pending: <strong>{employeeCompOffBal?.pending_days || 0}d</strong>
                    </div>
                    {!hasEnough && (
                      <div style={{ marginTop: '6px', fontWeight: 600, color: '#dc2626' }}>
                        ⚠️ You requested {reqDays} day(s), which exceeds your available {avail} day(s). Comp Off must be earned through approved extra work before use.
                      </div>
                    )}
                  </div>
                );
              }

              if (selectedType.is_paid === false) {
                return (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      color: '#92400e',
                    }}
                  >
                    ℹ️ <strong>Unpaid Leave (Leave Without Pay):</strong> This leave type does not provide paid time off. Approved absences will be deducted from your salary in payroll processing.
                  </div>
                );
              }

              return null;
            })()}

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

      {/* ── Create / Edit Time Off Type Modal ── */}
      {showTypeModal && (
        <Modal
          title={editingType ? `Edit Leave Type: ${editingType.name}` : "Create Configurable Time Off Type"}
          isOpen={showTypeModal}
          onClose={() => setShowTypeModal(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowTypeModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={savingType} onClick={handleSaveType}>
                {editingType ? 'Save Changes' : 'Create Time Off Type'}
              </Button>
            </>
          }
        >
          {typeModalError && (
            <Alert type="danger" style={{ marginBottom: '16px' }}>
              {typeModalError}
            </Alert>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <Input
                label="Time Off Type Name"
                placeholder="e.g. Compensatory Off, Casual Leave, Sabbatical"
                required
                value={typeForm.name}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                label="Code"
                placeholder="e.g. COMP, CL, SAB"
                required
                disabled={Boolean(editingType)}
                value={typeForm.code}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              />
            </div>

            <Textarea
              label="Description / Policy Note"
              placeholder="Explain policy eligibility, qualification criteria, and usage rules..."
              value={typeForm.description}
              onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Pay Configuration"
                required
                value={typeForm.is_paid ? 'true' : 'false'}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, is_paid: e.target.value === 'true' }))}
                options={[
                  { value: 'true', label: 'Paid Leave (No salary deduction)' },
                  { value: 'false', label: 'Unpaid Leave (Leave Without Pay / LWP)' },
                ]}
              />

              <Select
                label="Allocation Model"
                required
                value={typeForm.allocation_method}
                onChange={(e) => {
                  const val = e.target.value;
                  setTypeForm((prev) => ({
                    ...prev,
                    allocation_method: val,
                    annual_allocation: val === 'EARNED' || val === 'UNLIMITED' ? '' : (prev.annual_allocation || '12'),
                  }));
                }}
                options={[
                  { value: 'FIXED_ANNUAL', label: 'Fixed Annual Quota (e.g. 12 or 15 days/year)' },
                  { value: 'EARNED', label: 'Earned Entitlement (Comp Off from extra work / attendance)' },
                  { value: 'ACCRUED_MONTHLY', label: 'Accrued Monthly (e.g. 1 day/month)' },
                  { value: 'MANUAL', label: 'Manual Allocation (Granted ad-hoc by HR)' },
                  { value: 'UNLIMITED', label: 'Unlimited / No Fixed Allocation Cap' },
                ]}
              />
            </div>

            {/* Conditional Allocation Field or Policy Banner */}
            {typeForm.allocation_method === 'EARNED' ? (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  color: '#3730a3',
                }}
              >
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⭐ Earned Entitlement Architecture</span>
                </div>
                <div style={{ marginTop: '4px', lineHeight: '1.4' }}>
                  Fixed annual allocation is <strong>Not Applicable</strong>. Balance is earned dynamically when an employee works on non-working days (weekends/holidays) and the extra attendance claim is approved.
                </div>
              </div>
            ) : typeForm.allocation_method === 'UNLIMITED' ? (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  color: '#166534',
                }}
              >
                <div style={{ fontWeight: 600 }}>Unlimited Policy</div>
                <div style={{ marginTop: '4px' }}>
                  No fixed annual limit will be applied. Requests will be subject to managerial approval without fixed quota deduction.
                </div>
              </div>
            ) : (
              <div>
                <Input
                  label="Annual Allocation Quota (Days / Year)"
                  type="number"
                  step="0.5"
                  min="0"
                  required={typeForm.allocation_method === 'FIXED_ANNUAL'}
                  placeholder="e.g. 12"
                  value={typeForm.annual_allocation}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, annual_allocation: e.target.value }))}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Allow Employee Self-Request"
                value={typeForm.allow_employee_request ? 'true' : 'false'}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, allow_employee_request: e.target.value === 'true' }))}
                options={[
                  { value: 'true', label: 'Yes (Employee can request via portal)' },
                  { value: 'false', label: 'No (Restricted to HR / Admin assignment)' },
                ]}
              />

              <Select
                label="Allow Half-Day Request"
                value={typeForm.allow_half_day ? 'true' : 'false'}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, allow_half_day: e.target.value === 'true' }))}
                options={[
                  { value: 'true', label: 'Yes (0.5 day increments allowed)' },
                  { value: 'false', label: 'No (Full days only)' },
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Carry Forward to Next Year"
                value={typeForm.carry_forward_allowed ? 'true' : 'false'}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, carry_forward_allowed: e.target.value === 'true' }))}
                options={[
                  { value: 'false', label: 'No (Expires at year-end or policy reset)' },
                  { value: 'true', label: 'Yes (Unused balance carries forward)' },
                ]}
              />

              {typeForm.carry_forward_allowed && (
                <Input
                  label="Carry Forward Max Limit (Days)"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g. 5"
                  value={typeForm.carry_forward_limit}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, carry_forward_limit: e.target.value }))}
                />
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
              <input
                type="checkbox"
                id="type-status-active"
                checked={typeForm.is_active}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="type-status-active" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary, #0f172a)', cursor: 'pointer' }}>
                Active in Catalogue (Employees and HR can select this leave type)
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Contextual Raise Concern Modal ── */}
      {concernModalConfig.isOpen && (
        <RaiseConcernModal
          isOpen={concernModalConfig.isOpen}
          onClose={() => setConcernModalConfig({ isOpen: false, row: null })}
          initialCategory="TIME_OFF"
          initialRelatedType="TIME_OFF_REQUEST"
          initialRelatedId={concernModalConfig.row?.id}
          initialRelatedLabel={`Time Off Request: ${concernModalConfig.row?.leave_type_name || 'Leave'} (${concernModalConfig.row?.start_date} to ${concernModalConfig.row?.end_date})`}
          initialSubject={`Leave Request Inquiry: ${concernModalConfig.row?.leave_type_name || 'Leave'} (${concernModalConfig.row?.start_date} to ${concernModalConfig.row?.end_date})`}
          initialDescription={`Inquiry regarding time off request for ${concernModalConfig.row?.leave_type_name || 'Leave'}.\nRequested Period: ${concernModalConfig.row?.start_date} to ${concernModalConfig.row?.end_date} (${concernModalConfig.row?.total_days} days)\nCurrent Status: ${concernModalConfig.row?.status}\nReason Stated: ${concernModalConfig.row?.reason || 'None'}`}
          initialEmployeeId={concernModalConfig.row?.employee_id}
          onSuccess={() => fetchRequests()}
        />
      )}
    </PageContainer>
  );
}
