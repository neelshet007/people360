import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Alert from '../../../components/feedback/Alert';
import { ShieldIcon } from '../../../components/ui/Icons';

/**
 * Sign In Page — PeoplePay360
 * Enterprise Single Sign-On & Role-Aware Authentication
 * Automatically detects user role & permissions from corporate email upon sign-in.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your work email and password.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
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
        padding: '32px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            onClick={() => navigate('/')}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: 'var(--primary-600, #4f46e5)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.5rem',
              marginBottom: '14px',
              boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
          >
            P
          </div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--neutral-900, #0f172a)', margin: 0, letterSpacing: '-0.025em' }}>
            Sign In to PeoplePay360
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)', marginTop: '6px' }}>
            Unified People Operations & Payroll Platform
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--neutral-900, #0f172a)' }}>
              Work Account Authentication
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', margin: 0 }}>
              Enter your corporate email. Your role and workspace permissions will be automatically detected.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '18px' }}>
              <Alert type="error" message={error} />
            </div>
          )}

          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <Input
                label="Corporate Email Address"
                id="login_email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                id="login_password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
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
                  fontWeight: 600,
                  color: 'var(--primary-600, #4f46e5)',
                  padding: '2px 4px',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neutral-600, #475569)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary-600, #4f46e5)' }} />
                Remember this device
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your IT administrator to reset your corporate password.'); }} style={{ color: 'var(--primary-600, #4f46e5)', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', marginTop: '8px', padding: '12px 16px', fontSize: '0.9375rem', fontWeight: 600 }}
            >
              Sign In to Workspace →
            </Button>
          </form>

          {/* Security & Role Auto-Detection Guarantee */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid var(--neutral-100, #f1f5f9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: 'var(--neutral-500, #64748b)',
            }}
          >
            <ShieldIcon size={16} color="var(--success-600, #16a34a)" />
            <span>Role-aware single sign-on with 256-bit encrypted session handling</span>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', textDecoration: 'none', fontWeight: 500 }}>
              ← Return to Home Page
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
