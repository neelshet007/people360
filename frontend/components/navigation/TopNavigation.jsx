import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared TopNavigation Component
 * Owner: P1 (Core HR)
 */
export default function TopNavigation() {
  return (
    <header
      style={{
        height: '60px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-600, #4338ca)' }}>
          PeoplePay360
        </Link>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '2px 6px',
            backgroundColor: 'var(--neutral-100, #f1f5f9)',
            borderRadius: '4px',
            color: 'var(--neutral-600, #475569)',
          }}
        >
          Integrated Platform
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          to="/login"
          style={{
            fontSize: '0.875rem',
            color: 'var(--neutral-600, #475569)',
            fontWeight: 500,
          }}
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
