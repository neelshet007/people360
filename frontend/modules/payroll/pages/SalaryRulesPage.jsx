import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import { formatCurrency } from '../../../lib/utils';
import payrollApi from '../api/payrollApi';

/**
 * Salary Rules Page — PeoplePay360
 * Owner: P3 (Payroll)
 * Atomic component calculation rule configuration (Fixed, Percentage, Formula) with explicit sequence ordering
 */
export default function SalaryRulesPage() {
  const { hasPermission, role } = useAuth();
  const canManage = hasPermission('salary.manage');

  const [structures, setStructures] = useState([]);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [currentRuleId, setCurrentRuleId] = useState(null);
  const [formData, setFormData] = useState({
    salary_structure_id: '',
    name: '',
    code: '',
    category: 'ALLOWANCE',
    calculation_type: 'PERCENTAGE',
    amount_or_rate: 0,
    percentage_base: 'BASIC',
    formula: '',
    sequence_order: 10,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete Confirmation Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const structRes = await payrollApi.getSalaryStructures();
      const structList = structRes.data || [];
      setStructures(structList);

      const targetStructId = selectedStructureId || structList[0]?.id || '';
      if (!selectedStructureId && targetStructId) {
        setSelectedStructureId(targetStructId);
      }

      const rulesRes = await payrollApi.getSalaryRules(
        targetStructId ? { salary_structure_id: targetStructId } : {}
      );
      setRules(rulesRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load salary rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStructureId]);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setCurrentRuleId(null);
    setFormData({
      salary_structure_id: selectedStructureId || structures[0]?.id || '',
      name: '',
      code: '',
      category: 'ALLOWANCE',
      calculation_type: 'PERCENTAGE',
      amount_or_rate: 0,
      percentage_base: 'BASIC',
      formula: '',
      sequence_order: (rules.length + 1) * 10,
      is_active: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setModalMode('EDIT');
    setCurrentRuleId(rule.id);
    setFormData({
      salary_structure_id: rule.salary_structure_id,
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'ALLOWANCE',
      calculation_type: rule.calculation_type || 'FIXED',
      amount_or_rate: rule.amount_or_rate || 0,
      percentage_base: rule.percentage_base || 'BASIC',
      formula: rule.formula || '',
      sequence_order: rule.sequence_order || 10,
      is_active: rule.is_active !== false,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.salary_structure_id) {
      setModalError('Rule name, code, and salary structure are required');
      return;
    }
    if (formData.calculation_type === 'FORMULA' && !formData.formula.trim()) {
      setModalError('Formula expression is required when calculation type is FORMULA');
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      if (modalMode === 'CREATE') {
        await payrollApi.createSalaryRule(formData);
        setSuccessMsg(`Salary rule '${formData.name}' created successfully`);
      } else {
        await payrollApi.updateSalaryRule(currentRuleId, formData);
        setSuccessMsg(`Salary rule '${formData.name}' updated successfully`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to save salary rule');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (rule) => {
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    setSubmitting(true);
    try {
      await payrollApi.deleteSalaryRule(ruleToDelete.id);
      setSuccessMsg(`Salary rule '${ruleToDelete.name}' deleted successfully`);
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete salary rule');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'BASIC':
        return <Badge variant="primary">Basic</Badge>;
      case 'ALLOWANCE':
        return <Badge variant="success">Allowance</Badge>;
      case 'GROSS':
        return <Badge variant="info">Gross</Badge>;
      case 'DEDUCTION':
        return <Badge variant="danger">Deduction</Badge>;
      case 'NET':
        return <Badge variant="success">Net Salary</Badge>;
      case 'COMPANY_CONTRIBUTION':
        return <Badge variant="info">Contribution</Badge>;
      default:
        return <Badge variant="neutral">{cat}</Badge>;
    }
  };

  const sortedRules = [...rules].sort(
    (a, b) => (parseInt(a.sequence_order, 10) || 0) - (parseInt(b.sequence_order, 10) || 0)
  );

  const columns = [
    {
      header: 'Seq',
      accessor: 'sequence_order',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary-700, #4338ca)', fontSize: '0.875rem' }}>
          #{row.sequence_order}
        </span>
      ),
    },
    {
      header: 'Rule Name & Code',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>{row.name}</div>
          <code style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>{row.code}</code>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => getCategoryBadge(row.category),
    },
    {
      header: 'Calculation Type',
      accessor: 'calculation_type',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-700, #334155)', fontWeight: 500 }}>
          {row.calculation_type}
        </span>
      ),
    },
    {
      header: 'Configuration / Value',
      accessor: 'amount_or_rate',
      render: (row) => {
        if (row.calculation_type === 'PERCENTAGE') {
          return (
            <span style={{ fontWeight: 600, color: 'var(--neutral-800, #1e293b)' }}>
              {parseFloat(row.amount_or_rate) > 1 ? `${row.amount_or_rate}%` : `${(parseFloat(row.amount_or_rate) * 100).toFixed(1)}%`} of{' '}
              <code style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>
                {row.percentage_base || 'BASIC'}
              </code>
            </span>
          );
        }
        if (row.calculation_type === 'FIXED') {
          return (
            <span style={{ fontWeight: 600, color: 'var(--neutral-800, #1e293b)' }}>
              {formatCurrency(row.amount_or_rate)}
            </span>
          );
        }
        if (row.calculation_type === 'FORMULA') {
          return (
            <code style={{ fontSize: '0.75rem', backgroundColor: 'var(--neutral-100, #f1f5f9)', padding: '2px 6px', borderRadius: '4px' }}>
              {row.formula || '—'}
            </code>
          );
        }
        return '—';
      },
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
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {canManage ? (
            <>
              <Button variant="outline" size="sm" onClick={() => openEditModal(row)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => confirmDelete(row)}>
                Delete
              </Button>
            </>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400, #94a3b8)' }}>View Only</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Salary Rules Engine"
      subtitle="Component rules specifying allowance additions, gross formulas, tax withholdings, and statutory deductions evaluated in sequence"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          {canManage && (
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              + Add Salary Rule
            </Button>
          )}
        </div>
      }
    >
      {/* Notice for View-Only roles */}
      {!canManage && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.8125rem', color: '#1e40af' }}>
          <strong>View-Only Notice:</strong> You are viewing salary calculation rules under the {role} role. Modifications require Payroll Manager or Administrator privileges.
        </div>
      )}

      {/* Structure Selector Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-700, #334155)' }}>
              Filter by Structure:
            </label>
            <select
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--neutral-300, #cbd5e1)',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                fontWeight: 500,
              }}
              value={selectedStructureId}
              onChange={(e) => setSelectedStructureId(e.target.value)}
            >
              {structures.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)' }}>
            Showing <strong>{sortedRules.length}</strong> rules sorted by sequence order (Ascending)
          </div>
        </div>
      </Card>

      {error && (
        <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert type="success" title="Success" style={{ marginBottom: '16px' }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      <Card noPadding>
        {loading ? (
          <Loading message="Loading calculation rules from PostgreSQL..." />
        ) : sortedRules.length === 0 ? (
          <EmptyState
            title="No salary rules found"
            description="Add component calculation rules to define allowances, gross, deductions, and net take-home."
            action={
              canManage && (
                <Button variant="primary" size="sm" onClick={openCreateModal}>
                  Create First Rule
                </Button>
              )
            }
          />
        ) : (
          <Table columns={columns} data={sortedRules} />
        )}
      </Card>

      {/* CREATE / EDIT RULE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'CREATE' ? 'Add Salary Rule' : 'Edit Salary Rule'}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleFormSubmit}>
              {modalMode === 'CREATE' ? 'Add Rule' : 'Save Rule'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit}>
          {modalError && (
            <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.8125rem' }}>
              {modalError}
            </div>
          )}

          {/* Assigned Structure */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-700, #334155)', marginBottom: '6px' }}>
              Salary Structure *
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--neutral-300, #cbd5e1)',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
              }}
              value={formData.salary_structure_id}
              onChange={(e) => setFormData({ ...formData, salary_structure_id: e.target.value })}
            >
              {structures.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Rule Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. House Rent Allowance"
            />
            <Input
              label="Rule Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. HRA"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-700, #334155)', marginBottom: '6px' }}>
                Category *
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--neutral-300, #cbd5e1)',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                }}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="BASIC">BASIC (Base Salary)</option>
                <option value="ALLOWANCE">ALLOWANCE (Earning)</option>
                <option value="GROSS">GROSS (Total Earnings)</option>
                <option value="DEDUCTION">DEDUCTION (Tax / Statutory)</option>
                <option value="NET">NET (Take-Home)</option>
                <option value="COMPANY_CONTRIBUTION">COMPANY_CONTRIBUTION (Employer)</option>
              </select>
            </div>

            <Input
              label="Sequence Order"
              type="number"
              required
              value={formData.sequence_order}
              onChange={(e) => setFormData({ ...formData, sequence_order: parseInt(e.target.value, 10) || 10 })}
              placeholder="10, 20, 30..."
            />
          </div>

          {/* Calculation Type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-700, #334155)', marginBottom: '6px' }}>
              Calculation Type *
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="calc_type"
                  value="FIXED"
                  checked={formData.calculation_type === 'FIXED'}
                  onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
                />
                Fixed Amount (₹)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="calc_type"
                  value="PERCENTAGE"
                  checked={formData.calculation_type === 'PERCENTAGE'}
                  onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
                />
                Percentage (%)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="calc_type"
                  value="FORMULA"
                  checked={formData.calculation_type === 'FORMULA'}
                  onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
                />
                Formula Expression
              </label>
            </div>
          </div>

          {/* Dynamic Configuration based on Calculation Type */}
          {formData.calculation_type === 'FIXED' && (
            <Input
              label="Fixed Amount in INR (₹)"
              type="number"
              required
              value={formData.amount_or_rate}
              onChange={(e) => setFormData({ ...formData, amount_or_rate: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 30000 or 3000"
            />
          )}

          {formData.calculation_type === 'PERCENTAGE' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Percentage Rate (%)"
                type="number"
                required
                value={formData.amount_or_rate}
                onChange={(e) => setFormData({ ...formData, amount_or_rate: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 40 for 40% or 12 for 12%"
              />
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-700, #334155)', marginBottom: '6px' }}>
                  Percentage Base *
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--neutral-300, #cbd5e1)',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                  }}
                  value={formData.percentage_base}
                  onChange={(e) => setFormData({ ...formData, percentage_base: e.target.value })}
                >
                  <option value="BASIC">BASIC (Basic Salary)</option>
                  <option value="GROSS">GROSS (Gross Earnings)</option>
                  <option value="WAGE_RATE">WAGE_RATE (Contract Wage)</option>
                  {rules
                    .filter((r) => r.code !== formData.code)
                    .map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.code} ({r.name})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {formData.calculation_type === 'FORMULA' && (
            <div>
              <Input
                label="Formula Expression"
                required
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                placeholder="e.g. BASIC + HRA + TRANSPORT + SPL_ALLOW"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', marginTop: '-8px', marginBottom: '12px' }}>
                Supported operators: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>( )</code>. Use rule codes previously computed.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <input
              type="checkbox"
              id="rule_active_toggle"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <label htmlFor="rule_active_toggle" style={{ fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
              Active (Include in salary calculation pipeline)
            </label>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Rule Deletion"
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleDeleteRule}>
              Delete Rule
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--neutral-700, #334155)', margin: 0 }}>
          Are you sure you want to delete rule <strong>{ruleToDelete?.name}</strong> ({ruleToDelete?.code})? This rule will no longer be computed during salary calculations.
        </p>
      </Modal>
    </PageContainer>
  );
}
