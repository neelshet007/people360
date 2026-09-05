# User Flows & System Journeys — PeoplePay360

This document outlines the operational and end-user flows across the integrated PeoplePay360 platform.

---

## 1. The Master Integration Flow

PeoplePay360 operates as one connected pipeline from employee onboarding through to payroll disbursement:

```
[ Step 1: Onboard Employee ] (P1)
             ↓
[ Step 2: Formulate Employment Contract & Assign Schedule ] (P1)
             ↓
[ Step 3: Log Daily Attendance & Approve Time-Off Requests ] (P2)
             ↓
[ Step 4: Configure Salary Structure & Calculation Rules ] (P3)
             ↓
[ Step 5: Execute Payrun for Period ] (P3)
             ↓
[ Step 6: Generate Itemized Payslips ] (P3)
             ↓
[ Step 7: Employee Reviews & Downloads Payslip ] (Self-Service)
```

---

## 2. Persona-Specific User Flows

### Flow A: Core HR Administrator (P1)
1. **Onboard New Employee**:
   - Access `/employees` → Click "Add Employee"
   - Enter personal profile, contact info, department, designation
   - Set status to active.
2. **Issue Contract**:
   - Navigate to `/contracts` → Click "New Contract"
   - Select Employee
   - Define wage type (Monthly Fixed / Hourly Rate), wage amount, start date, end date
   - Select associated Working Schedule and Salary Structure.
3. **Configure Working Schedule**:
   - Navigate to `/schedules`
   - Define standard daily working hours, shifts, and weekly rest days.

---

### Flow B: HR Operations Manager / Employee (P2)
1. **Daily Attendance Management**:
   - Employee logs daily check-in / check-out (`/attendance`).
   - HR Operations views daily attendance sheet, filters by date/department, and flags anomalies (late check-ins, unauthorized absences).
2. **Time-Off Configuration & Allocation**:
   - HR Ops configures leave categories in `/time-off` (Paid Vacation, Medical, Casual).
   - Allocates annual day quotas to employees.
3. **Time-Off Lifecycle**:
   - Employee submits leave request with start date, end date, and reason.
   - Manager/Ops reviews pending requests and marks as Approved or Rejected.
   - Approved leaves update balance allocations and feed directly into the payroll time summary.

---

### Flow C: Payroll Specialist (P3)
1. **Structure & Rule Configuration**:
   - Navigate to `/payroll/salary-structures` and `/payroll/salary-rules`.
   - Configure allowances (Basic, HRA, Transport) and statutory deductions (Tax, Pension).
2. **Initiate & Compute Payrun**:
   - Navigate to `/payroll/payruns` → Click "Create Payrun".
   - Select pay cycle (e.g., Monthly), start date, and end date.
   - System pulls active contracts from P1, combines with worked days and approved leaves from P2.
   - System computes salary rule formulas for each qualifying employee.
3. **Review & Finalize**:
   - Payroll manager reviews draft payslips for anomalies.
   - Approves and confirms the payrun batch.
4. **Issue Payslips**:
   - Payrun status is marked as `PAID`.
   - Itemized payslips are generated and published to employees.

---

### Flow D: Employee Self-Service (Cross-Domain)
1. Log in to portal (`/login`).
2. View personal dashboard (`/dashboard`):
   - Attendance summary
   - Remaining time-off balances
   - Latest issued payslip link.
3. View & download itemized payslip breakdown (`/payroll/payslips`).
