import React, { useState, useEffect, useCallback } from 'react';
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
import Toast from '../../../components/feedback/Toast';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import { attendanceApi } from '../api/attendanceApi';
import employeesApi from '../../employees/api/employeesApi';

/**
 * HR Attendance Management Page — Phase 5
 * Full search, filter, correction modal with recalculation.
 */
export default function AttendanceListPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Log attendance modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [newAttendance, setNewAttendance] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: '',
    clock_out: '',
    total_hours: '',
    status: 'PRESENT',
    notes: '',
  });

  // Correction modal
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [correctError, setCorrectError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correction, setCorrection] = useState({
    clock_in: '',
    clock_out: '',
    status: '',
    notes: '',
  });

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchFilter) params.search = searchFilter;

      const res = await attendanceApi.getAttendance(params);
      setRecords(res.data || []);
      if (res.meta) setPagination((prev) => ({ ...prev, ...res.meta }));
    } catch (err) {
      setError(err.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter, dateFilter, searchFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await employeesApi.getEmployees({ limit: 100 });
        setEmployees(res.data || []);
      } catch (_) {}
    }
    loadEmployees();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchFilter(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setStatusFilter('');
    setDateFilter('');
    setSearchFilter('');
    setSearchInput('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // ── Log attendance (HR manual) ──
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!newAttendance.employee_id || !newAttendance.date) {
      setLogError('Please select an employee and attendance date');
      return;
    }
    setLogging(true);
    setLogError(null);
    try {
      const payload = {
        ...newAttendance,
        clock_in: newAttendance.clock_in ? new Date(newAttendance.clock_in).toISOString() : null,
        clock_out: newAttendance.clock_out ? new Date(newAttendance.clock_out).toISOString() : null,
        total_hours: newAttendance.total_hours ? parseFloat(newAttendance.total_hours) : 0,
      };
      await attendanceApi.recordAttendance(payload);
      setShowLogModal(false);
      setNewAttendance({ employee_id: '', date: new Date().toISOString().split('T')[0], clock_in: '', clock_out: '', total_hours: '', status: 'PRESENT', notes: '' });
      fetchAttendance();
      showToast('Attendance record created', 'success');
    } catch (err) {
      setLogError(err.message || 'Failed to record attendance');
    } finally {
      setLogging(false);
    }
  };

  // ── Open correction modal ──
  const openCorrection = (record) => {
    setSelectedRecord(record);
    setCorrectError(null);
    const toLocal = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      // Format as datetime-local value: YYYY-MM-DDTHH:mm
      return d.toISOString().slice(0, 16);
    };
    setCorrection({
      clock_in: toLocal(record.clock_in),
      clock_out: toLocal(record.clock_out),
      status: record.status || 'PRESENT',
      notes: '',
    });
    setShowCorrectModal(true);
  };

  const handleCorrectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    // Validate: clock_out must be after clock_in if both provided
    if (correction.clock_in && correction.clock_out) {
      const inTime = new Date(correction.clock_in).getTime();
      const outTime = new Date(correction.clock_out).getTime();
      if (outTime <= inTime) {
        setCorrectError('Check-out time must be after check-in time');
        return;
      }
    }

    setCorrecting(true);
    setCorrectError(null);
    try {
      const payload = {};
      if (correction.clock_in) payload.clock_in = new Date(correction.clock_in).toISOString();
      if (correction.clock_out) payload.clock_out = new Date(correction.clock_out).toISOString();
      if (correction.status) payload.status = correction.status;
      if (correction.notes) payload.notes = correction.notes;

      await attendanceApi.correctAttendance(selectedRecord.id, payload);
      setShowCorrectModal(false);
      setSelectedRecord(null);
      fetchAttendance();
      showToast('Attendance corrected successfully', 'success');
    } catch (err) {
      setCorrectError(err.message || 'Failed to save correction');
    } finally {
      setCorrecting(false);
    }
  };

  const formatTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(typeof d === 'string' && !d.includes('T') ? d + 'T12:00:00Z' : d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PRESENT', label: 'Present' },
    { value: 'LATE', label: 'Late' },
    { value: 'ABSENT', label: 'Absent' },
    { value: 'HALF_DAY', label: 'Half Day' },
    { value: 'OVERTIME', label: 'Overtime' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'MISSING_CHECKOUT', label: 'Missing Checkout' },
  ];

  const correctionStatusOptions = [
    { value: 'PRESENT', label: 'Present' },
    { value: 'LATE', label: 'Late' },
    { value: 'ABSENT', label: 'Absent' },
    { value: 'HALF_DAY', label: 'Half Day' },
    { value: 'OVERTIME', label: 'Overtime' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'MISSING_CHECKOUT', label: 'Missing Checkout' },
  ];

  const columns = [
    {
      header: 'Employee',
      accessor: 'employee_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
            {row.employee_name || 'Unknown Employee'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
            {row.employee_code || ''}{row.department ? ` · ${row.department}` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-700)', fontWeight: 500 }}>
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      header: 'Clock In',
      accessor: 'clock_in',
      render: (row) => <span style={{ fontSize: '0.8125rem' }}>{formatTime(row.clock_in)}</span>,
    },
    {
      header: 'Clock Out',
      accessor: 'clock_out',
      render: (row) => <span style={{ fontSize: '0.8125rem' }}>{formatTime(row.clock_out)}</span>,
    },
    {
      header: 'Worked',
      accessor: 'total_hours',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{parseFloat(row.total_hours || 0).toFixed(2)} hrs</span>
      ),
    },
    {
      header: 'Expected',
      accessor: 'expected_hours',
      render: (row) => (
        <span style={{ color: 'var(--neutral-500)', fontSize: '0.8125rem' }}>
          {parseFloat(row.expected_hours || 8).toFixed(2)} hrs
        </span>
      ),
    },
    {
      header: 'Diff',
      accessor: 'difference_hours',
      render: (row) => {
        const diff = parseFloat(row.difference_hours || 0);
        return (
          <span style={{ fontWeight: 600, color: diff >= 0 ? '#10b981' : '#ef4444', fontSize: '0.8125rem' }}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(2)}h
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <AttendanceStatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openCorrection(row)}
          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
        >
          ✏️ Correct
        </Button>
      ),
    },
  ];

  const hasActiveFilters = statusFilter || dateFilter || searchFilter;

  return (
    <PageContainer
      title="Attendance Management"
      subtitle="HR Operations — View, search, filter and correct employee attendance records"
      actions={
        <Button variant="primary" onClick={() => setShowLogModal(true)}>
          + Log Attendance
        </Button>
      }
    >
      {error && (
        <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {/* ── Filter Toolbar ── */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Employee search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: '1 1 240px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', pointerEvents: 'none' }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Search employee name or code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--neutral-200, #e2e8f0)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Search</Button>
          </form>

          {/* Status filter */}
          <div style={{ width: '180px' }}>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          {/* Date filter */}
          <div style={{ width: '160px' }}>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Filter by date"
            />
          </div>

          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear ✕
            </Button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
            Total: <strong>{pagination.total}</strong>
          </div>
        </div>
      </Card>

      {/* ── Attendance Table ── */}
      <Card noPadding>
        {loading ? (
          <Loading message="Loading attendance records..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            description="Daily employee check-in logs will appear here. Try adjusting your filters."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowLogModal(true)}>
                Log Attendance
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

      {/* ── Manual Attendance Log Modal ── */}
      {showLogModal && (
        <Modal
          title="Log Attendance (HR)"
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowLogModal(false)}>Cancel</Button>
              <Button variant="primary" loading={logging} onClick={handleLogSubmit}>Save Log</Button>
            </>
          }
        >
          {logError && <Alert type="danger" style={{ marginBottom: '12px' }}>{logError}</Alert>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Select
              label="Employee"
              required
              options={[
                { value: '', label: 'Select employee...' },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.display_name || `${e.first_name} ${e.last_name}`} (${e.employee_code})`,
                })),
              ]}
              value={newAttendance.employee_id}
              onChange={(e) => setNewAttendance((prev) => ({ ...prev, employee_id: e.target.value }))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Date"
                type="date"
                required
                value={newAttendance.date}
                onChange={(e) => setNewAttendance((prev) => ({ ...prev, date: e.target.value }))}
              />
              <Select
                label="Status"
                options={correctionStatusOptions}
                value={newAttendance.status}
                onChange={(e) => setNewAttendance((prev) => ({ ...prev, status: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Clock In"
                type="datetime-local"
                value={newAttendance.clock_in}
                onChange={(e) => setNewAttendance((prev) => ({ ...prev, clock_in: e.target.value }))}
              />
              <Input
                label="Clock Out"
                type="datetime-local"
                value={newAttendance.clock_out}
                onChange={(e) => setNewAttendance((prev) => ({ ...prev, clock_out: e.target.value }))}
              />
            </div>
            <Input
              label="Notes"
              value={newAttendance.notes}
              onChange={(e) => setNewAttendance((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes..."
            />
          </div>
        </Modal>
      )}

      {/* ── Correction Modal ── */}
      {showCorrectModal && selectedRecord && (
        <Modal
          title="Correct Attendance Record"
          isOpen={showCorrectModal}
          onClose={() => setShowCorrectModal(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowCorrectModal(false)}>Cancel</Button>
              <Button variant="primary" loading={correcting} onClick={handleCorrectSubmit}>
                Save Correction
              </Button>
            </>
          }
        >
          {correctError && <Alert type="danger" style={{ marginBottom: '12px' }}>{correctError}</Alert>}

          {/* Record info */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '14px',
              fontSize: '0.8125rem',
              color: 'var(--neutral-600)',
            }}
          >
            <strong>{selectedRecord.employee_name || 'Employee'}</strong> —{' '}
            {formatDate(selectedRecord.date)} •{' '}
            Current: {formatTime(selectedRecord.clock_in)} → {formatTime(selectedRecord.clock_out)} •{' '}
            <AttendanceStatusBadge status={selectedRecord.status} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Clock In (corrected)"
                type="datetime-local"
                value={correction.clock_in}
                onChange={(e) => setCorrection((prev) => ({ ...prev, clock_in: e.target.value }))}
              />
              <Input
                label="Clock Out (corrected)"
                type="datetime-local"
                value={correction.clock_out}
                onChange={(e) => setCorrection((prev) => ({ ...prev, clock_out: e.target.value }))}
              />
            </div>
            <Select
              label="Override Status (optional)"
              options={[{ value: '', label: 'Auto-recalculate' }, ...correctionStatusOptions]}
              value={correction.status}
              onChange={(e) => setCorrection((prev) => ({ ...prev, status: e.target.value }))}
            />
            <Input
              label="Correction Notes"
              value={correction.notes}
              onChange={(e) => setCorrection((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Reason for correction (e.g. Employee forgot to check out)"
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', backgroundColor: '#fffbeb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fde68a' }}>
              ⚠️ Worked hours and difference will be automatically recalculated from the corrected times. An audit note will be appended to the record.
            </div>
          </div>
        </Modal>
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </PageContainer>
  );
}
