import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import payrollApi from '../api/payrollApi';
import { PlusIcon } from '../../../components/ui/Icons';

/**
 * Salary Structures Page — PeoplePay360
 * Owner: P3 (Payroll)
 * Comprehensive management of compensation blueprints and rule collections
 */
export default function SalaryStructuresPage() {
  const navigate = useNavigate();
  const { hasPermission, role } = useAuth();
  const canManage = hasPermission('salary.manage');

  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // View Rules Modal State
  const [viewRulesModalOpen, setViewRulesModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [structureRules, setStructureRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);

  const loadStructures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollApi.getSalaryStructures();
      setStructures(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load salary structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setCurrentId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (structure) => {
    setModalMode('EDIT');
    setCurrentId(structure.id);
    setFormData({
      name: structure.name || '',
      code: structure.code || '',
      description: structure.description || '',
      is_active: structure.is_active !== undefined ? structure.is_active : true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      setModalError('Structure name and code are required');
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      if (modalMode === 'CREATE') {
        await payrollApi.createSalaryStructure(formData);
        setSuccessMsg(`Salary structure '${formData.name}' created successfully`);
      } else {
        await payrollApi.updateSalaryStructure(currentId, formData);
        setSuccessMsg(`Salary structure '${formData.name}' updated successfully`);
      }
      setIsModalOpen(false);
      loadStructures();
    } catch (err) {
      setModalError(err.message || 'Failed to save salary structure');
    } finally {
      setSubmitting(false);
    }
  };

  const openRulesViewer = async (structure) => {
    setSelectedStructure(structure);
    setViewRulesModalOpen(true);
    setLoadingRules(true);
    try {
      const res = await payrollApi.getSalaryStructureById(structure.id);
      setStructureRules(res.data?.rules || []);
    } catch (err) {
      setStructureRules([]);
    } finally {
      setLoadingRules(false);
    }
  };

  const columns = [
    {
      header: 'Structure Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>{row.description || 'No description'}</div>
        </div>
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
      header: 'Rules Attached',
      accessor: 'rule_count',
      render: (row) => (
        <Badge variant="primary">
          {row.rule_count || 0} Rules
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'} dot>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Created On',
      accessor: 'created_at',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)' }}>
          {row.created_at ? row.created_at.split('T')[0] : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => openRulesViewer(row)}>
            View Rules
          </Button>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => openEditModal(row)}>
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Salary Structures"
      subtitle="Compensation blueprints defining salary rule collections and gross-to-net models across employee tiers"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/payroll/salary-rules')}>
            Manage Salary Rules →
          </Button>
          {canManage && (
            <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={openCreateModal}>
              New Structure
            </Button>
          )}
        </div>
      }
    >
      {/* Notice for View-Only roles */}
      {!canManage && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.8125rem', color: '#1e40af' }}>
          <strong>View-Only Notice:</strong> You are viewing salary configurations under the {role} role. Modifications require Payroll Manager or Administrator privileges.
        </div>
      )}

      {error && (
        <Alert type="danger" title="Sync Error" style={{ marginBottom: '16px' }}>
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
          <Loading message="Loading salary structures from PostgreSQL..." />
        ) : structures.length === 0 ? (
          <EmptyState
            title="No salary structures configured"
            description="Salary structures define the compensation frameworks used across payroll calculation cycles."
            action={
              canManage && (
                <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={openCreateModal}>
                  Create First Structure
                </Button>
              )
            }
          />
        ) : (
          <Table columns={columns} data={structures} />
        )}
      </Card>

      {/* CREATE / EDIT STRUCTURE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'CREATE' ? 'Create Salary Structure' : 'Edit Salary Structure'}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleFormSubmit}>
              {modalMode === 'CREATE' ? 'Create Structure' : 'Save Changes'}
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
          <Input
            label="Structure Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Standard Monthly Salary — Corporate"
          />
          <Input
            label="Structure Code"
            required
            disabled={modalMode === 'EDIT'}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. IN-CORP-STD"
          />
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-700, #334155)', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--neutral-300, #cbd5e1)',
                fontSize: '0.875rem',
                minHeight: '70px',
                fontFamily: 'inherit',
              }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this compensation framework..."
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <input
              type="checkbox"
              id="is_active_toggle"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <label htmlFor="is_active_toggle" style={{ fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
              Active (Available for employment contracts)
            </label>
          </div>
        </form>
      </Modal>

      {/* VIEW ORDERED RULES MODAL */}
      <Modal
        isOpen={viewRulesModalOpen}
        onClose={() => setViewRulesModalOpen(false)}
        title={`Ordered Rules: ${selectedStructure?.name || 'Salary Structure'}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)' }}>
              Execution Order: Ascending sequence (10 → 90)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {canManage && (
                <Button variant="primary" size="sm" onClick={() => { setViewRulesModalOpen(false); navigate('/payroll/salary-rules'); }}>
                  Edit Rules in Rules Hub →
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setViewRulesModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        {loadingRules ? (
          <Loading message="Loading ordered rules from PostgreSQL..." />
        ) : structureRules.length === 0 ? (
          <EmptyState
            title="No rules assigned"
            description="This structure currently has no calculation rules attached."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--neutral-200, #e2e8f0)', textAlign: 'left', color: 'var(--neutral-600, #475569)' }}>
                  <th style={{ padding: '8px' }}>Seq</th>
                  <th style={{ padding: '8px' }}>Rule Name & Code</th>
                  <th style={{ padding: '8px' }}>Category</th>
                  <th style={{ padding: '8px' }}>Calculation</th>
                  <th style={{ padding: '8px' }}>Value / Formula</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {structureRules
                  .slice()
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--neutral-100, #f1f5f9)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: 'var(--primary-700, #4338ca)' }}>
                        #{r.sequence_order}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <code style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>{r.code}</code>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <Badge
                          variant={
                            r.category === 'BASIC'
                              ? 'primary'
                              : r.category === 'ALLOWANCE'
                              ? 'success'
                              : r.category === 'DEDUCTION'
                              ? 'danger'
                              : r.category === 'GROSS'
                              ? 'info'
                              : r.category === 'NET'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {r.category}
                        </Badge>
                      </td>
                      <td style={{ padding: '8px' }}>{r.calculation_type}</td>
                      <td style={{ padding: '8px' }}>
                        {r.calculation_type === 'PERCENTAGE' && (
                          <span style={{ fontWeight: 600 }}>
                            {r.amount_or_rate}% of {r.percentage_base || 'BASIC'}
                          </span>
                        )}
                        {r.calculation_type === 'FIXED' && (
                          <span style={{ fontWeight: 600 }}>
                            ₹{Number(r.amount_or_rate).toLocaleString('en-IN')}
                          </span>
                        )}
                        {r.calculation_type === 'FORMULA' && (
                          <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {r.formula || '—'}
                          </code>
                        )}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <Badge variant={r.is_active !== false ? 'success' : 'neutral'} dot>
                          {r.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
