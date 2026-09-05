import React from 'react';

/**
 * Enterprise Data Table Component
 * Features:
 * - Sticky header styling with uppercase muted column titles
 * - Numeric right-alignment support (col.align === 'right')
 * - Tabular figures for financial and date precision
 * - Subtle hover transitions and interactive row callbacks
 */
export default function Table({
  columns = [],
  data = [],
  emptyText = 'No records found',
  onRowClick = null,
  loading = false,
  className = '',
  style = {},
}) {
  return (
    <div style={style} className={`pp-table-container ${className}`}>
      <table className="pp-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || col.accessor || idx}
                className="pp-th"
                style={{
                  textAlign: col.align || 'left',
                  width: col.width || 'auto',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="pp-td"
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted, #64748b)',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '15px',
                      height: '15px',
                      border: '2px solid var(--primary-600, #2563eb)',
                      borderRightColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                    aria-hidden="true"
                  />
                  <span>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="pp-td"
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted, #64748b)',
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`pp-tr ${onRowClick ? 'pp-tr-interactive' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || col.accessor || colIdx}
                    className="pp-td"
                    style={{
                      textAlign: col.align || 'left',
                      fontVariantNumeric: col.numeric ? 'tabular-nums' : 'inherit',
                    }}
                  >
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
