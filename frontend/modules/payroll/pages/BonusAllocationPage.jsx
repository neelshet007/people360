import React, { useState, useEffect, useCallback } from 'react';
import { payrollApi } from '../api/payrollApi';
import { useAuth } from '../../../context/AuthContext';

/**
 * BonusAllocationPage
 * Owner: P3 (Payroll) — ExFeat
 *
 * Stepper UI: Cycle Setup → Employee Allocation → Review & Approve → Disbursement
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BONUS_TYPES = [
  { value: 'PERFORMANCE', label: 'Performance Bonus' },
  { value: 'FESTIVAL', label: 'Festival Bonus' },
  { value: 'ANNUAL', label: 'Annual Bonus' },
  { value: 'RETENTION', label: 'Retention Bonus' },
  { value: 'SPOT', label: 'Spot Award' },
  { value: 'CUSTOM', label: 'Custom Bonus' },
];

const STATUS_COLORS = {
  DRAFT:     { bg: '#f1f5f9', text: '#475569' },
  COMPUTED:  { bg: '#eff6ff', text: '#1d4ed8' },
  VALIDATED: { bg: '#f0fdf4', text: '#15803d' },
  PAID:      { bg: '#fefce8', text: '#854d0e' },
};

const ALLOC_STATUS_COLORS = {
  DRAFT:     { bg: '#f1f5f9', text: '#475569' },
  APPROVED:  { bg: '#eff6ff', text: '#1d4ed8' },
  REJECTED:  { bg: '#fef2f2', text: '#dc2626' },
  DISBURSED: { bg: '#f0fdf4', text: '#15803d' },
};

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 90 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? '#10b981' : active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e2e8f0',
                color: done || active ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                boxShadow: active ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: active ? '#6366f1' : done ? '#10b981' : '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < current ? '#10b981' : '#e2e8f0', marginBottom: 18, transition: 'all 0.3s ease' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Badge({ status, type = 'payrun' }) {
  const map = type === 'alloc' ? ALLOC_STATUS_COLORS : STATUS_COLORS;
  const c = map[status] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      letterSpacing: '0.03em', textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
}

// ─── Step 0: Cycle Setup ──────────────────────────────────────────────────────
function CycleSetupStep({ onCreated }) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [form, setForm] = useState({
    name: '',
    bonus_type: 'PERFORMANCE',
    pay_period_start: firstDay,
    pay_period_end: lastDay,
    default_amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Bonus cycle name is required'); return; }
    setLoading(true); setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        bonus_type: form.bonus_type,
        pay_period_start: form.pay_period_start,
        pay_period_end: form.pay_period_end,
        default_amount: parseFloat(form.default_amount || 0),
      };
      const res = await payrollApi.createBonusCycle(payload);
      const data = res.data?.data || res.data;
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create bonus cycle');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 540 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Configure Bonus Cycle</h3>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Bonus Cycle Name *</label>
          <input id="bonus-cycle-name" style={inputStyle} value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="e.g. Diwali Bonus 2026, Q3 Performance Bonus" required />
        </div>

        <div>
          <label style={labelStyle}>Bonus Type</label>
          <select id="bonus-cycle-type" style={{ ...inputStyle, cursor: 'pointer' }} value={form.bonus_type}
            onChange={e => handleChange('bonus_type', e.target.value)}>
            {BONUS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Period Start</label>
            <input id="bonus-period-start" type="date" style={inputStyle} value={form.pay_period_start}
              onChange={e => handleChange('pay_period_start', e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Period End</label>
            <input id="bonus-period-end" type="date" style={inputStyle} value={form.pay_period_end}
              onChange={e => handleChange('pay_period_end', e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Default Bonus Amount (₹) <span style={{ fontWeight: 400, color: '#6b7280' }}>(optional — can set per-employee)</span></label>
          <input id="bonus-default-amount" type="number" style={inputStyle} value={form.default_amount}
            onChange={e => handleChange('default_amount', e.target.value)}
            placeholder="0 — set individually per employee" min="0" step="1" />
        </div>

        <button id="bonus-create-cycle-btn" type="submit" disabled={loading} style={{
          marginTop: 4, padding: '12px 28px', borderRadius: 10,
          background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'all 0.2s',
          alignSelf: 'flex-start',
        }}>
          {loading ? 'Creating…' : 'Create Bonus Cycle →'}
        </button>
      </div>
    </form>
  );
}

// ─── Step 1: Employee Allocation ──────────────────────────────────────────────
function AllocationStep({ cycleId, onApproved }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkMode, setBulkMode] = useState('fixed'); // 'fixed' | 'percent'

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await payrollApi.getBonusCycleDetail(cycleId);
      const d = res.data?.data || res.data;
      setDetail(d);
      // Initialize edit values from allocations
      const initial = {};
      (d.allocations || []).forEach(a => {
        initial[a.id] = { amount: a.amount || 0, remarks: a.remarks || '' };
      });
      setEditValues(initial);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => { load(); }, [load]);

  const saveAllocation = async (allocId) => {
    setSaving(s => ({ ...s, [allocId]: true }));
    try {
      const vals = editValues[allocId] || {};
      await payrollApi.updateBonusAllocation(cycleId, allocId, {
        amount: parseFloat(vals.amount || 0),
        remarks: vals.remarks || '',
      });
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSaving(s => ({ ...s, [allocId]: false }));
    }
  };

  const applyBulk = () => {
    if (!bulkAmount) return;
    const allocs = detail?.allocations || [];
    const newVals = { ...editValues };
    allocs.forEach(a => {
      if (a.status === 'DRAFT') {
        let amt;
        if (bulkMode === 'percent') {
          const wage = parseFloat(a.wage_rate || 0);
          amt = Math.round(wage * (parseFloat(bulkAmount) / 100));
        } else {
          amt = parseFloat(bulkAmount);
        }
        newVals[a.id] = { ...(newVals[a.id] || {}), amount: amt };
      }
    });
    setEditValues(newVals);
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve all allocations and trigger bonus computation? This cannot be undone.')) return;
    setApproving(true); setError(null);
    try {
      // Save all pending edits first
      const allocs = detail?.allocations?.filter(a => a.status === 'DRAFT') || [];
      for (const a of allocs) {
        const vals = editValues[a.id] || {};
        await payrollApi.updateBonusAllocation(cycleId, a.id, {
          amount: parseFloat(vals.amount || 0),
          remarks: vals.remarks || '',
        });
      }
      const res = await payrollApi.approveBonusCycle(cycleId);
      const payrun = res.data?.data || res.data;
      onApproved(payrun);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Loading allocations…</div>;
  if (error) return (
    <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8, color: '#dc2626' }}>
      {error} <button onClick={load} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer' }}>Retry</button>
    </div>
  );
  if (!detail) return null;

  const totals = detail.totals || {};
  const allocations = detail.allocations || [];
  const totalBonusEntered = Object.values(editValues).reduce((s, v) => s + parseFloat(v.amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Set Employee Bonus Amounts</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{allocations.length} employees eligible · Set individual amounts or apply bulk fill</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 12, padding: '12px 20px', color: '#fff', textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Total Bonus Pool</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(totalBonusEntered)}</div>
        </div>
      </div>

      {/* Bulk fill tool */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Bulk Fill:</span>
        <select value={bulkMode} onChange={e => setBulkMode(e.target.value)} id="bonus-bulk-mode"
          style={{ padding: '7px 12px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fff' }}>
          <option value="fixed">Fixed ₹ Amount</option>
          <option value="percent">% of Monthly Salary</option>
        </select>
        <input type="number" value={bulkAmount} onChange={e => setBulkAmount(e.target.value)} id="bonus-bulk-value"
          placeholder={bulkMode === 'fixed' ? 'e.g. 5000' : 'e.g. 10'}
          style={{ padding: '7px 12px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, width: 130 }} />
        <button id="bonus-bulk-apply-btn" onClick={applyBulk} style={{
          padding: '7px 16px', borderRadius: 6, background: '#6366f1', color: '#fff',
          border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Apply to All
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Allocation table */}
      <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Employee</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Dept</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Bonus Amount (₹)</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Remarks</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Status</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Save</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc, idx) => {
              const ev = editValues[alloc.id] || { amount: 0, remarks: '' };
              const isDraft = alloc.status === 'DRAFT';
              return (
                <tr key={alloc.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{alloc.employee_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{alloc.employee_code} · {alloc.designation || '—'}</div>
                  </td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{alloc.department || '—'}</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                    {isDraft ? (
                      <input type="number" value={ev.amount}
                        onChange={e => setEditValues(v => ({ ...v, [alloc.id]: { ...v[alloc.id], amount: e.target.value } }))}
                        style={{ width: 110, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, textAlign: 'right' }}
                        min="0" step="100" />
                    ) : (
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{fmt(alloc.amount)}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    {isDraft ? (
                      <input type="text" value={ev.remarks}
                        onChange={e => setEditValues(v => ({ ...v, [alloc.id]: { ...v[alloc.id], remarks: e.target.value } }))}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13 }}
                        placeholder="Optional note" />
                    ) : (
                      <span style={{ color: '#6b7280' }}>{alloc.remarks || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Badge status={alloc.status} type="alloc" />
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    {isDraft && (
                      <button onClick={() => saveAllocation(alloc.id)} disabled={saving[alloc.id]}
                        style={{ padding: '5px 12px', borderRadius: 6, background: saving[alloc.id] ? '#e0e7ff' : '#eff6ff', color: '#3730a3', border: '1px solid #c7d2fe', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {saving[alloc.id] ? '…' : 'Save'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={2} style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, color: '#374151' }}>Total</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{fmt(totalBonusEntered)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button id="bonus-approve-btn" onClick={handleApprove} disabled={approving} style={{
          padding: '12px 28px', borderRadius: 10,
          background: approving ? '#c7d2fe' : 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', fontSize: 14, fontWeight: 700, border: 'none',
          cursor: approving ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
        }}>
          {approving ? 'Approving & Computing…' : '✓ Approve All & Compute'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Review ───────────────────────────────────────────────────────────
function ReviewStep({ cycleId, payrun, onDisburse }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disbursing, setDisbursing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await payrollApi.getBonusCycleDetail(cycleId);
        setDetail(res.data?.data || res.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [cycleId]);

  const handleDisburse = async () => {
    if (!window.confirm('Mark this bonus cycle as PAID and disburse all approved bonuses?')) return;
    setDisbursing(true); setError(null);
    try {
      const res = await payrollApi.disburseBonusCycle(cycleId);
      onDisburse(res.data?.data || res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setDisbursing(false);
    }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Loading review…</div>;
  if (!detail) return null;

  const allocations = detail.allocations || [];
  const approved = allocations.filter(a => a.status === 'APPROVED');
  const rejected = allocations.filter(a => a.status === 'REJECTED');
  const total = approved.reduce((s, a) => s + parseFloat(a.amount || 0), 0);

  return (
    <div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Review & Disburse</h3>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>
        Payrun computed. Review the summary below and approve disbursement.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Bonus', value: fmt(total), color: '#6366f1' },
          { label: 'Approved', value: approved.length, color: '#10b981' },
          { label: 'Rejected', value: rejected.length, color: '#ef4444' },
          { label: 'Payrun Status', value: <Badge status={payrun?.status || detail.payrun?.status} />, color: '#374151' },
        ].map((c, i) => (
          <div key={i} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Allocation summary table */}
      <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Employee</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Bonus Amount</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Remarks</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc, idx) => (
              <tr key={alloc.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{alloc.employee_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{alloc.employee_code}</div>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>{fmt(alloc.amount)}</td>
                <td style={{ padding: '10px 16px', color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>{alloc.remarks || '—'}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}><Badge status={alloc.status} type="alloc" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {['COMPUTED', 'VALIDATED'].includes(payrun?.status || detail.payrun?.status) && (
        <button id="bonus-disburse-btn" onClick={handleDisburse} disabled={disbursing} style={{
          padding: '12px 32px', borderRadius: 10,
          background: disbursing ? '#c7d2fe' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff', fontSize: 14, fontWeight: 700, border: 'none',
          cursor: disbursing ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
        }}>
          {disbursing ? 'Disbursing…' : '💸 Mark as Paid & Disburse'}
        </button>
      )}
    </div>
  );
}

// ─── Step 3: Disbursement ─────────────────────────────────────────────────────
function DisbursementStep({ cycleId, payrun }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await payrollApi.getBonusCycleDetail(cycleId);
        setDetail(res.data?.data || res.data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [cycleId]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Loading…</div>;

  const allocations = detail?.allocations || [];
  const disbursed = allocations.filter(a => a.status === 'DISBURSED');
  const total = disbursed.reduce((s, a) => s + parseFloat(a.amount || 0), 0);

  return (
    <div style={{ textAlign: 'center', paddingTop: 24 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginBottom: 8 }}>Bonus Cycle Disbursed!</h3>
      <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 28 }}>
        <strong style={{ color: '#1e293b' }}>{fmt(total)}</strong> in bonuses successfully disbursed to <strong style={{ color: '#1e293b' }}>{disbursed.length}</strong> employees.
      </p>

      <div style={{ display: 'inline-flex', gap: 24, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '20px 36px', marginBottom: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Disbursed Amount</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#6366f1' }}>{fmt(total)}</div>
        </div>
        <div style={{ width: 1, background: '#e2e8f0' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employees</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>{disbursed.length}</div>
        </div>
        <div style={{ width: 1, background: '#e2e8f0' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payrun</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginTop: 6 }}><Badge status="PAID" /></div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#94a3b8' }}>Bonus payslips are now visible to employees in their Self-Service portal.</p>
    </div>
  );
}

// ─── Cycle List ───────────────────────────────────────────────────────────────
function CycleList({ onSelect }) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await payrollApi.listBonusCycles();
        const d = res.data?.data || res.data;
        setCycles(Array.isArray(d) ? d : []);
      } catch (err) {
        setError(err.response?.data?.error?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Loading bonus cycles…</div>;
  if (error) return <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8, color: '#dc2626' }}>{error}</div>;
  if (cycles.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No bonus cycles yet</p>
      <p style={{ fontSize: 13 }}>Create your first bonus cycle to get started.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {cycles.map(c => (
        <div key={c.id} onClick={() => onSelect(c)} style={{
          border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px',
          cursor: 'pointer', background: '#fff', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>🎁</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {fmtDate(c.pay_period_start)} → {fmtDate(c.pay_period_end)} · {c.allocation_count || 0} employees
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{fmt(c.total_bonus_amount)}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Pool</div>
            </div>
            <Badge status={c.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const STEPS = ['Setup', 'Allocate', 'Review', 'Disbursed'];

export default function BonusAllocationPage() {
  const { role } = useAuth();
  const [mode, setMode] = useState('list'); // 'list' | 'new' | 'existing'
  const [step, setStep] = useState(0);
  const [cycleId, setCycleId] = useState(null);
  const [payrun, setPayrun] = useState(null);

  // Map existing cycle status to step
  const statusToStep = (status) => {
    if (['PAID'].includes(status)) return 3;
    if (['VALIDATED', 'COMPUTED'].includes(status)) return 2;
    if (['DRAFT'].includes(status)) return 1;
    return 0;
  };

  const handleCreated = (data) => {
    const pr = data.payrun || data;
    setCycleId(pr.id);
    setPayrun(pr);
    setStep(1);
    setMode('new');
  };

  const handleApproved = (pr) => {
    setPayrun(pr);
    setStep(2);
  };

  const handleDisburse = (pr) => {
    setPayrun(pr);
    setStep(3);
  };

  const handleSelectExisting = (cycle) => {
    setCycleId(cycle.id);
    setPayrun(cycle);
    setStep(statusToStep(cycle.status));
    setMode('existing');
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' }}>🎁 Bonus Allocation</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>Create and manage bonus cycles for employees</p>
        </div>
        {mode !== 'new' && (
          <button id="bonus-new-cycle-btn" onClick={() => { setMode('new'); setStep(0); setCycleId(null); setPayrun(null); }}
            style={{
              padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
            + New Bonus Cycle
          </button>
        )}
        {mode !== 'list' && (
          <button id="bonus-back-btn" onClick={() => { setMode('list'); setStep(0); setCycleId(null); setPayrun(null); }}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ← Back to Cycles
          </button>
        )}
      </div>

      {/* List mode */}
      {mode === 'list' && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: '0 0 16px' }}>All Bonus Cycles</h2>
          <CycleList onSelect={handleSelectExisting} />
        </div>
      )}

      {/* New / Existing cycle wizard */}
      {mode !== 'list' && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <StepIndicator steps={STEPS} current={step} />

          {step === 0 && <CycleSetupStep onCreated={handleCreated} />}
          {step === 1 && cycleId && <AllocationStep cycleId={cycleId} onApproved={handleApproved} />}
          {step === 2 && cycleId && <ReviewStep cycleId={cycleId} payrun={payrun} onDisburse={handleDisburse} />}
          {step === 3 && cycleId && <DisbursementStep cycleId={cycleId} payrun={payrun} />}
        </div>
      )}
    </div>
  );
}
