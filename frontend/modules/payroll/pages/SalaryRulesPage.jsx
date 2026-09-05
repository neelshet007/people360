import React, { useState, useEffect } from 'react';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Loading from '../../../components/feedback/Loading';
import EmptyState from '../../../components/feedback/EmptyState';
import Alert from '../../../components/feedback/Alert';
import { formatCurrency } from '../../../lib/utils';
import payrollApi from '../api/payrollApi';

/**
 * Salary Rules Page
 * Owner: P3 (Payroll)
 * Foundation view for managing atomic compensation calculation rules
 */
export default function SalaryRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRules() {
      setLoading(true);
      setError(null);
      try {
        const res = await payrollApi.getSalaryRules();
        setRules(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load salary rules');
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, []);

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'ALLOWANCE':
        return <Badge variant="success">Allowance</Badge>;
      case 'DEDUCTION':
        return <Badge variant="danger">Deduction</Badge>;
      case 'COMPANY_CONTRIBUTION':
        return <Badge variant="info">Contribution</Badge>;
      default:
        return <Badge variant="neutral">{cat}</Badge>;
    }
  };

  const columns = [
    {
      header: 'Rule Name',
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
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-700, #334155)' }}>
          {row.calculation_type}
        </span>
      ),
    },
    {
      header: 'Rate / Amount',
      accessor: 'amount_or_rate',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {row.calculation_type === 'PERCENTAGE'
            ? `${(parseFloat(row.amount_or_rate) * 100).toFixed(1)}%`
            : formatCurrency(row.amount_or_rate)}
        </span>
      ),
    },
    {
      header: 'Sequence',
      accessor: 'sequence_order',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)' }}>
          #{row.sequence_order}
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      title="Salary Rules"
      subtitle="Component rules specifying allowance additions, tax withholdings, and statutory deductions"
    >
      {error && (
        <Alert type="danger" title="Error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      <Card noPadding>
        {loading ? (
          <Loading message="Loading calculation rules..." />
        ) : rules.length === 0 ? (
          <EmptyState
            title="No salary rules configured"
            description="Salary rules define the mathematical line items evaluated during payrun execution."
          />
        ) : (
          <Table columns={columns} data={rules} />
        )}
      </Card>
    </PageContainer>
  );
}
