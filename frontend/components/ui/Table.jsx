import React from 'react';

/**
 * Shared Table Component
 * Owner: P1 (Core HR)
 */
export default function Table({ columns = [], data = [], emptyText = 'No records found' }) {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--neutral-200, #e2e8f0)', backgroundColor: 'var(--neutral-50, #f8fafc)' }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: 'var(--neutral-600, #475569)',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--neutral-500, #64748b)',
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{ borderBottom: '1px solid var(--neutral-200, #e2e8f0)' }}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} style={{ padding: '12px 16px', color: 'var(--neutral-800, #1e293b)' }}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
