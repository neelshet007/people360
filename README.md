# PeoplePay360

<div align="center">

**Unified Enterprise People Operations & Statutory Indian Payroll Platform**

[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20PostgreSQL-indigo.svg)](#technology-stack)
[![Localization](https://img.shields.io/badge/Localization-India%20%28INR%20%E2%82%B9%29-green.svg)](#statutory-indian-payroll-engine)
[![Security](https://img.shields.io/badge/Auth-scrypt%20%2B%20JWT%20RBAC-blue.svg)](#authentication--role-based-access-control-rbac)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20ACID-orange.svg)](#database-architecture)

*A production-grade, full-stack Human Capital Management (HCM) and precision payroll system built with zero third-party HRMS dependencies and strict relational database integrity.*

</div>

---

## 📸 Architectural Visualizations

### 1. Overall System Architecture & Data Pipeline
The high-level cloud architecture connecting the React presentation layer, Express API gateway, business micro-services, and transactional PostgreSQL storage.

<div align="center">
  <img src="./ChatGPT%20Image%20Sep%206,%202026,%2007_45_06%20AM.png" alt="PeoplePay360 System Architecture" width="100%" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);" />
</div>

---

### 2. Core HR, Employee Master & Contractual Blueprint
How personal identity cascades into legal employment contracts, shift calendar intervals, and assigned salary structures.

<div align="center">
  <img src="./Employee%20Contract-2026-09-06-005532.png" alt="Employee Contract & Working Schedules" width="100%" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);" />
</div>

---

### 3. Attendance, Compensatory Off & Statutory Payroll Engine
The calculation lifecycle showing how biometric clock-ins, approved leaves, weekend comp-off credits, and Indian statutory rules (EPF, PT, HRA) merge into verified payslips.

<div align="center">
  <img src="./Employee%20Leave%20and%20Salary-2026-09-06-010632.png" alt="Employee Leave, Attendance & Salary Flow" width="100%" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);" />
</div>

---

## 🚀 The Core Lifecycle Pipeline

The entire platform operates on an unbroken, database-driven business pipeline:

```
Employee Master Profile
    ↓
Legal Employment Contract (Wage Rate & Type)
    ↓
Working Schedule (Shift intervals, 8h/day, 22 days/mo)
    ↓
Live Biometric Attendance + Compensatory Off & Leaves
    ↓
Salary Structure + Ordered Statutory Rules
    ↓
Automated Batch Payrun (Gross-to-Net + Loss of Pay Deductions)
    ↓
Discretionary Bonus Allocation (Diwali / Performance)
    ↓
Itemized Payslips (INR ₹) with Isolated PDF Print
    ↓
Employee Self-Service & Concern Helpdesk
```

---

## 🌟 Key Platform Capabilities

### 1. Role-Aware Authentication & Granular RBAC
- **Email-Based Auto-Detection**: Users sign in purely with their corporate email and password. The backend queries PostgreSQL, determines their role (`ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`, `EMPLOYEE`), and issues a signed JWT token with scoped permissions.
- **Cryptographic Security**: Passwords hashed using Node.js native `crypto.scryptSync` with unique 16-byte salts and `crypto.timingSafeEqual` comparison to eliminate timing attacks.

### 2. Core HR Master & Contracts
- **Personnel Directory**: Centralized master profiles, department hierarchy, PAN tax records, and Aadhaar compliance.
- **Contract Engine**: Multi-wage contracts (`MONTHLY`, `DAILY`, `HOURLY`, `WEEKLY`) linked to working schedules and salary blueprints.

### 3. Real-Time Attendance & Biometrics
- **Live Clock-in/out**: Automated late detection, half-day computations, and flexible self-check-ins.
- **Schedule-Aware Validation**: Attendance timestamps are validated against assigned weekly shift intervals.

### 4. Time Off & Compensatory Off (Comp-Off)
- **Comp-Off Crediting**: Employees working on weekends or holidays earn compensatory off balance upon manager approval.
- **Automated Working Days Detector**: When selecting leave dates, the system automatically loops through the calendar, checks the employee's shift schedule, skips Saturdays and Sundays, and auto-populates exact working days.
- **Paid vs Unpaid Protection**: Paid leaves (Earned, Casual, Sick, Comp-Off) are protected from deduction. Unpaid leave (LWP) automatically triggers a Loss of Pay deduction.

### 5. Statutory Indian Payroll Engine
- **Formulaic Rule Engine**: Calculates Basic, House Rent Allowance (HRA 40%), Transport, and Special Allowances.
- **Statutory Compliance**: Employee Provident Fund (EPF 12%), Professional Tax (PT ₹200), and automated Loss of Pay (LOP) calculations.
- **Atomicity**: Payrun computations execute within strict PostgreSQL transactions (`BEGIN` ... `COMMIT`).

### 6. Discretionary Bonus Allocation
- **Targeted Bonus Cycles**: Create Festival (Diwali), Performance, Retention, or Annual bonus batches.
- **Draft Workflow & 1-Click Presets**: Pre-populated draft allocations with flat presets (e.g. ₹5,000 to all) and individual overrides.
- **Integrated Disbursement**: Generates verified bonus payslips in 1-click.

### 7. Concern Communication Helpdesk
- **Contextual Ticketing**: Raise cases directly linked to an Attendance log, Leave request, Contract, or Payslip.
- **Protected Internal HR Notes**: Messages marked `is_internal = true` are strictly filtered out at the SQL level for employees, giving HR a secure channel for case triage.
- **Audit History**: Complete timeline tracking ticket state transitions (`OPEN` → `UNDER_REVIEW` → `RESOLVED` → `CLOSED`).

### 8. Isolated Payslip Print Engine
- Dedicated isolated print frame that renders **strictly the itemized payslip** without printing background dashboards, sidebars, or modal buttons.

---

## 🛠️ Technology Stack

Strictly **JavaScript** throughout the entire stack for maximum agility:

| Tier | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Vanilla CSS Design System |
| **Backend** | Node.js, Express.js, JSON Web Tokens (JWT), crypto.scrypt |
| **Database** | PostgreSQL, `pg` Connection Pool, ACID Transactions |
| **Localization** | Indian Rupee (₹), Lakhs Numbering Format, Indian Tax Tables |

---

## 📁 Repository Structure

```
peoplepay360/
├── frontend/               # React + Vite Client
│   ├── modules/            # Domain-driven architecture
│   │   ├── auth/           # Login & session management
│   │   ├── landing/        # Enterprise marketing landing page
│   │   ├── employees/      # Directory, master profiles, contracts
│   │   ├── attendance/     # Biometric punches, audits, schedules
│   │   ├── timeoff/        # Leave requests, comp-off, balances
│   │   ├── payroll/        # Payruns, salary structures, bonus cycles
│   │   └── concerns/       # Case management & two-way messaging
│   ├── components/         # Atomic UI system (Card, Modal, Button, Icons)
│   └── styles/             # Global CSS tokens & print styles
├── backend/                # Express REST API
│   ├── src/
│   │   ├── modules/        # Modular service, repository & controller layer
│   │   ├── middleware/     # JWT authentication & RBAC guards
│   │   ├── database/       # PostgreSQL connection pool & migrate runner
│   │   └── utils/          # Password helper, rbac definitions
│   └── tests/              # Automated integration test suites
├── database/
│   ├── migrations/         # 12 sequential SQL DDL schema files
│   └── seeds/              # Seed scripts for demo data & accounts
├── docs/                   # Full architectural documentation
├── README.md               # Visual project documentation
└── STACK.md                # Architectural standards
```

---

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0 or higher)
- **PostgreSQL** (v14 or higher running locally or remotely)
- **npm** (bundled with Node.js)

### 2. Environment Configuration
Copy `.env.example` into both `backend/.env` and `frontend/.env`:
```bash
# In backend/.env:
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/peoplepay360
JWT_SECRET=your-secret-jwt-key
CORS_ORIGIN=http://localhost:3000

# In frontend/.env:
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Migration & Seeding
```bash
cd backend
npm install
npm run migrate
npm run seed
```

### 4. Start the Application
In separate terminal windows:

```bash
# Terminal 1: Start Backend API (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend (Port 3000 / 3001)
cd frontend
npm run dev
```

Open your browser at `http://localhost:3000` (or `http://localhost:3001`).

---

## 🔑 Demo User Credentials

The platform features **automatic email-based role resolution**. Simply enter any corporate email below with password `Demo@123`:

| Role | Corporate Email | Default Password | Workspace Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@peoplepay360.demo` | `Demo@123` | Full administrative control, system configurations & users |
| **HR Manager** | `hr.manager@peoplepay360.demo` | `Demo@123` | Core HR, Contracts, Shifts, Attendance Audits & Leave Approvals |
| **Payroll Manager**| `payroll.manager@peoplepay360.demo` | `Demo@123` | Full HR + Salary Structures, Rules & Payrun Execution |
| **Payroll Specialist** | `payroll.user@peoplepay360.demo` | `Demo@123` | Payrun computation, bonus cycles, itemized payslips & disbursement |
| **Employee** | `employee@peoplepay360.demo` | `Demo@123` | Self-service: Profile, Clock-in, Comp-Off, Leaves & Payslips |

---

## 📄 License & Compliance

Built for enterprise workforce management and compliance with Indian labor regulations (EPF, ESI, Professional Tax, and the Indian IT Act).
