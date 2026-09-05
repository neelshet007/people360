import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/feedback/Loading';
import Alert from '../../../components/feedback/Alert';
import { formatCurrency } from '../../../lib/utils';
import payrollApi from '../api/payrollApi';

/**
 * Multi-Step Payrun Creation Wizard Modal
 * Owner: P3 (Payroll)
 * 
 * Step 1: Select Period
 * Step 2: Select Salary Structure
 * Step 3: Select Eligible Employees & Review Eligibility
 * Step 4: Summary Review & Creation
 */
export default function PayrunWizardModal({ isOpen, onClose, onCreated }) {
  const navigate = useNavigate();

  // Step 1: Period
  const [step, setStep] = useState(1);
  const [name, setName] = useState('October 2026 Monthly Payrun');
  const [periodStart, setPeriodStart] = useState('2026-10-01');
  const [periodEnd, setPeriodEnd] = useState('2026-10-31');

  // Step 2: Salary Structure
  const [structures, setStructures] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState('');

  // Step 3: Employee Eligibility
  const [eligibilityData, setEligibilityData] = useState(null);
  const [evaluatingEligibility, setEvaluatingEligibility] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [eligibilityError, setEligibilityError] = useState(null);

  // Creation State
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState(null);

  // Load structures when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function loadStructures() {
      setLoadingStructures(true);
      try {
        const res = await payrollApi.getSalaryStructures({ is_active: true });
        setStructures(res.data || []);
        if (res.data && res.data.length > 0 && !selectedStructureId) {
          setSelectedStructureId(res.data[0].id);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoadingStructures(false);
      }
    }

    loadStructures();
  }, [isOpen]);

  // Load eligibility when moving to Step 3
  const handleLoadEligibility = async () => {
    setEvaluatingEligibility(true);
    setEligibilityError(null);
    try {
      const res = await payrollApi.checkEligibility({
        periodStart,
        periodEnd,
        salaryStructureId: selectedStructureId,
      });
      setEligibilityData(res.data);
      // Default to selecting all eligible employees
      const eligibleIds = (res.data.eligible || []).map((e) => e.id);
      setSelectedEmployeeIds(eligibleIds);
    } catch (err) {
      setEligibilityError(err.message || 'Failed to evaluate employee eligibility');
    } finally {
      setEvaluatingEligibility(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim() || !periodStart || !periodEnd) {
        setEligibilityError('Please complete all period fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
      handleLoadEligibility();
    } else if (step === 3) {
      if (selectedEmployeeIds.length === 0) {
        setEligibilityError('Please select at least one eligible employee to include in this payrun');
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setEligibilityError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSelectAll = (checked) => {
    if (checked && eligibilityData?.eligible) {
      setSelectedEmployeeIds(eligibilityData.eligible.map((e) => e.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleToggleEmployee = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreatePayrun = async () => {
    setCreating(true);
    setCreationError(null);
    try {
      const res = await payrollApi.createPayrun({
        name,
        pay_period_start: periodStart,
        pay_period_end: periodEnd,
        salary_structure_id: selectedStructureId || null,
        selected_employee_ids: selectedEmployeeIds,
        employee_count: selectedEmployeeIds.length,
      });

      const newId = res.data?.id;
      if (onCreated) onCreated(res.data);
      onClose();

      // Navigate to Payrun Detail Page to trigger computation
      if (newId) {
        navigate(`/payroll/payruns/${newId}`);
      }
    } catch (err) {
      setCreationError(err.message || 'Failed to initialize payrun batch');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  const selectedStructure = structures.find((s) => s.id === selectedStructureId);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Payrun Initialization Wizard</span>
          <Badge variant="primary">Step {step} of 4</Badge>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      actions={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          {step > 1 ? (
            <Button variant="secondary" onClick={handlePrevStep} disabled={creating}>
              ← Previous Step
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {step < 4 ? (
              <Button variant="primary" onClick={handleNextStep} loading={evaluatingEligibility}>
                Next: {step === 1 ? 'Salary Structure' : step === 2 ? 'Employees' : 'Review & Create'} →
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreatePayrun} loading={creating}>
                ✓ Create Payrun (Draft)
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Wizard Progress Steps Indicator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
        }}
      >
        {[
          { num: 1, label: '1. Period Scope' },
          { num: 2, label: '2. Structure' },
          { num: 3, label: '3. Eligibility' },
          { num: 4, label: '4. Summary' },
        ].map((s) => (
          <div
            key={s.num}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor:
                step === s.num
                  ? 'var(--primary-600, #4f46e5)'
                  : step > s.num
                  ? 'var(--success-100, #dcfce7)'
                  : 'var(--neutral-100, #f1f5f9)',
              color:
                step === s.num
                  ? '#ffffff'
                  : step > s.num
                  ? 'var(--success-800, #166534)'
                  : 'var(--neutral-500, #64748b)',
            }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Errors / Warnings */}
      {eligibilityError && (
        <Alert type="danger" style={{ marginBottom: '16px' }}>
          {eligibilityError}
        </Alert>
      )}

      {creationError && (
        <Alert type="danger" style={{ marginBottom: '16px' }}>
          {creationError}
        </Alert>
      )}

      {/* ============================================================= */}
      {/* STEP 1: PERIOD SELECTION                                      */}
      {/* ============================================================= */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)' }}>
            Select the compensation period for this periodic payroll execution batch.
          </div>

          <Input
            label="Payrun Batch Name"
            required
            placeholder="e.g. October 2026 Monthly Payrun"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Payroll Period Start"
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
            <Input
              label="Payroll Period End"
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500, #64748b)' }}>
              Quick Presets:
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setName('September 2026 Monthly Payrun');
                setPeriodStart('2026-09-01');
                setPeriodEnd('2026-09-30');
              }}
            >
              Sep 2026
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setName('October 2026 Monthly Payrun');
                setPeriodStart('2026-10-01');
                setPeriodEnd('2026-10-31');
              }}
            >
              Oct 2026
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setName('November 2026 Monthly Payrun');
                setPeriodStart('2026-11-01');
                setPeriodEnd('2026-11-30');
              }}
            >
              Nov 2026
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* STEP 2: SALARY STRUCTURE SELECTION                            */}
      {/* ============================================================= */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)' }}>
            Select the Salary Structure definition to apply for this batch. The rules from this structure determine the itemized Gross and Net salary calculations.
          </div>

          {loadingStructures ? (
            <Loading message="Loading active salary structures..." />
          ) : (
            <>
              <Select
                label="Applicable Salary Structure"
                required
                options={[
                  { value: '', label: 'Select standard structure...' },
                  ...structures.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.code}) — ${s.rule_count || 0} active rules`,
                  })),
                ]}
                value={selectedStructureId}
                onChange={(e) => setSelectedStructureId(e.target.value)}
              />

              {selectedStructure && (
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--neutral-50, #f8fafc)',
                    borderRadius: '8px',
                    border: '1px solid var(--neutral-200, #e2e8f0)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--neutral-900, #0f172a)' }}>
                    {selectedStructure.name} ({selectedStructure.code})
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--neutral-600, #475569)', marginTop: '4px' }}>
                    {selectedStructure.description || 'Corporate Indian CTC salary breakdown model'}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <Badge variant="success">Active</Badge>
                    <Badge variant="primary">{selectedStructure.rule_count || 0} Ordered Rules</Badge>
                    <Badge variant="neutral">Currency: INR (₹)</Badge>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* STEP 3: EMPLOYEE SELECTION & ELIGIBILITY                      */}
      {/* ============================================================= */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {evaluatingEligibility ? (
            <Loading message="Evaluating active employment contracts, attendance, and leave inputs..." />
          ) : !eligibilityData ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Button variant="primary" onClick={handleLoadEligibility}>
                Evaluate Employee Eligibility
              </Button>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Staff
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
                    {eligibilityData.summary?.total || 0}
                  </div>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
                    Eligible for Payroll
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d' }}>
                    {eligibilityData.summary?.eligible_count || 0}
                  </div>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Ineligible
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7f1d1d' }}>
                    {eligibilityData.summary?.ineligible_count || 0}
                  </div>
                </div>
              </div>

              {/* Eligible Employees Selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--neutral-800, #1e293b)' }}>
                    Eligible Employees ({selectedEmployeeIds.length} of {eligibilityData.eligible?.length || 0} selected)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectAll(selectedEmployeeIds.length < (eligibilityData.eligible?.length || 0))}
                  >
                    {selectedEmployeeIds.length === (eligibilityData.eligible?.length || 0) ? 'Deselect All' : 'Select All Eligible'}
                  </Button>
                </div>

                <div
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid var(--neutral-200, #e2e8f0)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {eligibilityData.eligible && eligibilityData.eligible.length > 0 ? (
                    eligibilityData.eligible.map((emp) => {
                      const isChecked = selectedEmployeeIds.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => handleToggleEmployee(emp.id)}
                          style={{
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderBottom: '1px solid var(--neutral-100, #f1f5f9)',
                            backgroundColor: isChecked ? 'var(--primary-50, #eef2ff)' : '#ffffff',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-900, #0f172a)' }}>
                              {emp.display_name} <span style={{ color: 'var(--neutral-500, #64748b)', fontSize: '0.75rem' }}>({emp.employee_code})</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
                              {emp.designation} • {emp.department} • Wage: {formatCurrency(emp.contract?.wage_rate || 0)}
                            </div>
                          </div>
                          <Badge variant="success">Eligible</Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--neutral-500, #64748b)' }}>
                      No eligible employees found for this period.
                    </div>
                  )}
                </div>
              </div>

              {/* Ineligible Employees List */}
              {eligibilityData.ineligible && eligibilityData.ineligible.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--danger-700, #b91c1c)', marginBottom: '8px' }}>
                    ⚠️ Ineligible Employees ({eligibilityData.ineligible.length}) — Will not be computed
                  </div>
                  <div
                    style={{
                      maxHeight: '140px',
                      overflowY: 'auto',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      backgroundColor: '#fff5f5',
                    }}
                  >
                    {eligibilityData.ineligible.map((emp) => (
                      <div
                        key={emp.id}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #fee2e2',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div>
                          <strong>{emp.display_name}</strong> ({emp.employee_code || 'No Code'})
                        </div>
                        <div style={{ color: '#b91c1c', fontSize: '0.75rem', fontWeight: 500 }}>
                          {emp.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* STEP 4: REVIEW & CREATE                                       */}
      {/* ============================================================= */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)' }}>
            Review the payrun specifications below before initializing the batch. Once created in <strong>DRAFT</strong> status, you can execute the Phase 6 computation engine.
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderRadius: '8px',
              border: '1px solid var(--neutral-200, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600, #475569)', fontSize: '0.8125rem' }}>Payrun Batch Name:</span>
              <strong style={{ fontSize: '0.875rem' }}>{name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600, #475569)', fontSize: '0.8125rem' }}>Pay Period Scope:</span>
              <strong style={{ fontSize: '0.875rem' }}>
                {periodStart} → {periodEnd}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600, #475569)', fontSize: '0.8125rem' }}>Salary Structure:</span>
              <strong style={{ fontSize: '0.875rem' }}>
                {selectedStructure ? `${selectedStructure.name} (${selectedStructure.code})` : 'Corporate Standard'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600, #475569)', fontSize: '0.8125rem' }}>Selected Personnel:</span>
              <strong style={{ fontSize: '0.875rem', color: 'var(--primary-700, #4338ca)' }}>
                {selectedEmployeeIds.length} Active Employees
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600, #475569)', fontSize: '0.8125rem' }}>Initial Status:</span>
              <Badge variant="neutral">DRAFT</Badge>
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '0.8125rem', color: '#1e40af' }}>
            ℹ️ After creating this draft batch, you will be directed to the Payrun details screen to execute the calculation pipeline and generate verified Indian payslips.
          </div>
        </div>
      )}
    </Modal>
  );
}
