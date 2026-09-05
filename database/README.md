# Database Specifications & Schema Directory

This directory stores shared database documentation, entity relationship diagrams, and initial SQL/seed specifications for **PeoplePay360**.

---

## 1. Planned Entities Summary

### P1 — Core HR
- **`employees`**: Central workforce master records.
- **`contracts`**: Employment terms, compensation types, and schedule bindings.
- **`working_schedules`**: Working days, standard hours, and shift rules.

### P2 — HR Operations
- **`attendance`**: Daily check-in/out records and worked hours.
- **`time_off_types`**: Leave category master catalog.
- **`time_off_allocations`**: Per-employee annual leave quotas.
- **`time_off_requests`**: Employee leave requests and approval lifecycle.

### P3 — Payroll
- **`salary_structures`**: Salary component groupings.
- **`salary_rules`**: Calculation logic for allowances, deductions, and statutory items.
- **`payruns`**: Payroll calculation execution batches.
- **`payslips`**: Individual employee pay statements.
- **`payslip_lines`**: Itemized lines on individual payslips.

---

## 2. Important Architectural Directives

- **DO NOT implement the full database schema prematurely.**
- **DO NOT create duplicate entities** (e.g. secondary employee or duplicate attendance tables).
- Prisma migration schemas reside in `backend/prisma/schema.prisma` and must be maintained collaboratively.
- Detailed relationship documentation is maintained in [docs/DATABASE.md](../docs/DATABASE.md).
