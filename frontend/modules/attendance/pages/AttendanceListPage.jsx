import React, { useState, useEffect } from 'react';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import attendanceApi from '../api/attendanceApi';
import employeesApi from '../../employees/api/employeesApi';

/**
 * Attendance List Page
 * Owner: P2 (HR Operations)
 * Foundation view for daily presence logs and working shift tracking
 */
export default function AttendanceListPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Log Attendance Modal State
  const [showModal, setShowModal] = useState(false);
  const [logging, setLogging] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [newAttendance, setNewAttendance] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: new Date().toISOString().slice(0, 16),
    clock_out: '',
    total_hours: '8.0',
    status: 'PRESENT',
    notes: '',
  });

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await attendanceApi.getAttendance(params);
      setRecords(res.data || []);
      if (res.meta) {
        setPagination(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [pagination.page, statusFilter, dateFilter]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await employeesApi.getEmployees({ limit: 100 });
        setEmployees(res.data || []);
      } catch (err) {
        // ignore
      }
    }
    loadEmployees();
  }, []);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!newAttendance.employee_id || !newAttendance.date) {
      setModalError('Please select an employee and attendance date');
      return;
    }
    setLogging(true);
    setModalError(null);
    try {
      await attendanceApi.recordAttendance({
        ...newAttendance,
        clock_in: newAttendance.clock_in ? new Date(newAttendance.clock_in).toISOString() : null,
        clock_out: newAttendance.clock_out ? new Date(newAttendance.clock_out).toISOString() : null,
        total_hours: parseFloat(newAttendance.total_hours || 0),
      });
      setShowModal(false);
      setNewAttendance({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        clock_in: new Date().toISOString().slice(0, 16),
        clock_out: '',
        total_hours: '8.0',
        status: 'PRESENT',
        notes: '',
      });
      fetchAttendance();
    } catch (err) {
      setModalError(err.message || 'Failed to record attendance');
    } finally {
      setLogging(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PRESENT', label: 'Present' },
    { value: 'ABSENT', label: 'Absent' },
    { value: 'LATE', label: 'Late' },
    { value: 'HALF_DAY', label: 'Half Day' },
    { value: 'ON_LEAVE', label: 'On Leave' },
  ];

  const columns = [
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
      header: 'Date',
      accessor: 'date',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-700, #334155)' }}>
          {row.date ? String(row.date).split('T')[0] : '—'}
        </span>
      ),
    },
    {
      header: 'Clock-In',
      accessor: 'clock_in',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem' }}>
          {row.clock_in ? new Date(row.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Clock-Out',
      accessor: 'clock_out',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem' }}>
          {row.clock_out ? new Date(row.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Worked Hours',
      accessor: 'total_hours',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>
          {parseFloat(row.total_hours || 0).toFixed(1)} hrs
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <AttendanceStatusBadge status={row.status} />,
    },
  ];

  return (
    <PageContainer
      title="Attendance"
      subtitle="Owner: P2 — HR Operations • Daily shift presence, check-in timestamps, and hours tracking"
      actions={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Record Attendance
        </Button>
      }
    >
      {error && (
        <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '200px' }}>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filter Status"
            />
          </div>
          <div style={{ width: '180px' }}>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter Date"
            />
          </div>
          {dateFilter && (
            <Button variant="secondary" size="sm" onClick={() => setDateFilter('')}>
              Clear Date
            </Button>
          )}
          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)' }}>
            Total Logs: <strong>{pagination.total}</strong>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card noPadding>
        {loading ? (
          <Loading message="Loading attendance records..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            description="Daily employee work check-in logs and presence records will appear here."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                Record Attendance
              </Button>
            }
          />
        ) : (
          <>
            <Table columns={columns} data={records} />
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

      {/* Record Attendance Modal */}
      {showModal && (
        <Modal
          title="Record Daily Attendance"
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={logging} onClick={handleLogSubmit}>
                Save Log
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
            <Select
              label="Select Employee"
              required
              options={[
                { value: '', label: 'Select an employee...' },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.display_name || `${e.first_name} ${e.last_name}`} (${e.employee_code})`,
                })),
              ]}
              value={newAttendance.employee_id}
              onChange={(e) => setNewAttendance((prev) => ({ ...prev, employee_id: e.target.value }))}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Date"
                type="date"
                required
                value={newAttendance.date}
                onChange={(e) => setNewAttendance((prev) => ({ ...prev, date: e.target.value }))}
              />
              <Select
                label="Attendance Status"
                options={[
                  { value: 'PRESENT', label: 'Present' },
                  { value: 'LATE', label: 'Late' },
                  { value: 'HALF_DAY', label: 'Half Day' },
                  { value: 'ABSENT', label: 'Absent' },
                  { value: 'ON_LEAVE', label: 'On Leave' },
                ]}
                value={newAttendance.status}
                onChange={(e) => setNewAttendance((prev) => ({ ...prev, status: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Clock-In Time"
                type="datetime-local"
                value={newAttendance.clock_in}
                onChange={(e) => setNewAttendance((prev) => ({ ...prev, clock_in: e.target.value }))}
              />
              <Input
                label="Clock-Out Time"
                type="datetime-local"
                value={newAttendance.clock_out}
                onChange={(e) => setNewAttendance((prev) => ({ ...prev, clock_out: e.target.value }))}
              />
            </div>

            <Input
              label="Total Worked Hours"
              type="number"
              step="0.5"
              value={newAttendance.total_hours}
              onChange={(e) => setNewAttendance((prev) => ({ ...prev, total_hours: e.target.value }))}
            />
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
