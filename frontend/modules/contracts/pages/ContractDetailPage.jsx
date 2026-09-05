import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Loading from '../../../components/feedback/Loading';
import ErrorState from '../../../components/feedback/ErrorState';
import ContractStatusBadge from '../components/ContractStatusBadge';
import { useContract } from '../hooks/useContract';
import { formatDate, formatCurrency } from '../../../lib/utils';

/**
 * Contract Detail Page
 * Owner: P1 (Core HR)
 */
export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { contract, loading, error, refetch } = useContract(id);

  if (loading) {
    return (
      <PageContainer title="Contract Details">
        <Loading message="Loading contract details..." />
      </PageContainer>
    );
  }

  if (error || !contract) {
    return (
      <PageContainer title="Contract Details">
        <ErrorState
          title="Contract Not Found"
          message={error || `Could not find contract #${id}.`}
          onRetry={refetch}
        />
        <div style={{ marginTop: '16px' }}>
          <Button variant="secondary" onClick={() => navigate('/contracts')}>
            Back to Contracts
          </Button>
        </div>
      </PageContainer>
    );
  }

  const refTitle = contract.reference || `Contract #${contract.id}`;

  return (
    <PageContainer
      breadcrumbs={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/contracts" style={{ color: 'var(--primary-600, #4f46e5)' }}>
            Contracts
          </Link>
          <span>/</span>
          <span>{refTitle}</span>
        </div>
      }
      title={refTitle}
      subtitle="Employment agreement terms, wage compensation structure, and schedule bindings"
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => navigate('/contracts')}>
            Back
          </Button>
          <Button
            variant="primary"
            icon="✏️"
            onClick={() => navigate(`/contracts/${id}/edit`)}
          >
            Edit Contract
          </Button>
        </div>
      }
    >
      {/* Overview Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{refTitle}</h2>
              <ContractStatusBadge status={contract.status} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px', margin: 0 }}>
              Contract Type: {contract.contract_type || 'Full-Time'}
            </p>
          </div>

          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--primary-50, #eef2ff)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--primary-100, #e0e7ff)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-700, #4338ca)', display: 'block', fontWeight: 600 }}>
              Agreed Wage Rate
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--neutral-900, #0f172a)' }}>
              {contract.wage_rate ? formatCurrency(Number(contract.wage_rate)) : '$0.00'}
              <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', fontWeight: 400, marginLeft: '4px' }}>
                / {contract.wage_type || 'month'}
              </span>
            </span>
          </div>
        </div>
      </Card>

      {/* Grid: Agreement Terms + Linked Entities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <Card title="Terms of Employment">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Start Date</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatDate(contract.start_date)}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>End Date</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {contract.end_date ? formatDate(contract.end_date) : 'Indefinite / Permanent'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Wage Type</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {contract.wage_type === 'hourly' ? 'Hourly Rate' : 'Fixed Monthly Salary'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Trial / Probation Period</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {contract.probation_months ? `${contract.probation_months} Months` : 'None'}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Linked Workforce Master">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Assigned Employee</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>
                {contract.employee_name || `Employee #${contract.employee_id || '-'}`}
              </div>
              {contract.employee_id && (
                <Link
                  to={`/employees/${contract.employee_id}`}
                  style={{ fontSize: '0.8125rem', color: 'var(--primary-600, #4f46e5)', fontWeight: 500 }}
                >
                  View Employee Master Profile →
                </Link>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--neutral-100, #f1f5f9)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>Working Schedule</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>
                {contract.schedule_name || 'Standard Full-Time Schedule (40h/week)'}
              </div>
              <Link
                to="/schedules"
                style={{ fontSize: '0.8125rem', color: 'var(--primary-600, #4f46e5)', fontWeight: 500 }}
              >
                View Working Schedule Policy →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
