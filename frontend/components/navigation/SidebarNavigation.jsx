import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Tooltip from '../ui/Tooltip';

/**
 * Shared SidebarNavigation Component
 * Owner: P1 (Core HR)
 */
export default function SidebarNavigation({ collapsed = false, onNavigate }) {
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
      heading: 'Core HR',
      ownerTag: 'P1',
      items: [
        { label: 'Employees', href: '/employees', icon: '👥' },
        { label: 'Contracts', href: '/contracts', icon: '📝' },
        { label: 'Working Schedules', href: '/schedules', icon: '⏰' },
      ],
    },
    {
      heading: 'HR Operations',
      ownerTag: 'P2',
      items: [
        { label: 'Attendance', href: '/attendance', icon: '📅' },
        { label: 'Time Off', href: '/time-off', icon: '🏖️' },
      ],
    },
    {
      heading: 'Payroll',
      ownerTag: 'P3',
      items: [
        { label: 'Salary Structures', href: '/payroll/salary-structures', icon: '🏛️' },
        { label: 'Salary Rules', href: '/payroll/salary-rules', icon: '📏' },
        { label: 'Payruns', href: '/payroll/payruns', icon: '💳' },
        { label: 'Payslips', href: '/payroll/payslips', icon: '📄' },
      ],
    },
  ];

  return (
    <nav
      style={{
        padding: collapsed ? '16px 4px' : '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {navSections.map((sec, idx) => (
        <div key={idx}>
          {!collapsed ? (
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--neutral-400, #94a3b8)',
                padding: '0 12px 8px 12px',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{sec.heading}</span>
              {sec.ownerTag && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: sec.ownerTag === 'P1' ? 'var(--primary-50, #eef2ff)' : 'var(--neutral-100, #f1f5f9)',
                    color: sec.ownerTag === 'P1' ? 'var(--primary-700, #4338ca)' : 'var(--neutral-500, #64748b)',
                    fontWeight: 700,
                  }}
                >
                  {sec.ownerTag}
                </span>
              )}
            </div>
          ) : (
            <div
              style={{
                height: '1px',
                backgroundColor: 'var(--neutral-200, #e2e8f0)',
                margin: '4px 8px 8px 8px',
              }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {sec.items.map((item) => {
              const isDashboard = item.href === '/dashboard';
              const isActive = isDashboard
                ? pathname === '/dashboard' || pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              const linkContent = (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => onNavigate && onNavigate()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: '12px',
                    padding: collapsed ? '10px' : '9px 12px',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? 'var(--primary-50, #eef2ff)' : 'transparent',
                    color: isActive ? 'var(--primary-700, #4338ca)' : 'var(--neutral-700, #334155)',
                    transition: 'all var(--transition-fast)',
                    borderLeft: !collapsed && isActive ? '3px solid var(--primary-600, #4f46e5)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</span>
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={item.href} content={item.label} position="right">
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
