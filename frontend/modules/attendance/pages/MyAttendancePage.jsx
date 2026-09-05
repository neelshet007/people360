import React, { useState, useEffect } from 'react';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import { attendanceApi } from '../api/attendanceApi';
import { getStoredUser } from '../../../lib/auth';
import Toast from '../../../components/feedback/Toast';
import { LogInIcon, LogOutIcon, ClockIcon } from '../../../components/ui/Icons';

/**
 * My Attendance Page — Phase 5
 * Employee self-service: view own attendance history with month/year filter.
 */
export default function MyAttendancePage() {
  const user = getStoredUser();
  const now = new Date();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [toast, setToast] = useState(null);

  // Active state for the summary card
  const [activeState, setActiveState] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.getMyHistory({ month, year });
      setRecords(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchActive = async () => {
    try {
      const res = await attendanceApi.getActive();
      setActiveState(res.data);
      if (res.data?.isCheckedIn && res.data?.checkInTime) {
        const elapsed = Math.floor((Date.now() - new Date(res.data.checkInTime).getTime()) / 1000);
        setElapsedSeconds(elapsed > 0 ? elapsed : 0);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchHistory();
    fetchActive();
  }, [month, year]);

  // Live timer
  useEffect(() => {
    if (!activeState?.isCheckedIn) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [activeState?.isCheckedIn]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceApi.checkIn();
      await fetchActive();
      await fetchHistory();
      showToast('✅ Checked in successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to check in. Please try again.', 'danger');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await attendanceApi.checkOut();
      await fetchActive();
      await fetchHistory();
      showToast('✅ Checked out successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to check out. Please try again.', 'danger');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(typeof d === 'string' && !d.includes('T') ? d + 'T12:00:00Z' : d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatHoursNum = (n) => {
    const num = parseFloat(n || 0);
    return `${num.toFixed(2)} hrs`;
  };

  const monthOptions = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const yearOptions = [2024, 2025, 2026, 2027].map((y) => ({ value: String(y), label: String(y) }));

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{formatDate(row.date)}</span>
      ),
    },
    {
      header: 'Check In',
      accessor: 'clock_in',
      render: (row) => <span style={{ fontSize: '0.8125rem' }}>{formatTime(row.clock_in)}</span>,
    },
    {
      header: 'Check Out',
      accessor: 'clock_out',
      render: (row) => <span style={{ fontSize: '0.8125rem' }}>{formatTime(row.clock_out)}</span>,
    },
    {
      header: 'Worked',
      accessor: 'total_hours',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
          {formatHoursNum(row.total_hours)}
        </span>
      ),
    },
    {
      header: 'Expected',
      accessor: 'expected_hours',
      render: (row) => (
        <span style={{ color: 'var(--neutral-500)', fontSize: '0.8125rem' }}>
          {formatHoursNum(row.expected_hours)}
        </span>
      ),
    },
    {
      header: 'Difference',
      accessor: 'difference_hours',
      render: (row) => {
        const diff = parseFloat(row.difference_hours || 0);
        const color = diff >= 0 ? '#10b981' : '#ef4444';
        return (
          <span style={{ fontWeight: 600, color, fontSize: '0.8125rem' }}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(2)} hrs
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <AttendanceStatusBadge status={row.status} />,
    },
  ];

  const isCheckedIn = activeState?.isCheckedIn;

  return (
    <PageContainer
      title="My Attendance"
      subtitle={`${user?.name || 'Employee'} — Personal attendance records and session management`}
    >
      {/* ── Today's Status Card ── */}
      <Card
        style={{
          marginBottom: '20px',
          backgroundColor: isCheckedIn ? 'var(--success-50, #f0fdf4)' : 'var(--bg-surface, #ffffff)',
          border: isCheckedIn ? '1px solid var(--success-200, #bbf7d0)' : '1px solid var(--border-subtle, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isCheckedIn ? 'var(--success-600, #16a34a)' : 'var(--neutral-400, #94a3b8)',
                  boxShadow: isCheckedIn ? '0 0 0 3px rgba(22, 163, 74, 0.2)' : 'none',
                }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: isCheckedIn ? 'var(--success-800, #166534)' : 'var(--neutral-800, #1e293b)' }}>
                {isCheckedIn ? 'Currently Checked In' : (activeState?.checkInTime ? 'Checked Out' : 'Not Checked In Today')}
              </span>
            </div>
            {isCheckedIn && (
              <div style={{ fontSize: '0.875rem', color: 'var(--success-700, #15803d)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <ClockIcon size={14} color="var(--success-600, #16a34a)" />
                Since {formatTime(activeState?.checkInTime)} • Active Shift:{' '}
                <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatElapsed(elapsedSeconds)}</strong>
              </div>
            )}
            {!isCheckedIn && activeState?.checkInTime && (
              <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)', marginTop: '4px' }}>
                {formatTime(activeState.checkInTime)} — {formatTime(activeState.checkOutTime)} •{' '}
                Worked: <strong>{parseFloat(activeState.workedHours || 0).toFixed(2)} hrs</strong>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isCheckedIn && !activeState?.checkInTime && (
              <Button variant="primary" loading={checkingIn} onClick={handleCheckIn} disabled={checkingIn} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <LogInIcon size={16} /> Check In
              </Button>
            )}
            {isCheckedIn && (
              <Button
                variant="danger"
                loading={checkingOut}
                onClick={handleCheckOut}
                disabled={checkingOut}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOutIcon size={16} /> Check Out
              </Button>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {/* ── Filters ── */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-700)' }}>Filter:</div>
          <div style={{ width: '160px' }}>
            <Select
              options={monthOptions}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div style={{ width: '110px' }}>
            <Select
              options={yearOptions}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
            {records.length} record{records.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* ── History Table ── */}
      <Card noPadding>
        {loading ? (
          <Loading message="Loading attendance records..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            description="Your attendance records will appear here once you start checking in."
          />
        ) : (
          <Table columns={columns} data={records} />
        )}
      </Card>

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageContainer>
  );
}
