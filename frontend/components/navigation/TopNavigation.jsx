import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import { useAuth } from '../../context/AuthContext';
import AttendanceWidget from '../../modules/attendance/components/AttendanceWidget';
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
  UserIcon,
  DashboardIcon,
  LogOutIcon,
  LogInIcon,
  ChevronDownIcon,
} from '../ui/Icons';

/**
 * Enterprise TopNavigation Header Component
 * Precision layout with route context, search, attendance widget, notifications, and user session controls
 */
export default function TopNavigation({ onToggleMobileSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout, isAuthenticated } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Route context helper
  const getContextParts = (path) => {
    if (path.startsWith('/employees/new')) return ['Workforce', 'New Employee'];
    if (path.startsWith('/employees/')) return ['Workforce', 'Employee Profile'];
    if (path.startsWith('/employees')) return ['Workforce', 'Employees'];
    if (path.startsWith('/contracts/new')) return ['Workforce', 'Issue Contract'];
    if (path.startsWith('/contracts/')) return ['Workforce', 'Contract Details'];
    if (path.startsWith('/contracts')) return ['Workforce', 'Contracts'];
    if (path.startsWith('/schedules')) return ['Workforce', 'Working Schedules'];
    if (path.startsWith('/attendance')) return ['Time & Leave', 'Attendance Tracking'];
    if (path.startsWith('/my-attendance')) return ['Self Service', 'My Attendance'];
    if (path.startsWith('/time-off')) return ['Time & Leave', 'Time Off Requests'];
    if (path.startsWith('/comp-off')) return ['Time & Leave', 'Compensatory Off'];
    if (path.startsWith('/payroll/payruns/')) return ['Compensation', 'Payrun Batch'];
    if (path.startsWith('/payroll/payruns')) return ['Compensation', 'Payruns'];
    if (path.startsWith('/payroll/bonus')) return ['Compensation', 'Bonus Allocation'];
    if (path.startsWith('/payroll/payslips')) return ['Compensation', 'Itemized Payslips'];
    if (path.startsWith('/payroll/salary-structures')) return ['Compensation', 'Salary Structures'];
    if (path.startsWith('/payroll/salary-rules')) return ['Compensation', 'Calculation Rules'];
    return ['Platform', 'Dashboard'];
  };

  const contextParts = getContextParts(location.pathname);

  const notifications = [
    { id: 1, title: 'Contract Expiring in 14 Days', time: '1h ago', unread: true },
    { id: 2, title: 'October Payroll Batch Ready', time: '2h ago', unread: true },
    { id: 3, title: 'Leave Request Awaiting Review', time: '1d ago', unread: false },
  ];

  const userMenuItems = [
    ...(user?.employeeId
      ? [
          {
            label: 'My Profile',
            icon: <UserIcon size={16} />,
            onClick: () => navigate(`/employees/${user.employeeId}`),
          },
        ]
      : []),
    {
      label: 'Platform Dashboard',
      icon: <DashboardIcon size={16} />,
      onClick: () => navigate('/dashboard'),
    },
    { divider: true },
    {
      label: isAuthenticated ? 'Sign Out' : 'Sign In',
      danger: isAuthenticated,
      icon: isAuthenticated ? <LogOutIcon size={16} /> : <LogInIcon size={16} />,
      onClick: () => {
        if (isAuthenticated) {
          logout();
        } else {
          navigate('/login');
        }
      },
    },
  ];

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-xs)',
      }}
      aria-label="Application header"
    >
      {/* Left side: Mobile Toggle + Logo + Breadcrumb Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md, 6px)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: '#ffffff',
            color: 'var(--text-secondary, #475569)',
            cursor: 'pointer',
          }}
          className="mobile-nav-toggle"
        >
          <MenuIcon size={18} />
        </button>

        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--brand-900, #0f172a)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.875rem',
              letterSpacing: '-0.03em',
            }}
          >
            P
          </div>
          <span
            style={{
              fontSize: '1.0625rem',
              fontWeight: 700,
              color: 'var(--brand-900, #0f172a)',
              letterSpacing: '-0.02em',
            }}
          >
            PeoplePay<span style={{ color: 'var(--primary-600, #2563eb)' }}>360</span>
          </span>
        </Link>

        <div
          style={{
            height: '18px',
            width: '1px',
            backgroundColor: 'var(--border-subtle, #e2e8f0)',
            margin: '0 4px',
          }}
          className="header-divider"
        />

        {/* Crisp Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }} className="header-context-badge">
          <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
            {contextParts[0]}
          </span>
          <span style={{ color: 'var(--neutral-400, #94a3b8)', fontSize: '0.75rem' }}>/</span>
          <span style={{ color: 'var(--text-main, #0f172a)', fontWeight: 600 }}>
            {contextParts[1]}
          </span>
        </div>
      </div>

      {/* Right side: Attendance Widget + Global Search + Notifications + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AttendanceWidget />

        {/* Quick Search */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
          className="header-search-container"
        >
          <span
            style={{
              position: 'absolute',
              left: '10px',
              color: 'var(--neutral-400, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <SearchIcon size={14} />
          </span>
          <input
            type="search"
            placeholder="Quick search..."
            aria-label="Quick search"
            style={{
              padding: '5px 10px 5px 30px',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              width: '170px',
              outline: 'none',
              transition: 'all var(--transition-fast)',
            }}
            onFocus={(e) => {
              e.target.style.width = '220px';
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderColor = 'var(--primary-600, #2563eb)';
              e.target.style.boxShadow = 'var(--focus-ring)';
            }}
            onBlur={(e) => {
              e.target.style.width = '170px';
              e.target.style.backgroundColor = 'var(--neutral-50, #f8fafc)';
              e.target.style.borderColor = 'var(--border-subtle, #e2e8f0)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Notifications Icon with Popover */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              color: 'var(--text-secondary, #475569)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-50, #f8fafc)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <BellIcon size={15} />
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-600, #2563eb)',
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                marginTop: '8px',
                width: '290px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg, 8px)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--neutral-50, #f8fafc)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main, #0f172a)' }}>
                  Platform Alerts
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--primary-600, #2563eb)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                  onClick={() => setShowNotifications(false)}
                >
                  Dismiss
                </span>
              </div>
              <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--neutral-100, #f1f5f9)',
                      backgroundColor: n.unread ? 'var(--primary-50, #eff6ff)' : '#ffffff',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowNotifications(false)}
                  >
                    <div style={{ fontSize: '0.8125rem', fontWeight: n.unread ? 600 : 500, color: 'var(--text-main, #0f172a)' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                      {n.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 6px',
                borderRadius: 'var(--radius-md, 6px)',
                cursor: 'pointer',
                border: '1px solid transparent',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)';
                e.currentTarget.style.borderColor = 'var(--border-subtle, #e2e8f0)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <Avatar name={user?.name || 'Authorized User'} size="sm" status="online" />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }} className="header-user-text">
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main, #0f172a)', lineHeight: 1.2 }}>
                  {user?.name || 'Authorized User'}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                  {role || 'EMPLOYEE'}
                </span>
              </div>
              <ChevronDownIcon size={12} color="var(--neutral-400, #94a3b8)" />
            </div>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  );
}
