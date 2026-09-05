import React from 'react';
import SidebarNavigation from '../navigation/SidebarNavigation';

/**
 * Shared Sidebar Component
 * Owner: P1 (Core HR)
 */
export default function Sidebar() {
  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--neutral-200, #e2e8f0)',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SidebarNavigation />
    </aside>
  );
}
