import React from 'react';

/**
 * Shared Tabs Component
 * Owner: P1 (Core HR)
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
        gap: '4px',
        overflowX: 'auto',
        ...style,
      }}
      className={`tabs-container ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            data-tab-id={tab.id}
            type="button"
            onClick={() => onChange && onChange(tab.id)}
            style={{
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--primary-600, #4f46e5)' : 'var(--neutral-600, #475569)',
              borderBottom: isActive ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full, 9999px)',
                  backgroundColor: isActive ? 'var(--primary-100, #e0e7ff)' : 'var(--neutral-100, #f1f5f9)',
                  color: isActive ? 'var(--primary-700, #4338ca)' : 'var(--neutral-600, #475569)',
                  fontWeight: 600,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
