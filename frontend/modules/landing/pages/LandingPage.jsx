import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import {
  UsersIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  TimeOffIcon,
  BanknoteIcon,
  FileTextIcon,
  CheckCircleIcon,
} from '../../../components/ui/Icons';

/**
 * Public Landing Page — PeoplePay360
 * Modern SaaS entry experience showcasing the unified HR + Payroll pipeline
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, role } = useAuth();

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const capabilities = [
    {
      icon: <UsersIcon size={24} color="var(--primary-600, #2563eb)" />,
      title: 'Core HR Master',
      desc: 'Centralized directory for personnel profiles, department hierarchy, PAN tax records, and compliant employment agreements.',
      badge: 'P1 Foundation',
    },
    {
      icon: <ClockIcon size={24} color="var(--primary-600, #2563eb)" />,
      title: 'Shift Calendars',
      desc: 'Configurable working schedules with automated weekly-hour calculations and Indian Standard Time (IST) support.',
      badge: 'Automated',
    },
    {
      icon: <CalendarIcon size={24} color="var(--primary-600, #2563eb)" />,
      title: 'Live Attendance',
      desc: 'Real-time clock-in/clock-out tracking with automated late detection, half-day computations, and HR correction audits.',
      badge: 'P2 Operations',
    },
    {
      icon: <TimeOffIcon size={24} color="var(--primary-600, #2563eb)" />,
      title: 'Time Off Management',
      desc: 'Multi-category leave balances (Earned, Casual, Sick, Maternity) with manager approval workflows and live balance recalculation.',
      badge: 'Self-Service',
    },
    {
      icon: <BanknoteIcon size={24} color="var(--primary-600, #2563eb)" />,
      title: 'Statutory Indian Payroll',
      desc: 'Accurate CTC gross-to-net engine with HRA, Transport, Special Allowance, Employee PF (12%), and Professional Tax (PT).',
      badge: 'P3 Engine',
    },
    {
      icon: <FileTextIcon size={24} color="var(--primary-600, #2563eb)" />,
      title: 'Itemized Payslips',
      desc: 'Automated monthly payrun batch execution producing verifiable, itemized compensation statements in Indian Rupees (₹).',
      badge: 'Compliant',
    },
  ];

  const workflowSteps = [
    { num: '01', title: 'Onboard Staff', desc: 'Register employee master data & legal contracts', icon: <UserIcon size={20} color="var(--primary-600, #2563eb)" /> },
    { num: '02', title: 'Assign Shifts', desc: 'Define weekly working hours and schedules', icon: <ClockIcon size={20} color="var(--primary-600, #2563eb)" /> },
    { num: '03', title: 'Track Time', desc: 'Capture daily check-ins & approved leaves', icon: <CalendarIcon size={20} color="var(--primary-600, #2563eb)" /> },
    { num: '04', title: 'Execute Payroll', desc: 'Process attendance-adjusted gross-to-net', icon: <BanknoteIcon size={20} color="var(--primary-600, #2563eb)" /> },
    { num: '05', title: 'Disburse Payouts', desc: 'Generate itemized employee payslips in ₹', icon: <FileTextIcon size={20} color="var(--primary-600, #2563eb)" /> },
  ];

  const keyBenefits = [
    {
      title: 'Single Source of Truth',
      desc: 'Zero data silos. The same employee identity flows seamlessly from onboarding to final payslip disbursement.',
    },
    {
      title: 'Role-Based Security (RBAC)',
      desc: 'Strict role segregation for Admins, HR Managers, Payroll Specialists, and Employee self-service portals.',
    },
    {
      title: 'Indian Localization First',
      desc: 'Native Indian Rupee (₹) currency formatting, Lakhs numbering, and statutory deduction standards.',
    },
    {
      title: 'Enterprise PostgreSQL',
      desc: 'Production-ready relational schema with transactional integrity, foreign keys, and audit timestamps.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: 'var(--neutral-900, #0f172a)', fontFamily: 'inherit' }}>
      {/* 1. Public Header / Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-600, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)',
              }}
            >
              P
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--neutral-900, #0f172a)' }}>
                PeoplePay<span style={{ color: 'var(--primary-600, #4f46e5)' }}>360</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'var(--neutral-400, #94a3b8)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                HR & Payroll Engine
              </span>
            </div>
          </div>

          {/* Navigation links & CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#capabilities" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-600, #475569)', textDecoration: 'none' }}>
              Features
            </a>
            <a href="#workflow" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-600, #475569)', textDecoration: 'none' }}>
              Workflow
            </a>
            <a href="#benefits" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-600, #475569)', textDecoration: 'none' }}>
              Architecture
            </a>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-600, #475569)' }}>
                  Signed in as <strong>{user?.name || user?.email}</strong>
                </span>
                <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard →
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                Sign In →
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        style={{
          padding: '80px 24px 70px',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          textAlign: 'center',
          borderBottom: '1px solid var(--neutral-100, #f1f5f9)',
        }}
      >
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: 'var(--primary-50, #eef2ff)', border: '1px solid var(--primary-200, #c7d2fe)', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700, #4338ca)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🇮🇳 Indian Enterprise HR & Payroll
            </span>
            <span style={{ color: 'var(--primary-300, #a5b4fc)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-600, #4f46e5)', fontWeight: 600 }}>
              Full PostgreSQL Pipeline
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: 'var(--neutral-900, #0f172a)',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              margin: '0 0 20px',
            }}
          >
            Integrated HR & Automated Payroll Platform
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--neutral-600, #475569)',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0 auto 36px',
            }}
          >
            Manage workforce directories, shift schedules, daily attendance, time-off approvals, and statutory Indian CTC payruns — all unified in one database-driven application.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" onClick={handleCtaClick}>
              {isAuthenticated ? 'Open Platform Dashboard →' : 'Sign In to Portal →'}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
              Explore Demo Roles
            </Button>
          </div>

          {/* Quick Stat Pill Bar */}
          <div
            style={{
              marginTop: '50px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
            }}
          >
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700, #4338ca)' }}>100%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>Database Driven</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neutral-900, #0f172a)' }}>5 Roles</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>Granular RBAC</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-700, #15803d)' }}>₹ INR Native</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>Indian Statutory Pay</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning-700, #b45309)' }}>0 Mocks</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>Real Dynamic APIs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities Grid */}
      <section id="capabilities" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Badge variant="primary">Unified Platform</Badge>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px', letterSpacing: '-0.02em' }}>
            Complete HR & Payroll Lifecycle
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--neutral-500, #64748b)', maxWidth: '600px', margin: '8px auto 0' }}>
            Built specifically to address enterprise operational requirements without disconnected third-party tools.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {capabilities.map((c, i) => (
            <Card key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', backgroundColor: 'var(--primary-50, #eff6ff)', borderRadius: '8px', border: '1px solid var(--primary-100, #dbeafe)' }}>
                  {c.icon}
                </span>
                <Badge variant="neutral">{c.badge}</Badge>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--neutral-900, #0f172a)' }}>
                {c.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)', lineHeight: 1.5, margin: 0 }}>
                {c.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Connected Platform Workflow Diagram */}
      <section id="workflow" style={{ padding: '70px 24px', backgroundColor: 'var(--neutral-50, #f8fafc)', borderTop: '1px solid var(--neutral-200, #e2e8f0)', borderBottom: '1px solid var(--neutral-200, #e2e8f0)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Badge variant="success">End-to-End Pipeline</Badge>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px', letterSpacing: '-0.02em' }}>
              How PeoplePay360 Works
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--neutral-500, #64748b)' }}>
              From initial staff onboarding to verified bank payout disbursement.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '24px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--neutral-200, #e2e8f0)',
                  boxShadow: 'var(--shadow-xs)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-600, #2563eb)' }}>
                    STEP {step.num}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: 'var(--primary-50, #eff6ff)', borderRadius: '6px' }}>
                    {step.icon}
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--neutral-900, #0f172a)' }}>
                  {step.title}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', lineHeight: 1.4, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Key Architecture Benefits */}
      <section id="benefits" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Architectural Guarantees
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--neutral-500, #64748b)' }}>
            Engineered with strict separation of concerns, verified raw SQL queries, and zero mock business state.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {keyBenefits.map((b, i) => (
            <div key={i} style={{ padding: '20px', borderLeft: '3px solid var(--primary-600, #4f46e5)', backgroundColor: 'var(--neutral-50, #f8fafc)', borderRadius: '0 8px 8px 0' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--neutral-900, #0f172a)' }}>
                {b.title}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)', lineHeight: 1.5, margin: 0 }}>
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section style={{ padding: '60px 24px 80px', maxWidth: '1000px', margin: '0 auto' }}>
        <Card style={{ backgroundColor: 'var(--primary-900, #312e81)', color: '#ffffff', textAlign: 'center', padding: '48px 24px', border: 'none' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 12px', color: '#ffffff' }}>
            Ready to experience PeoplePay360?
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--primary-200, #c7d2fe)', maxWidth: '540px', margin: '0 auto 28px' }}>
            Sign in as an Admin, HR Manager, Payroll Specialist, or Employee to test role-based access control and live database flows.
          </p>
          <Button variant="primary" size="lg" onClick={handleCtaClick} style={{ backgroundColor: '#ffffff', color: 'var(--primary-900, #312e81)', fontWeight: 700 }}>
            {isAuthenticated ? 'Enter Platform Dashboard' : 'Launch Sign In Portal'}
          </Button>
        </Card>
      </section>

      {/* 7. Footer */}
      <footer style={{ borderTop: '1px solid var(--neutral-200, #e2e8f0)', padding: '32px 24px', backgroundColor: 'var(--neutral-50, #f8fafc)', fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <strong>PeoplePay360</strong> — Integrated HR & Payroll Platform • Phase 6B/6C
          </div>
          <div>
            Built with React, Express, and PostgreSQL • Indian Locale Compliant (INR / ₹)
          </div>
        </div>
      </footer>
    </div>
  );
}
