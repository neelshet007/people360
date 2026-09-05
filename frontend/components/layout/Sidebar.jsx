import React from 'react';
import SidebarNavigation from '../navigation/SidebarNavigation';

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
  const sidebarWidth = collapsed ? '72px' : '260px';

  // Desktop sidebar rendering
  const desktopSidebar = (
    <aside
      style={{
        width: sidebarWidth,
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--neutral-200, #e2e8f0)',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-base)',
        position: 'sticky',
        top: '64px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
      }}
      className="desktop-sidebar"
    >
      <div style={{ flex: 1 }}>
        <SidebarNavigation collapsed={collapsed} />
      </div>

      {/* Collapse Toggle Footer */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--neutral-200, #e2e8f0)',
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
            border: '1px solid var(--neutral-200, #e2e8f0)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '6px 10px',
            color: 'var(--neutral-600, #475569)',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span>{collapsed ? '▶' : '◀'}</span>
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
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
          display: 'flex',
        }}
        onClick={onCloseMobile}
      >
        <div
          style={{
            width: '280px',
            backgroundColor: '#ffffff',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-600, #4f46e5)' }}>
              PeoplePay360
            </span>
            <button
              onClick={onCloseMobile}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: 'var(--neutral-400, #94a3b8)',
              }}
            >
              ✕
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
