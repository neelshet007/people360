import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Shared AppLayout Component
 * Owner: P1 (Core HR)
 */
export default function AppLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, backgroundColor: 'var(--neutral-50, #f8fafc)', minHeight: 'calc(100vh - 60px)' }}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
