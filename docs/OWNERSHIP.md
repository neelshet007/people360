# Module Ownership & Team Boundaries

**Critical Rule:**
> **"Do not modify another developer's module without communication."**

PeoplePay360 is built by a team of three developers. To ensure modularity and prevent conflicts, each developer has strictly demarcated boundaries.

---

## 1. Developer Ownership Matrix

### P1 — Core HR
**Domain**: Workforce Foundation & Core Infrastructure

- **Frontend**:
  - Employees (`/employees`)
  - Employee Profile
  - Contracts (`/contracts`)
  - Working Schedules (`/schedules`)
  - **Shared UI Foundation**:
    - Design System & Base Components (`components/ui/`)
    - Global Layout (`components/layout/`)
    - Navigation Elements (`components/navigation/`)
    - Feedback States (`components/feedback/`)
- **Backend**:
  - Employee Module (`modules/employees/`)
  - Contract Module (`modules/contracts/`)
  - Working Schedule Module (`modules/schedules/`)
- **Database**:
  - `employees`
  - `contracts`
  - `working_schedules`

---

### P2 — HR Operations
**Domain**: Daily Workforce Operations, Tracking & Time Off

- **Frontend**:
  - Attendance Management (`/attendance`)
  - Time Off Requests & Balances (`/time-off`)
  - Time Off Types Configuration
  - Time Off Allocations
- **Backend**:
  - Attendance Module (`modules/attendance/`)
  - Time Off Module (`modules/timeoff/`)
- **Database**:
  - `attendance`
  - `time_off_types`
  - `time_off_allocations`
  - `time_off_requests`
- **Data Consumption**:
  - Consumes Employee data from **P1** (links attendance and requests directly to `employee_id`).

---

### P3 — Payroll
**Domain**: Compensation, Calculation Engine & Pay Distribution

- **Frontend**:
  - Payroll Dashboard (`/payroll`)
  - Salary Structures (`/payroll/salary-structures`)
  - Salary Rules (`/payroll/salary-rules`)
  - Payruns (`/payroll/payruns`)
  - Payslips (`/payroll/payslips`)
  - Payroll Reports
- **Backend**:
  - Payroll Module (`modules/payroll/`)
  - Salary Structures, Rules, Payruns, Payslips, Calculations
- **Database**:
  - `salary_structures`
  - `salary_rules`
  - `payruns`
  - `payslips`
  - `payslip_lines`
- **Data Consumption**:
  - Consumes Employee data from **P1**
  - Consumes Contract data from **P1** (wage rates, contract terms)
  - Consumes Attendance data from **P2** (worked hours, presence)
  - Consumes Time Off data from **P2** (approved leaves, unpaid absences)

---

## 2. Strict Anti-Duplication Directives

Each module has a single authoritative owner. **DO NOT create duplicate implementations.**

- **Single Employee System**: There is **ONE** Employee model/system, owned by P1.
  - P2 must NOT create another Employee model or table.
  - P3 must NOT create another Employee model or table.
  - P2 and P3 must reference the Employee entity created and maintained by P1.
- **Single Attendance & Leave System**:
  - P3 must NOT recreate attendance or leave tables. P3 queries P2's attendance/leave records or consumes P2's aggregation service.
- **Single Payroll System**:
  - All salary rules, calculations, and payslip generation remain strictly encapsulated within P3's domain.

---

## 3. Communication Protocols

Before modifying any of the following shared resources, formal alignment is mandatory:
1. `package.json` dependencies (frontend or backend)
2. Prisma schema modifications or shared migrations
3. Authentication / Session middleware
4. Global layout (`AppLayout`) and primary navigation structure
5. Core UI components in `components/ui/`
6. API client configuration in `lib/api/apiClient.js`
7. Root `.env` configuration
