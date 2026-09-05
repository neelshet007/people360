import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function ProtectedRoute({ children, requiredPermission, allowedRoles }) {
  const { isAuthenticated, user, role, hasPermission, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasAnyRole(allowedRoles)) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '40px auto' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-900, #0f172a)', margin: 0 }}>
                403 — Access Restricted
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)', marginTop: '8px', lineHeight: 1.5 }}>
                Your current account role (<strong>{role}</strong>) does not have authorization to view this area.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Link to="/dashboard">
                  <Button variant="primary">Return to Dashboard</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary">Switch Account</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      );
    }
  }

  // Check granular permission if specified
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '40px auto' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-900, #0f172a)', margin: 0 }}>
                403 — Permission Denied
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)', marginTop: '8px', lineHeight: 1.5 }}>
                Permission <code>{requiredPermission}</code> is required to access this resource.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Link to="/dashboard">
                  <Button variant="primary">Return to Dashboard</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      );
    }
  }

  return children;
}
