import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Alert from '../../../components/feedback/Alert';

/**
 * Sign In Page — PeoplePay360
 * Real authentication against PostgreSQL backend with demo role selector for hackathon
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('admin@peoplepay360.demo');
  const [password, setPassword] = useState('Demo@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const demoAccounts = [
    {
      role: 'ADMIN',
      label: 'Admin',
      email: 'admin@peoplepay360.demo',
      color: 'var(--primary-700, #4338ca)',
      bg: 'var(--primary-50, #eef2ff)',
      desc: 'Full system & user access',
    },
    {
      role: 'HR_MANAGER',
      label: 'HR Manager',
      email: 'hr.manager@peoplepay360.demo',
      color: '#0369a1',
      bg: '#f0f9ff',
      desc: 'Staff, schedules & leave approvals',
    },
    {
      role: 'HR_PAYROLL_USER',
      label: 'Payroll User',
      email: 'payroll.user@peoplepay360.demo',
      color: '#0f766e',
      bg: '#f0fdfa',
      desc: 'Payrun execution & payslips',
    },
    {
      role: 'HR_PAYROLL_MANAGER',
      label: 'Payroll Manager',
      email: 'payroll.manager@peoplepay360.demo',
      color: '#15803d',
      bg: '#f0fdf4',
      desc: 'Full HR + full Payroll rules',
    },
    {
      role: 'EMPLOYEE',
      label: 'Employee',
      email: 'employee@peoplepay360.demo',
      color: '#b45309',
      bg: '#fffbeb',
      desc: 'Self-service: Attendance & Payslips',
    },
  ];

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword('Demo@123');
    setError(null);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--neutral-50, #f8fafc)',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            onClick={() => navigate('/')}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-600, #4f46e5)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.4rem',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              cursor: 'pointer',
            }}
          >
            P
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neutral-900, #0f172a)', margin: 0, letterSpacing: '-0.02em' }}>
            PeoplePay360 Sign In
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px' }}>
            Role-Based HR & Automated Payroll Platform
          </p>
        </div>

        {/* Login Card */}
        <Card title="Portal Authentication" subtitle="Sign in with your corporate credentials">
          {error && (
            <div style={{ marginBottom: '16px' }}>
              <Alert type="error" message={error} />
            </div>
          )}

          <form onSubmit={handleSignIn}>
            <Input
              label="Email Address"
              id="login_email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@peoplepay360.demo"
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                id="login_password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '36px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  color: 'var(--neutral-500, #64748b)',
                  padding: '2px 4px',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', marginTop: '12px' }}
            >
              Sign In to Platform →
            </Button>
          </form>

          {/* Hackathon Quick Role Switcher */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--neutral-200, #e2e8f0)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              ⚡ Quick Demo Account Selector (Hackathon)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: email === acc.email ? `2px solid ${acc.color}` : '1px solid var(--neutral-200, #e2e8f0)',
                    backgroundColor: email === acc.email ? acc.bg : '#ffffff',
                    color: acc.color,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{acc.label}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--neutral-500, #64748b)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {acc.desc}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400, #94a3b8)', marginTop: '8px', textAlign: 'center' }}>
              Default demo password: <code>Demo@123</code> (Stored hashed in PostgreSQL)
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', textDecoration: 'none' }}>
              ← Return to Public Landing Page
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
