import React from 'react';

/**
 * Shared Tabs Component
 * Owner: P1 (Core HR)
 */
export default function Tabs({ tabs = [], activeTab, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
        marginBottom: '16px',
        gap: '8px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary-600, #4338ca)' : '2px solid transparent',
              color: isActive ? 'var(--primary-600, #4338ca)' : 'var(--neutral-500, #64748b)',
              fontWeight: isActive ? 600 : 500,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
