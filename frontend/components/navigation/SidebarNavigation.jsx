import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Tooltip from '../ui/Tooltip';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/auth';

/**
 * Shared SidebarNavigation Component
 * Role-aware navigation dynamically reflecting authenticated permissions
 */
export default function SidebarNavigation({ collapsed = false, onNavigate }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, role } = useAuth();

  let navSections = [];

  if (role === ROLES.EMPLOYEE) {
    navSections = [
      {
        heading: 'Personal Overview',
        items: [
          { label: 'My Dashboard', href: '/dashboard', icon: '📊' },
        ],
      },
      {
        heading: 'Self Service',
        items: [
          ...(user?.employeeId ? [{ label: 'My Profile', href: `/employees/${user.employeeId}`, icon: '👤' }] : []),
          { label: 'My Attendance', href: '/my-attendance', icon: '🕐' },
          { label: 'My Time Off', href: '/time-off', icon: '🏖️' },
          { label: 'My Payslips', href: '/payroll/payslips', icon: '📄' },
        ],
      },
    ];
  } else if (role === ROLES.HR_MANAGER) {
    navSections = [
      {
        heading: 'General',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        ],
      },
      {
        heading: 'Core HR',
        items: [
          { label: 'Employees', href: '/employees', icon: '👥' },
          { label: 'Contracts', href: '/contracts', icon: '📝' },
          { label: 'Working Schedules', href: '/schedules', icon: '⏰' },
        ],
      },
      {
        heading: 'HR Operations',
        items: [
          { label: 'Attendance', href: '/attendance', icon: '📅' },
          { label: 'Time Off Requests', href: '/time-off', icon: '🏖️' },
        ],
      },
    ];
  } else if (role === ROLES.HR_PAYROLL_USER) {
    navSections = [
      {
        heading: 'General',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        ],
      },
      {
        heading: 'Core HR',
        items: [
          { label: 'Employees', href: '/employees', icon: '👥' },
          { label: 'Contracts', href: '/contracts', icon: '📝' },
          { label: 'Working Schedules', href: '/schedules', icon: '⏰' },
        ],
      },
      {
        heading: 'HR Operations',
        items: [
          { label: 'Attendance', href: '/attendance', icon: '📅' },
          { label: 'Time Off', href: '/time-off', icon: '🏖️' },
        ],
      },
      {
        heading: 'Payroll Batches',
        items: [
          { label: 'Payruns', href: '/payroll/payruns', icon: '💳' },
          { label: 'Payslips', href: '/payroll/payslips', icon: '📄' },
          { label: 'Salary Structures', href: '/payroll/salary-structures', icon: '🏛️' },
          { label: 'Salary Rules', href: '/payroll/salary-rules', icon: '📏' },
        ],
      },
    ];
  } else {
    // HR_PAYROLL_MANAGER and ADMIN (Full HR + Payroll)
    navSections = [
      {
        heading: 'General',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        ],
      },
      {
        heading: 'Core HR',
        items: [
          { label: 'Employees', href: '/employees', icon: '👥' },
          { label: 'Contracts', href: '/contracts', icon: '📝' },
          { label: 'Working Schedules', href: '/schedules', icon: '⏰' },
        ],
      },
      {
        heading: 'HR Operations',
        items: [
          { label: 'Attendance', href: '/attendance', icon: '📅' },
          { label: 'Time Off', href: '/time-off', icon: '🏖️' },
        ],
      },
      {
        heading: 'Compensation & Payroll',
        items: [
          { label: 'Salary Structures', href: '/payroll/salary-structures', icon: '🏛️' },
          { label: 'Salary Rules', href: '/payroll/salary-rules', icon: '📏' },
          { label: 'Payruns', href: '/payroll/payruns', icon: '💳' },
          { label: 'Payslips', href: '/payroll/payslips', icon: '📄' },
        ],
      },
    ];
  }

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
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              const linkContent = (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? '0' : '10px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '9px 0' : '8px 12px',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary-700, #4338ca)' : 'var(--neutral-700, #334155)',
                    backgroundColor: isActive ? 'var(--primary-50, #eef2ff)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href} content={item.label} position="right">
                    {linkContent}
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
