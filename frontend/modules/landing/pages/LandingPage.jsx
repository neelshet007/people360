import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  ShieldIcon,
  BuildingIcon,
  BriefcaseIcon,
  GiftIcon,
  LockIcon,
} from '../../../components/ui/Icons';

/**
 * Public Landing Page — PeoplePay360
 * Enterprise SaaS platform for People Operations & Automated Indian Payroll
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const capabilities = [
    {
      icon: <UsersIcon size={24} color="var(--primary-600, #4f46e5)" />,
      title: 'Core HR & Employee Directory',
      desc: 'Centralized master repository for employee records, department hierarchies, PAN/Aadhaar tax compliance, and legal employment agreements.',
      badge: 'Core HR',
    },
    {
      icon: <ClockIcon size={24} color="var(--primary-600, #4f46e5)" />,
      title: 'Shift Rostering & Calendars',
      desc: 'Configurable working hour schedules, multi-tier shift policies, automated weekly-hour calculations, and Indian Standard Time (IST) support.',
      badge: 'Work Schedules',
    },
    {
      icon: <CalendarIcon size={24} color="var(--primary-600, #4f46e5)" />,
      title: 'Live Attendance & Audits',
      desc: 'Real-time clock-in/out tracking with automated late detection, half-day computations, flexible self-check-ins, and HR correction audits.',
      badge: 'Time Tracking',
    },
    {
      icon: <TimeOffIcon size={24} color="var(--primary-600, #4f46e5)" />,
      title: 'Leave & Compensatory Off',
      desc: 'Multi-category leave balances (Earned, Casual, Sick, Maternity), manager approval workflows, and automated weekend compensatory off crediting.',
      badge: 'Leave Engine',
    },
    {
      icon: <BanknoteIcon size={24} color="var(--primary-600, #4f46e5)" />,
      title: 'Statutory Indian Payroll',
      desc: 'Formulaic CTC gross-to-net calculation engine with Basic, HRA, Special Allowance, Employee PF (12%), and Indian Professional Tax (PT).',
      badge: 'Statutory Payroll',
    },
    {
      icon: <GiftIcon size={24} color="var(--primary-600, #4f46e5)" />,
      title: 'Bonus Allocation & Payruns',
      desc: 'One-click festival and performance bonus cycles, attendance-adjusted batch payruns, and verifiable itemized payslips in Indian Rupees (₹).',
      badge: 'Compensation',
    },
  ];

  const workflowSteps = [
    { num: '01', title: 'Onboard Staff', desc: 'Register employee master profiles & compensation contracts', icon: <UserIcon size={20} color="var(--primary-600, #4f46e5)" /> },
    { num: '02', title: 'Assign Shifts', desc: 'Define weekly working hours, grace periods & rosters', icon: <ClockIcon size={20} color="var(--primary-600, #4f46e5)" /> },
    { num: '03', title: 'Track Time & Leaves', desc: 'Capture daily biometric check-ins & approved leaves', icon: <CalendarIcon size={20} color="var(--primary-600, #4f46e5)" /> },
    { num: '04', title: 'Execute Payruns', desc: 'Process attendance-adjusted gross-to-net calculations', icon: <BanknoteIcon size={20} color="var(--primary-600, #4f46e5)" /> },
    { num: '05', title: 'Disburse Payslips', desc: 'Generate itemized PDF payslips and audit summaries', icon: <FileTextIcon size={20} color="var(--primary-600, #4f46e5)" /> },
  ];

  const enterpriseHighlights = [
    {
      icon: <ShieldIcon size={22} color="var(--primary-600, #4f46e5)" />,
      title: 'Role-Aware Security (RBAC)',
      desc: 'Enterprise single sign-on automatically assigns access privileges for Admins, HR Managers, Payroll Specialists, and Employees.',
    },
    {
      icon: <BuildingIcon size={22} color="var(--primary-600, #4f46e5)" />,
      title: 'Single Source of Truth',
      desc: 'Zero data discrepancies. The exact same employee identity cascades from contract onboarding to final tax filing and payrun disbursement.',
    },
    {
      icon: <BriefcaseIcon size={22} color="var(--primary-600, #4f46e5)" />,
      title: 'Indian Statutory Compliance',
      desc: 'Out-of-the-box support for Provident Fund (EPF), Professional Tax slabs, Lakhs numbering format, and statutory financial years.',
    },
    {
      icon: <LockIcon size={22} color="var(--primary-600, #4f46e5)" />,
      title: 'Enterprise PostgreSQL Core',
      desc: 'Mission-critical database schema built with strict ACID transactional integrity, relational constraints, and cryptographic encryption.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: 'var(--neutral-900, #0f172a)', fontFamily: 'inherit' }}>
      {/* 1. Public Header / Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-600, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
              }}
            >
              P
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--neutral-900, #0f172a)' }}>
                PeoplePay<span style={{ color: 'var(--primary-600, #4f46e5)' }}>360</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--neutral-400, #94a3b8)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                People Operations & Payroll
              </span>
            </div>
          </div>

          {/* Navigation Links & CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#capabilities" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-600, #475569)', textDecoration: 'none' }}>
              Capabilities
            </a>
            <a href="#workflow" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-600, #475569)', textDecoration: 'none' }}>
              How It Works
            </a>
            <a href="#enterprise" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-600, #475569)', textDecoration: 'none' }}>
              Security
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
          padding: '88px 24px 76px',
          background: 'radial-gradient(ellipse at top, rgba(79, 70, 229, 0.05) 0%, rgba(255, 255, 255, 1) 70%)',
          textAlign: 'center',
          borderBottom: '1px solid var(--neutral-100, #f1f5f9)',
        }}
      >
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: 'var(--primary-50, #eef2ff)',
              border: '1px solid var(--primary-200, #c7d2fe)',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700, #4338ca)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Enterprise Workforce Management
            </span>
            <span style={{ color: 'var(--primary-300, #a5b4fc)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-600, #4f46e5)', fontWeight: 600 }}>
              Automated Statutory Compliance
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 3.75rem)',
              fontWeight: 800,
              color: 'var(--neutral-900, #0f172a)',
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '0 0 22px',
            }}
          >
            The Unified People Operations & Precision Payroll Platform
          </h1>

          <p
            style={{
              fontSize: '1.1875rem',
              color: 'var(--neutral-600, #475569)',
              lineHeight: 1.65,
              maxWidth: '720px',
              margin: '0 auto 38px',
            }}
          >
            Consolidate employee master data, shift schedules, biometric attendance, compensatory leave workflows, and 100% compliant Indian gross-to-net payroll execution into one unified system.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" onClick={handleCtaClick} style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 700 }}>
              {isAuthenticated ? 'Open Platform Dashboard →' : 'Sign In to Workspace →'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const el = document.getElementById('capabilities');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 600 }}
            >
              Explore Capabilities ↓
            </Button>
          </div>

          {/* Quick Stat Pill Bar */}
          <div
            style={{
              marginTop: '56px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              padding: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
              border: '1px solid var(--neutral-200, #e2e8f0)',
            }}
          >
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--primary-700, #4338ca)' }}>100%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>
                Statutory Compliance
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--neutral-900, #0f172a)' }}>Multi-Tier</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>
                Role-Aware RBAC
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--success-700, #15803d)' }}>₹ INR Native</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>
                Lakhs & Slabs Engine
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--primary-600, #4f46e5)' }}>Sub-Second</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>
                Real-Time Calculations
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities Grid */}
      <section id="capabilities" style={{ padding: '88px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <Badge variant="primary">Enterprise Architecture</Badge>
          <h2 style={{ fontSize: '2.125rem', fontWeight: 800, marginTop: '14px', letterSpacing: '-0.025em' }}>
            Engineered for Modern People Operations
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--neutral-500, #64748b)', maxWidth: '640px', margin: '10px auto 0', lineHeight: 1.5 }}>
            Deliver end-to-end employee lifecycle workflows without fragmented spreadsheets or disconnected third-party integrations.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '24px' }}>
          {capabilities.map((c, i) => (
            <Card key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '46px',
                    height: '46px',
                    backgroundColor: 'var(--primary-50, #eff6ff)',
                    borderRadius: '10px',
                    border: '1px solid var(--primary-100, #dbeafe)',
                  }}
                >
                  {c.icon}
                </span>
                <Badge variant="neutral">{c.badge}</Badge>
              </div>
              <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--neutral-900, #0f172a)' }}>
                {c.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)', lineHeight: 1.55, margin: 0 }}>
                {c.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Connected Platform Workflow Diagram */}
      <section
        id="workflow"
        style={{
          padding: '80px 24px',
          backgroundColor: 'var(--neutral-50, #f8fafc)',
          borderTop: '1px solid var(--neutral-200, #e2e8f0)',
          borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <Badge variant="success">Lifecycle Flow</Badge>
            <h2 style={{ fontSize: '2.125rem', fontWeight: 800, marginTop: '14px', letterSpacing: '-0.025em' }}>
              How PeoplePay360 Coordinates Operations
            </h2>
            <p style={{ fontSize: '1.0625rem', color: 'var(--neutral-500, #64748b)', maxWidth: '580px', margin: '8px auto 0' }}>
              A continuous, automated pipeline from talent registration to compliant payslip disbursement.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px' }}>
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '26px 20px',
                  borderRadius: '14px',
                  border: '1px solid var(--neutral-200, #e2e8f0)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-600, #4f46e5)', letterSpacing: '0.05em' }}>
                      STEP {step.num}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        backgroundColor: 'var(--primary-50, #eff6ff)',
                        borderRadius: '8px',
                      }}
                    >
                      {step.icon}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--neutral-900, #0f172a)' }}>
                    {step.title}
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', lineHeight: 1.45, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Enterprise Security & Architecture */}
      <section id="enterprise" style={{ padding: '88px 24px', maxWidth: '1150px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <Badge variant="neutral">Enterprise Guarantees</Badge>
          <h2 style={{ fontSize: '2.125rem', fontWeight: 800, marginTop: '14px', letterSpacing: '-0.025em' }}>
            Built for Security, Scale, and Reliability
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--neutral-500, #64748b)', maxWidth: '620px', margin: '10px auto 0' }}>
            Engineered with strict separation of concerns, transactional consistency, and enterprise governance.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {enterpriseHighlights.map((b, i) => (
            <div
              key={i}
              style={{
                padding: '24px',
                borderLeft: '4px solid var(--primary-600, #4f46e5)',
                backgroundColor: 'var(--neutral-50, #f8fafc)',
                borderRadius: '0 12px 12px 0',
                borderTop: '1px solid var(--neutral-200, #e2e8f0)',
                borderRight: '1px solid var(--neutral-200, #e2e8f0)',
                borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {b.icon}
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0, color: 'var(--neutral-900, #0f172a)' }}>
                  {b.title}
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600, #475569)', lineHeight: 1.55, margin: 0 }}>
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section style={{ padding: '60px 24px 88px', maxWidth: '1080px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'var(--primary-900, #1e1b4b)',
            color: '#ffffff',
            textAlign: 'center',
            padding: '56px 32px',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(30, 27, 75, 0.25)',
          }}
        >
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 14px', color: '#ffffff', letterSpacing: '-0.025em' }}>
            Elevate Your Workforce & Payroll Operations
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--primary-200, #c7d2fe)', maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Experience automated role detection, real-time attendance, and seamless gross-to-net Indian payroll processing.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCtaClick}
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--primary-900, #1e1b4b)',
              fontWeight: 800,
              fontSize: '1rem',
              padding: '14px 32px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            }}
          >
            {isAuthenticated ? 'Enter Platform Dashboard →' : 'Sign In to Portal →'}
          </Button>
        </div>
      </section>

      {/* 7. Enterprise Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--neutral-200, #e2e8f0)',
          padding: '36px 24px',
          backgroundColor: 'var(--neutral-50, #f8fafc)',
          fontSize: '0.8125rem',
          color: 'var(--neutral-500, #64748b)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <strong>PeoplePay360</strong> — Enterprise Human Capital & Precision Payroll Platform
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircleIcon size={14} color="var(--success-600, #16a34a)" />
            <span>SOC-2 Ready Architecture • Indian Statutory & Multi-State Compliance (INR / ₹)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
