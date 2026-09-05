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

  // Allocations State
  const [allocations, setAllocations] = useState([]);
  const [loadingAllocs, setLoadingAllocs] = useState(false);

  // Employees for Dropdowns
  const [employees, setEmployees] = useState([]);

  // Submit Request Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [newRequest, setNewRequest] = useState({
    employee_id: '',
    time_off_type_id: '',
    start_date: '',
    end_date: '',
    total_days: '1',
    reason: '',
  });

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

  const fetchAllocations = async () => {
    setLoadingAllocs(true);
    try {
      const res = await timeoffApi.getAllocations();
      setAllocations(res.data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoadingAllocs(false);
    }
  };

  const handleOpenModal = () => {

    setModalError(null);
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
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      title="Approve leave request"
                    >
                      ✓ Approve
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleUpdateStatus(row.id, 'REJECTED')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #ef4444',
                        backgroundColor: '#ffffff',
                        color: '#ef4444',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      title="Refuse leave request"
                    >
                      ✗ Refuse
                    </button>
                  </div>
                );
              }
              return (
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 500 }}>
                  {row.status === 'APPROVED' ? '✓ Approved' : row.status === 'REJECTED' ? '✗ Refused' : '—'}
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
        <Button id="btn-request-timeoff" variant="primary" onClick={handleOpenModal}>
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
                  <Button id="btn-request-timeoff-empty" variant="primary" size="sm" onClick={handleOpenModal}>
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
        <Card noPadding>
          {loadingAllocs ? (
            <Loading message="Loading employee leave quotas..." />
          ) : allocations.length === 0 ? (
            <EmptyState
              title="No leave quotas allocated"
              description="Per-employee annual leave balances and quotas will be displayed here."
            />
          ) : (
            <Table
              columns={[
                { header: 'Employee', accessor: 'employee_name' },
                { header: 'Leave Category', accessor: 'leave_type_name' },
                { header: 'Fiscal Year', accessor: 'year' },
                { header: 'Allocated Days', accessor: 'allocated_days' },
                { header: 'Used Days', accessor: 'used_days' },
              ]}
              data={allocations}
            />
          )}
        </Card>
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
                onChange={(e) => setNewRequest((prev) => ({ ...prev, employee_id: e.target.value }))}
              />
            )}


            <Select
              label="Leave Category"
              required
              options={[
                { value: '', label: 'Select category...' },
                ...types.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.code})`,
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
                onChange={(e) => setNewRequest((prev) => ({ ...prev, start_date: e.target.value }))}
              />
              <Input
                label="End Date"
                type="date"
                required
                value={newRequest.end_date}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, end_date: e.target.value }))}
              />
            </div>

            <Input
              label="Total Working Days"
              type="number"
              step="0.5"
              required
              value={newRequest.total_days}
              onChange={(e) => setNewRequest((prev) => ({ ...prev, total_days: e.target.value }))}
            />

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
