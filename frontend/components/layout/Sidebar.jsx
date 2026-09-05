import React from 'react';
import SidebarNavigation from '../navigation/SidebarNavigation';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from '../ui/Icons';

/**
 * Shared Sidebar Component
 * Owner: P1 (Core HR)
 */
export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  mobileOpen = false,
  onCloseMobile,
}) {
  const sidebarWidth = collapsed ? '64px' : '240px';

  // Desktop sidebar rendering
  const desktopSidebar = (
    <aside
      style={{
        width: sidebarWidth,
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-subtle, #e2e8f0)',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-base)',
        position: 'sticky',
        top: '60px',
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
        zIndex: 20,
      }}
      className="desktop-sidebar"
      aria-label="Application sidebar"
    >
      <div style={{ flex: 1 }}>
        <SidebarNavigation collapsed={collapsed} />
      </div>

      {/* Collapse Toggle Footer */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: 'var(--radius-md, 6px)',
            padding: '5px 8px',
            color: 'var(--text-muted, #64748b)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)';
            e.currentTarget.style.color = 'var(--text-main, #0f172a)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted, #64748b)';
          }}
        >
          {collapsed ? <ChevronRightIcon size={15} /> : <ChevronLeftIcon size={15} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );

  // Mobile drawer rendering
  if (isMobile) {
    if (!mobileOpen) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
          display: 'flex',
        }}
        onClick={onCloseMobile}
      >
        <div
          style={{
            width: '260px',
            backgroundColor: '#ffffff',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--brand-900, #0f172a)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                P
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main, #0f172a)', letterSpacing: '-0.02em' }}>
                PeoplePay360
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              aria-label="Close mobile sidebar"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--neutral-400, #94a3b8)',
                padding: '4px',
              }}
            >
              <XIcon size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SidebarNavigation collapsed={false} onNavigate={onCloseMobile} />
          </div>
        </div>
      </div>
    );
  }

  return desktopSidebar;
}
