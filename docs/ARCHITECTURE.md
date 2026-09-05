# Architecture Overview — PeoplePay360

PeoplePay360 is engineered as a unified, monolithic repository integrating Human Resources management and automated Payroll calculation into one seamless platform.

---

## 1. High-Level Technical Architecture

The technical stack follows a structured, unidirectional layered design:

```
[ Frontend: React + Vite (React Router, JSX) ]
                        ↓
[ Frontend API Layer: lib/api/apiClient.js (Centralized Client) ]
                        ↓ (REST / JSON over HTTP)
[ Backend: Node.js + Express.js Web Server ]
                        ↓
[ Module Layer: Routes → Controllers → Services → Repositories / Validators ]
                        ↓
[ Database: PostgreSQL Engine (SQL) ]
```

---

## 2. Module Dependency & Data Flow

Modules interact hierarchically based on domain maturity:

```
[ P1 — Core HR ]
  (Employees, Contracts, Schedules)
        ↓
[ P2 — HR Operations ]
  (Attendance, Time Off Types, Requests, Allocations)
        ↓
[ P3 — Payroll ]
  (Salary Structures, Salary Rules, Payruns, Payslips)
```

- **P1 Core HR** provides the authoritative root records (Employees, active employment Contracts, assigned Working Schedules).
- **P2 HR Operations** anchors daily operational logs (daily Attendance entries, leave balances, and Time Off requests) directly to P1 Employees.
- **P3 Payroll** synthesizes contract wage parameters (from P1) and operational attendance/leave summaries (from P2) with salary calculation rules to compute gross-to-net payruns and individual payslips.

---

## 3. End-to-End Business Pipeline

The core business process flows sequentially across the integrated entities:

```
    [ Employee ]
         ↓ (Assigned employment terms)
    [ Contract ]
         ↓ (Assigned work calendar & shifts)
 [ Working Schedule ]
         ↓ (Logged daily presence and leaves)
[ Attendance / Time Off ]
         ↓ (Evaluated against pay structures)
[ Salary Structure / Rules ]
         ↓ (Batch periodic calculation cycle)
     [ Payrun ]
         ↓ (Generated final itemized statement)
     [ Payslip ]
         ↓
[ Employee views Payslip ]
```

---

## 4. Architectural Rules & Best Practices

1. **JavaScript Everywhere**: Both frontend and backend are written strictly in JavaScript (`.js` and `.jsx`). No TypeScript or compiler transpilation steps beyond Next.js defaults.
2. **Single API Gateway Pattern**: All frontend requests flow through `frontend/lib/api/apiClient.js` with standard header handling and error normalization.
3. **Module Encapsulation**: Backend code is organized under domain-specific feature modules (`modules/employees`, `modules/attendance`, etc.), each isolating its own routing, controllers, services, and validators while sharing standard middleware and config.
4. **Decoupled Business Services**: Controllers only handle HTTP concerns (status codes, params), delegating domain logic to service layers for testability and reusability across modules.
