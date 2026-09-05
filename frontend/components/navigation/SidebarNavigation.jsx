import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Tooltip from '../ui/Tooltip';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/auth';
import {
  DashboardIcon,
  UserIcon,
  UsersIcon,
  FileTextIcon,
  ClockIcon,
  CalendarIcon,
  TimeOffIcon,
  CreditCardIcon,
  BanknoteIcon,
  SlidersIcon,
  RulesIcon,
  MessageSquareIcon,
  GiftIcon,
} from '../ui/Icons';

/**
 * Enterprise Sidebar Navigation Component
 * Role-aware navigation with geometric SVG iconography and active status indicators
 */
export default function SidebarNavigation({ collapsed = false, onNavigate }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, role } = useAuth();

  let navSections = [];

  if (role === ROLES.EMPLOYEE) {
    navSections = [
      {
        heading: 'Overview',
        items: [
          { label: 'My Dashboard', href: '/dashboard', Icon: DashboardIcon },
        ],
      },
      {
        heading: 'Self Service',
        items: [
          ...(user?.employeeId ? [{ label: 'My Profile', href: `/employees/${user.employeeId}`, Icon: UserIcon }] : []),
          { label: 'My Attendance', href: '/my-attendance', Icon: ClockIcon },
          { label: 'My Time Off', href: '/time-off', Icon: TimeOffIcon },
          { label: 'Comp Off', href: '/comp-off', Icon: ClockIcon },
          { label: 'My Payslips', href: '/payroll/payslips', Icon: BanknoteIcon },
          { label: 'My Concerns', href: '/my-concerns', Icon: MessageSquareIcon },
        ],
      },
    ];
  } else if (role === ROLES.HR_MANAGER) {
    navSections = [
      {
        heading: 'Overview',
        items: [
          { label: 'Dashboard', href: '/dashboard', Icon: DashboardIcon },
        ],
      },
      {
        heading: 'Workforce',
        items: [
          { label: 'Employees', href: '/employees', Icon: UsersIcon },
          { label: 'Contracts', href: '/contracts', Icon: FileTextIcon },
          { label: 'Working Schedules', href: '/schedules', Icon: ClockIcon },
        ],
      },
      {
        heading: 'Time & Leave',
        items: [
          { label: 'Attendance', href: '/attendance', Icon: CalendarIcon },
          { label: 'Time Off Requests', href: '/time-off', Icon: TimeOffIcon },
          { label: 'Comp Off Credits', href: '/comp-off', Icon: ClockIcon },
        ],
      },
      {
        heading: 'HR Communication',
        items: [
          { label: 'Concerns', href: '/concerns', Icon: MessageSquareIcon },
        ],
      },
    ];
  } else if (role === ROLES.HR_PAYROLL_USER) {
    navSections = [
      {
        heading: 'Overview',
        items: [
          { label: 'Dashboard', href: '/dashboard', Icon: DashboardIcon },
        ],
      },
      {
        heading: 'Workforce & Shifts',
        items: [
          { label: 'Employees', href: '/employees', Icon: UsersIcon },
          { label: 'Contracts', href: '/contracts', Icon: FileTextIcon },
          { label: 'Working Schedules', href: '/schedules', Icon: ClockIcon },
          { label: 'Attendance', href: '/attendance', Icon: CalendarIcon },
          { label: 'Time Off', href: '/time-off', Icon: TimeOffIcon },
          { label: 'Comp Off Credits', href: '/comp-off', Icon: ClockIcon },
        ],
      },
      {
        heading: 'Payroll Processing',
        items: [
          { label: 'Payruns', href: '/payroll/payruns', Icon: CreditCardIcon },
          { label: 'Bonus Allocation', href: '/payroll/bonus', Icon: GiftIcon },
          { label: 'Itemized Payslips', href: '/payroll/payslips', Icon: BanknoteIcon },
          { label: 'Salary Structures', href: '/payroll/salary-structures', Icon: SlidersIcon },
          { label: 'Calculation Rules', href: '/payroll/salary-rules', Icon: RulesIcon },
        ],
      },
      {
        heading: 'HR Communication',
        items: [
          { label: 'Concerns', href: '/concerns', Icon: MessageSquareIcon },
        ],
      },
    ];
  } else {
    // HR_PAYROLL_MANAGER and ADMIN (Full HR + Payroll Command)
    navSections = [
      {
        heading: 'Operations',
        items: [
          { label: 'Dashboard', href: '/dashboard', Icon: DashboardIcon },
        ],
      },
      {
        heading: 'Workforce',
        items: [
          { label: 'Employees', href: '/employees', Icon: UsersIcon },
          { label: 'Contracts', href: '/contracts', Icon: FileTextIcon },
          { label: 'Working Schedules', href: '/schedules', Icon: ClockIcon },
        ],
      },
      {
        heading: 'Time & Attendance',
        items: [
          { label: 'Attendance Tracking', href: '/attendance', Icon: CalendarIcon },
          { label: 'Time Off Approvals', href: '/time-off', Icon: TimeOffIcon },
          { label: 'Comp Off Credits', href: '/comp-off', Icon: ClockIcon },
        ],
      },
      {
        heading: 'Compensation & Payroll',
        items: [
          { label: 'Payrun Batches', href: '/payroll/payruns', Icon: CreditCardIcon },
          { label: 'Bonus Allocation', href: '/payroll/bonus', Icon: GiftIcon },
          { label: 'Itemized Payslips', href: '/payroll/payslips', Icon: BanknoteIcon },
          { label: 'Salary Structures', href: '/payroll/salary-structures', Icon: SlidersIcon },
          { label: 'Ordered Rules', href: '/payroll/salary-rules', Icon: RulesIcon },
        ],
      },
      {
        heading: 'Communication & Cases',
        items: [
          { label: 'Concerns', href: '/concerns', Icon: MessageSquareIcon },
        ],
      },
    ];
  }

  return (
    <nav
      style={{
        padding: collapsed ? '16px 8px' : '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
      aria-label="Sidebar navigation"
    >
      {navSections.map((sec, idx) => (
        <div key={idx}>
          {!collapsed ? (
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted, #64748b)',
                padding: '0 8px 6px 8px',
                letterSpacing: '0.06em',
              }}
            >
              {sec.heading}
            </div>
          ) : (
            <div
              style={{
                height: '1px',
                backgroundColor: 'var(--border-subtle, #e2e8f0)',
                margin: '6px 4px 10px 4px',
              }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {sec.items.map((item) => {
              const isDashboard = item.href === '/dashboard';
              const isActive = isDashboard
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              const ItemIcon = item.Icon;

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
                    padding: collapsed ? '9px 0' : '7px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary-700, #1d4ed8)' : 'var(--neutral-700, #334155)',
                    backgroundColor: isActive ? 'var(--primary-50, #eff6ff)' : 'transparent',
                    borderLeft: !collapsed && isActive ? '3px solid var(--primary-600, #2563eb)' : '3px solid transparent',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ItemIcon
                    size={17}
                    color={isActive ? 'var(--primary-600, #2563eb)' : 'var(--neutral-500, #64748b)'}
                    style={{ flexShrink: 0 }}
                  />
                  {!collapsed && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
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
