# PeoplePay360

**Integrated HR + Payroll Platform**

PeoplePay360 is a unified, end-to-end human resources and payroll management application designed to connect workforce management with automated payroll processing in one cohesive platform.

---

## 🚀 The Core Flow

The system runs on one uninterrupted business pipeline:

```
Employee
    ↓
Contract
    ↓
Working Schedule
    ↓
Attendance / Time Off
    ↓
Salary Structure + Salary Rules
    ↓
Payrun
    ↓
Payslip
    ↓
Employee views Payslip
```

---

## 🛠️ Technology Stack

Strictly **JavaScript** throughout the entire stack (No TypeScript):

- **Frontend**: JavaScript, React, Vite, JSX
- **Backend**: JavaScript, Node.js, Express.js
- **Database**: PostgreSQL, SQL

---

## 👥 Team Ownership

| Developer | Domain | Responsibilities |
|---|---|---|
| **P1 — Core HR** | Core Foundation | Employees, Contracts, Working Schedules, Shared UI Foundation & Layout |
| **P2 — HR Operations** | Operations & Leave | Attendance, Time Off, Time Off Types, Time Off Allocations |
| **P3 — Payroll** | Compensation & Payroll | Salary Structures, Salary Rules, Payruns, Payslips, Payroll Calculations |

*Rule: Do not modify another developer's module without communication.*

---

## 📁 Project Structure Overview

```
peoplepay360/
├── frontend/          # React + Vite (JavaScript / JSX)
├── backend/           # Node.js + Express REST API (JavaScript)
├── database/          # Database documentation and schema specifications
├── docs/              # Architecture, Ownership, API Contracts & Guidelines
├── .env.example       # Central environment template
├── .gitignore         # Repository ignore rules
├── README.md          # Project overview & guidelines
└── STACK.md           # Agreed technology constraints
```

---

## 🚦 Getting Started (Setup Placeholders)

### 1. Prerequisites
- Node.js (v18+ or v20+ recommended)
- PostgreSQL (running instance)
- npm or yarn

### 2. Environment Setup
Copy `.env.example` into both `frontend/.env` and `backend/.env` (or configure root environment variables as needed):
```bash
cp .env.example backend/.env
cp .env.example frontend/.env
```

### 3. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 Documentation

For full architectural blueprints, API templates, ownership boundaries, and Git workflows, consult the `docs/` directory:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/OWNERSHIP.md](docs/OWNERSHIP.md)
- [docs/API-CONTRACT.md](docs/API-CONTRACT.md)
- [docs/DATABASE.md](docs/DATABASE.md)
- [docs/USER-FLOWS.md](docs/USER-FLOWS.md)
- [docs/GIT-RULES.md](docs/GIT-RULES.md)
- [docs/FEATURE-TEMPLATE.md](docs/FEATURE-TEMPLATE.md)
