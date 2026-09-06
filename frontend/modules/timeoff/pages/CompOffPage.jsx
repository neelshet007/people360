import React, { useState, useEffect, useCallback } from 'react';
import timeoffApi from '../api/timeoffApi';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../lib/auth';

/**
 * CompOffPage — Compensatory Off Management
 * Owner: P2 (HR Operations) — ExFeat
 *
 * - Employees: Raise comp-off claims, view own credits and balance, redeem via leave request
 * - HR: View all claims, approve / reject, see company-wide pending
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  PENDING:  { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  APPROVED: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  REJECTED: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  EXPIRED:  { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
  USED:     { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Raise Claim Modal ────────────────────────────────────────────────────────
function RaiseClaimModal({ onClose, onSuccess, isHR, employeeId }) {
  const [form, setForm] = useState({
    work_date: new Date().toISOString().split('T')[0],
    hours_worked: '8',
    reason: '',
    days_credited: '1',
    employee_id: employeeId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await timeoffApi.raiseCompOffClaim({
        ...form,
        hours_worked: parseFloat(form.hours_worked || 8),
        days_credited: parseFloat(form.days_credited || 1),
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 7,
    border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b',
    background: '#fff', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
          🕐 Raise Comp-Off Claim
        </h3>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isHR && (
            <div>
              <label style={labelStyle}>Employee ID</label>
              <input id="compoff-employee-id" style={inputStyle} value={form.employee_id}
                onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                placeholder="UUID of employee" required />
            </div>
          )}

          <div>
            <label style={labelStyle}>Work Date (date you worked extra) *</label>
            <input id="compoff-work-date" type="date" style={inputStyle} value={form.work_date}
              onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Hours Worked</label>
              <input id="compoff-hours" type="number" style={inputStyle} value={form.hours_worked}
                onChange={e => setForm(f => ({ ...f, hours_worked: e.target.value }))}
                min="1" max="16" step="0.5" />
            </div>
            <div>
              <label style={labelStyle}>Days to Credit</label>
              <select id="compoff-days" style={{ ...inputStyle, cursor: 'pointer' }} value={form.days_credited}
                onChange={e => setForm(f => ({ ...f, days_credited: e.target.value }))}>
                <option value="0.5">0.5 (Half Day)</option>
                <option value="1">1 (Full Day)</option>
                <option value="1.5">1.5 Days</option>
                <option value="2">2 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Reason *</label>
            <textarea id="compoff-reason" style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Worked on Diwali public holiday for product launch" required />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: 8, background: '#f1f5f9',
              color: '#475569', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Cancel</button>
            <button id="compoff-submit-btn" type="submit" disabled={loading} style={{
              padding: '9px 20px', borderRadius: 8,
              background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Credit Row ───────────────────────────────────────────────────────────────
function CreditRow({ credit, isHR, onApprove, onReject }) {
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      {isHR && (
        <td style={{ padding: '10px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{credit.employee_name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{credit.employee_code}</div>
        </td>
      )}
      <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151' }}>{fmtDate(credit.work_date)}</td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151' }}>{credit.hours_worked || '8'}h</td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151' }}>
        <span style={{ fontWeight: 700, color: '#6366f1' }}>{credit.days_credited}</span> day(s)
      </td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: '#475569', maxWidth: 200 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {credit.reason || '—'}
        </div>
      </td>
      <td style={{ padding: '10px 16px' }}>
        <StatusBadge status={credit.status} />
      </td>
      <td style={{ padding: '10px 16px', fontSize: 11, color: '#94a3b8' }}>
        {credit.expires_at ? `Exp: ${fmtDate(credit.expires_at)}` : '—'}
      </td>
      {isHR && credit.status === 'PENDING' && (
        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <button onClick={() => onApprove(credit.id)} style={{
              padding: '4px 10px', borderRadius: 6, background: '#f0fdf4',
              color: '#15803d', border: '1px solid #bbf7d0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>✓ Approve</button>
            <button onClick={() => onReject(credit.id)} style={{
              padding: '4px 10px', borderRadius: 6, background: '#fef2f2',
              color: '#dc2626', border: '1px solid #fecaca', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>✕ Reject</button>
          </div>
        </td>
      )}
      {isHR && credit.status !== 'PENDING' && <td />}
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompOffPage() {
  const { user, role } = useAuth();
  const isHR = role !== ROLES.EMPLOYEE;
  const employeeId = user?.employeeId || null;

  const [credits, setCredits] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const [creditsRes, balRes] = await Promise.allSettled([
        timeoffApi.listCompOffCredits(params),
        employeeId ? timeoffApi.getCompOffBalance(employeeId) : Promise.resolve(null),
      ]);
      if (creditsRes.status === 'fulfilled') {
        const d = creditsRes.value?.data?.data || creditsRes.value?.data;
        setCredits(Array.isArray(d) ? d : []);
      }
      if (balRes.status === 'fulfilled' && balRes.value) {
        setBalance(balRes.value?.data?.data || balRes.value?.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, employeeId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id) => {
    setActionLoading(a => ({ ...a, [id]: 'approve' }));
    try {
      await timeoffApi.approveCompOffCredit(id);
      await loadData();
    } catch (err) {
      alert('Approve failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setActionLoading(a => ({ ...a, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this comp-off credit claim?')) return;
    setActionLoading(a => ({ ...a, [id]: 'reject' }));
    try {
      await timeoffApi.rejectCompOffCredit(id);
      await loadData();
    } catch (err) {
      alert('Reject failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setActionLoading(a => ({ ...a, [id]: null }));
    }
  };

  const pending = credits.filter(c => c.status === 'PENDING');
  const approved = credits.filter(c => c.status === 'APPROVED');

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' }}>🕐 Compensatory Off</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
            {isHR ? 'Manage comp-off credit claims across your workforce' : 'Raise a comp-off claim for working on a holiday or weekend'}
          </p>
        </div>
        <button id="compoff-raise-btn" onClick={() => setShowModal(true)} style={{
          padding: '10px 20px', borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>
          + Raise Comp-Off Claim
        </button>
      </div>

      {/* Balance card (employee) */}
      {balance && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Available Balance', value: `${balance.available_days} day(s)`, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Pending Claims', value: pending.length, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Approved Credits', value: approved.length, color: '#6366f1', bg: '#eff6ff' },
          ].map((c, i) => (
            <div key={i} style={{ flex: 1, minWidth: 160, background: c.bg, border: `1.5px solid`, borderColor: c.bg, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* HR Pending alerts */}
      {isHR && pending.length > 0 && (
        <div style={{
          background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
        }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <span style={{ color: '#92400e', fontWeight: 600 }}>
            {pending.length} comp-off claim(s) awaiting your review
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Filter:</span>
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'USED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: statusFilter === s ? '#6366f1' : '#f1f5f9',
            color: statusFilter === s ? '#fff' : '#475569',
            border: 'none',
          }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error} <button onClick={loadData} style={{ marginLeft: 10, textDecoration: 'underline', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Credits table */}
      <div style={{ borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden', background: '#fff' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading claims…</div>
        ) : credits.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🕐</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No comp-off claims found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {isHR ? 'No employee claims to review.' : 'Raise a claim for working on a holiday or weekend.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {isHR && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Employee</th>}
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Work Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Hours</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Credits</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Reason</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Expiry</th>
                {isHR && <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {credits.map((credit, idx) => (
                <tr key={credit.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                  {isHR && (
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{credit.employee_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{credit.employee_code}</div>
                    </td>
                  )}
                  <td style={{ padding: '10px 16px', color: '#374151' }}>{fmtDate(credit.work_date)}</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>{credit.hours_worked || '8'}h</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontWeight: 700, color: '#6366f1' }}>{credit.days_credited}</span> day(s)
                  </td>
                  <td style={{ padding: '10px 16px', color: '#475569', maxWidth: 220 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{credit.reason || '—'}</div>
                  </td>
                  <td style={{ padding: '10px 16px' }}><StatusBadge status={credit.status} /></td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: '#94a3b8' }}>
                    {credit.expires_at ? `Exp: ${fmtDate(credit.expires_at)}` : '—'}
                  </td>
                  {isHR && (
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {credit.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button onClick={() => handleApprove(credit.id)} disabled={actionLoading[credit.id]} style={{
                            padding: '4px 10px', borderRadius: 6, background: '#f0fdf4',
                            color: '#15803d', border: '1px solid #bbf7d0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}>✓ Approve</button>
                          <button onClick={() => handleReject(credit.id)} disabled={actionLoading[credit.id]} style={{
                            padding: '4px 10px', borderRadius: 6, background: '#fef2f2',
                            color: '#dc2626', border: '1px solid #fecaca', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}>✕ Reject</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Employee redemption info */}
      {!isHR && balance && parseFloat(balance.available_days) > 0 && (
        <div style={{ marginTop: 20, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>
            💡 You have {balance.available_days} comp-off day(s) available
          </div>
          <div style={{ fontSize: 13, color: '#3730a3' }}>
            To redeem, go to <strong>My Time Off</strong> and create a leave request using the <strong>"Compensatory Off"</strong> leave type.
          </div>
        </div>
      )}

      {/* Raise claim modal */}
      {showModal && (
        <RaiseClaimModal
          isHR={isHR}
          employeeId={employeeId}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); loadData(); }}
        />
      )}
    </div>
  );
}
