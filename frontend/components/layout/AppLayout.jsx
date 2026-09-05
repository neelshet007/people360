import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavigation from '../navigation/TopNavigation';
import Sidebar from './Sidebar';

/**
 * Shared AppLayout Component
 * Owner: P1 (Core HR)
 */
export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--neutral-50, #f8fafc)' }}>
      {/* Top Navbar */}
      <TopNavigation onToggleMobileSidebar={() => setMobileOpen(true)} />

      {/* Main Body with Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            isMobile={false}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        {isMobile && (
          <Sidebar
            isMobile={true}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />
        )}

        {/* Dynamic Page Container */}
        <main
          style={{
            flex: 1,
            backgroundColor: 'var(--neutral-50, #f8fafc)',
            minHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            width: '100%',
          }}
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
