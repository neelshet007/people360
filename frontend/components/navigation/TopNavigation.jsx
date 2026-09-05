import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import { getStoredToken, clearStoredToken } from '../../lib/auth';
import AttendanceWidget from '../../modules/attendance/components/AttendanceWidget';

/**
 * Shared TopNavigation / Navbar Component
 * Owner: P1 (Core HR)
 */
export default function TopNavigation({ onToggleMobileSidebar }) {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const token = getStoredToken();

  // Route title helper
  const getPageTitle = (path) => {
    if (path.startsWith('/employees')) return 'Core HR / Employees';
    if (path.startsWith('/contracts')) return 'Core HR / Contracts';
    if (path.startsWith('/schedules')) return 'Core HR / Working Schedules';
    if (path.startsWith('/attendance')) return 'HR Operations / Attendance';
    if (path.startsWith('/time-off')) return 'HR Operations / Time Off';
    if (path.startsWith('/payroll')) return 'Payroll Operations';
    return 'Dashboard Overview';
  };

  const notifications = [
    { id: 1, title: 'New Employee Onboarded', time: '10m ago', unread: true },
    { id: 2, title: 'Contract Expiring in 14 Days', time: '1h ago', unread: true },
    { id: 3, title: 'Working Schedule Updated', time: '1d ago', unread: false },
  ];

  const userMenuItems = [
    {
      label: 'My Profile',
      icon: '👤',
      onClick: () => {
        // Navigate or open profile modal
      },
    },
    {
      label: 'Platform Settings',
      icon: '⚙️',
      onClick: () => {
        // Platform settings
      },
    },
    { divider: true },
    {
      label: token ? 'Sign Out' : 'Sign In',
      danger: !!token,
      icon: token ? '🚪' : '🔑',
      onClick: () => {
        if (token) {
          clearStoredToken();
          window.location.href = '/login';
        } else {
          window.location.href = '/login';
        }
      },
    },
  ];

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Left side: Mobile Toggle + Logo + Current Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--neutral-200, #e2e8f0)',
            backgroundColor: '#ffffff',
            color: 'var(--neutral-700, #334155)',
            cursor: 'pointer',
            fontSize: '1.125rem',
          }}
          className="mobile-nav-toggle"
        >
          ☰
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
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-600, #4f46e5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
            }}
          >
            P
          </div>
          <span
            style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--neutral-900, #0f172a)',
              letterSpacing: '-0.02em',
            }}
          >
            PeoplePay<span style={{ color: 'var(--primary-600, #4f46e5)' }}>360</span>
          </span>
        </Link>

        <div
          style={{
            height: '20px',
            width: '1px',
            backgroundColor: 'var(--neutral-200, #e2e8f0)',
            margin: '0 4px',
          }}
          className="header-divider"
        />

        <span
          style={{
            fontSize: '0.8125rem',
            color: 'var(--neutral-500, #64748b)',
            fontWeight: 500,
          }}
          className="header-context-badge"
        >
          {getPageTitle(location.pathname)}
        </span>
      </div>

      {/* Right side: Attendance Widget + Global Search + Notifications + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <AttendanceWidget />
        {/* Quick Search Placeholder UI */}
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
              fontSize: '0.875rem',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="search"
            placeholder="Search records..."
            aria-label="Quick search"
            style={{
              padding: '6px 12px 6px 32px',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-full, 9999px)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              width: '180px',
              outline: 'none',
              transition: 'all var(--transition-fast)',
            }}
            onFocus={(e) => {
              e.target.style.width = '240px';
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderColor = 'var(--primary-400, #818cf8)';
            }}
            onBlur={(e) => {
              e.target.style.width = '180px';
              e.target.style.backgroundColor = 'var(--neutral-50, #f8fafc)';
              e.target.style.borderColor = 'var(--neutral-200, #e2e8f0)';
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
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full, 9999px)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
              color: 'var(--neutral-600, #475569)',
              transition: 'all var(--transition-fast)',
            }}
          >
            🔔
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger, #ef4444)',
                border: '2px solid #ffffff',
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                marginTop: '8px',
                width: '300px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--neutral-200, #e2e8f0)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--neutral-100, #f1f5f9)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--primary-600, #4f46e5)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </span>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--neutral-100, #f1f5f9)',
                      backgroundColor: n.unread ? 'var(--primary-50, #eef2ff)' : '#ffffff',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowNotifications(false)}
                  >
                    <div style={{ fontSize: '0.8125rem', fontWeight: n.unread ? 600 : 500 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400, #94a3b8)', marginTop: '2px' }}>
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
                padding: '4px 8px',
                borderRadius: 'var(--radius-full, 9999px)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Avatar name="Admin User" size="sm" status="online" />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }} className="header-user-text">
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-900, #0f172a)', lineHeight: 1.2 }}>
                  HR Admin
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--neutral-500, #64748b)' }}>
                  P1 Core HR
                </span>
              </div>
              <span style={{ fontSize: '0.625rem', color: 'var(--neutral-400, #94a3b8)' }}>▼</span>
            </div>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  );
}
