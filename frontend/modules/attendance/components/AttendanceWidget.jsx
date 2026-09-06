import React, { useState, useEffect, useRef, useCallback } from 'react';
import { attendanceApi } from '../api/attendanceApi';
import { getStoredUser } from '../../../lib/auth';

/**
 * Attendance Quick Action Widget — Phase 5
 * Displays in the top navigation. Shows check-in/out status with live timer.
 * Restores state from /api/attendance/active on mount/refresh.
 */
export default function AttendanceWidget() {
  const user = getStoredUser();

  // Only render for users with an employeeId linked
  if (!user || !user.employeeId) return null;

  const [state, setState] = useState(null); // null = loading
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const popupRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadActiveState = useCallback(async () => {
    try {
      const res = await attendanceApi.getActive();
      const data = res.data;
      setState(data);
      if (data?.isCheckedIn && data?.checkInTime) {
        const elapsed = Math.floor((Date.now() - new Date(data.checkInTime).getTime()) / 1000);
        setElapsedSeconds(elapsed > 0 ? elapsed : 0);
      } else {
        setElapsedSeconds(0);
      }
    } catch (_) {
      setState({ isCheckedIn: false });
    }
  }, []);

  useEffect(() => {
    loadActiveState();
  }, [loadActiveState]);

  // Live timer — only when checked in
  useEffect(() => {
    if (state?.isCheckedIn) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [state?.isCheckedIn]);

  // Close popup on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };
    if (showPopup) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showPopup]);

  const handleCheckIn = async () => {
    setLoading(true);
    showToast('Acquiring GPS location...', 'info');

    const doCheckIn = async (locationData = {}) => {
      try {
        const res = await attendanceApi.checkIn(locationData);
        await loadActiveState();
        const loc = res?.data?.location_status || res?.data?.location_verification_status;
        if (loc === 'OUTSIDE_RADIUS') {
          showToast('⚠️ Check-in recorded. Location warning: You are outside the configured workplace radius.', 'warning');
        } else if (loc === 'LOCATION_UNAVAILABLE') {
          showToast('✅ Check-in recorded (Location unavailable).', 'info');
        } else {
          showToast('✅ Checked in successfully! (Location verified)', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Unable to check in. Please try again.', 'danger');
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          doCheckIn({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          // Proceed without GPS if permission denied or slow
          doCheckIn({});
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      doCheckIn({});
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await attendanceApi.checkOut();
      await loadActiveState();
      showToast('✅ Checked out successfully!', 'success');
      setShowPopup(false);
    } catch (err) {
      showToast(err.message || 'Unable to check out. Please try again.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (h) => {
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  if (state === null) return null; // still loading

  const isCheckedIn = state?.isCheckedIn;

  const statusColor = isCheckedIn ? '#10b981' : '#94a3b8';
  const statusDot = isCheckedIn ? '🟢' : '🔴';

  return (
    <div style={{ position: 'relative' }} ref={popupRef}>
      {/* ── Compact Header Button ── */}
      <button
        type="button"
        onClick={() => setShowPopup((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '20px',
          border: `1.5px solid ${isCheckedIn ? '#10b98133' : '#e2e8f0'}`,
          backgroundColor: isCheckedIn ? '#f0fdf4' : '#f8fafc',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          color: 'var(--neutral-700, #334155)',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '0.75rem' }}>{statusDot}</span>
        {isCheckedIn ? (
          <span style={{ fontWeight: 600, color: '#10b981' }}>
            {formatElapsed(elapsedSeconds)}
          </span>
        ) : (
          <span style={{ color: 'var(--neutral-500)' }}>Check In</span>
        )}
      </button>

      {/* ── Popup Panel ── */}
      {showPopup && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            width: '280px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            border: '1px solid var(--neutral-200, #e2e8f0)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: isCheckedIn
                ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid var(--neutral-100)',
            }}
          >
            <div style={{ fontSize: '0.6875rem', color: 'var(--neutral-500)', marginBottom: '2px' }}>
              {isCheckedIn ? '● Active Session' : '● Not Checked In'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--neutral-900)' }}>
              Welcome back, {user.name?.split(' ')[0] || 'Employee'}!
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '14px 16px' }}>
            {isCheckedIn ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={statBoxStyle}>
                    <div style={statLabel}>Check-in</div>
                    <div style={statValue}>{formatTime(state.checkInTime)}</div>
                  </div>
                  <div style={statBoxStyle}>
                    <div style={statLabel}>Elapsed</div>
                    <div style={{ ...statValue, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                      {formatElapsed(elapsedSeconds)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '12px', textAlign: 'center' }}>
                  Worked hours will be saved when you check out
                </div>
                <button
                  onClick={handleCheckOut}
                  disabled={loading}
                  style={actionBtnStyle('#ef4444', loading)}
                >
                  {loading ? '⏳ Processing...' : '⏹ Check Out'}
                </button>
              </>
            ) : (
              <>
                {state.checkInTime && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div style={statBoxStyle}>
                        <div style={statLabel}>Check-in</div>
                        <div style={statValue}>{formatTime(state.checkInTime)}</div>
                      </div>
                      <div style={statBoxStyle}>
                        <div style={statLabel}>Check-out</div>
                        <div style={statValue}>{formatTime(state.checkOutTime)}</div>
                      </div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={statLabel}>Worked Today</div>
                      <div style={{ ...statValue, color: '#4f46e5' }}>
                        {formatHours(state.workedHours || 0)} hrs
                      </div>
                    </div>
                  </div>
                )}
                {!state.checkInTime && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--neutral-500)', marginBottom: '14px', textAlign: 'center' }}>
                    You haven't checked in today yet.
                  </div>
                )}
                <button
                  onClick={handleCheckIn}
                  disabled={loading}
                  style={actionBtnStyle('#4f46e5', loading)}
                >
                  {loading ? '⏳ Processing...' : (state.checkInTime ? '▶ Check In Again' : '▶ Check In')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            borderRadius: '8px',
            backgroundColor:
              toast.type === 'success' ? '#10b981' :
              toast.type === 'danger' ? '#ef4444' : '#1e293b',
            color: '#fff',
            fontWeight: 500,
            fontSize: '0.875rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const statBoxStyle = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '8px 10px',
};

const statLabel = {
  fontSize: '0.6875rem',
  color: 'var(--neutral-400, #94a3b8)',
  marginBottom: '2px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const statValue = {
  fontWeight: 700,
  fontSize: '0.9375rem',
  color: 'var(--neutral-900)',
};

const actionBtnStyle = (color, disabled) => ({
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: disabled ? '#e2e8f0' : color,
  color: disabled ? '#94a3b8' : '#ffffff',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s',
  letterSpacing: '0.02em',
});
