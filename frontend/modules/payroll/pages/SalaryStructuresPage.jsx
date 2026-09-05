import React, { useState, useEffect } from 'react';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import payrollApi from '../api/payrollApi';

/**
 * Salary Structures Page
 * Owner: P3 (Payroll)
 * Foundation view for managing compensation blueprints and rule collections
 */
export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStructures() {
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
    }
    loadStructures();
  }, []);

  const columns = [
    {
      header: 'Structure Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>{row.description}</div>
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
  ];

  return (
    <PageContainer
      title="Salary Structures"
      subtitle="Compensation blueprints defining salary rule collections across employment tiers"
    >
      {error && (
        <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      <Card noPadding>
        {loading ? (
          <Loading message="Loading salary structures..." />
        ) : structures.length === 0 ? (
          <EmptyState
            title="No salary structures configured"
            description="Salary structures will define the compensation frameworks used across payroll calculation cycles."
          />
        ) : (
          <Table columns={columns} data={structures} />
        )}
      </Card>
    </PageContainer>
  );
}
