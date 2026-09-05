import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Shared SidebarNavigation Component
 * Owner: P1 (Core HR)
 */
export default function SidebarNavigation() {
  const location = useLocation();
  const pathname = location.pathname;

  const navSections = [
    {
      heading: 'General',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
      ],
    },
    {
      heading: 'P1 — Core HR',
      items: [
        { label: 'Employees', href: '/employees', icon: '👥' },
        { label: 'Contracts', href: '/contracts', icon: '📝' },
        { label: 'Working Schedules', href: '/schedules', icon: '⏰' },
      ],
    },
    {
      heading: 'P2 — HR Operations',
      items: [
        { label: 'Attendance', href: '/attendance', icon: '📅' },
        { label: 'Time Off', href: '/time-off', icon: '🏖️' },
      ],
    },
    {
      heading: 'P3 — Payroll',
      items: [
        { label: 'Salary Structures', href: '/payroll/salary-structures', icon: '🏛️' },
        { label: 'Salary Rules', href: '/payroll/salary-rules', icon: '📏' },
        { label: 'Payruns', href: '/payroll/payruns', icon: '💳' },
        { label: 'Payslips', href: '/payroll/payslips', icon: '📄' },
      ],
    },
  ];

  return (
    <nav style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {navSections.map((sec, idx) => (
        <div key={idx}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--neutral-400, #94a3b8)',
              padding: '0 12px 8px 12px',
              letterSpacing: '0.05em',
            }}
          >
            {sec.heading}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sec.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}`));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? 'var(--primary-50, #eef2ff)' : 'transparent',
                    color: isActive ? 'var(--primary-700, #3730a3)' : 'var(--neutral-700, #334155)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
