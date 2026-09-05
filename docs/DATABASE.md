# Database Planned Schema & Entity Ownership

This document defines the planned database entities, their relationships, and developer ownership.

> **CRITICAL RULE**:
> Do NOT implement the full database schema yet. Only document the planned entities and ownership.
> Do NOT create duplicate entities (e.g. duplicate employee models or parallel attendance tables).

---

## 1. Planned Entity Ownership Matrix

### Domain 1: Core HR (Owner: P1)

1. **`employees`**
   - **Purpose**: Authoritative personal, identification, contact, and employment status details for every staff member.
   - **Primary Key**: `id`
   - **Key Fields Planned**: `employee_code`, `first_name`, `last_name`, `email`, `phone`, `date_of_joining`, `status` (`ACTIVE`, `INACTIVE`, `ON_LEAVE`).
   - **Parent To**: `contracts`, `attendance`, `time_off_requests`, `time_off_allocations`, `payslips`.

2. **`contracts`**
   - **Purpose**: Defines terms of employment, wage rates, wage type (monthly, hourly), effective dates, and links to working schedules and salary structures.
   - **Key Fields Planned**: `employee_id`, `contract_type`, `wage_rate`, `wage_type`, `start_date`, `end_date`, `working_schedule_id`, `salary_structure_id`, `status`.

3. **`working_schedules`**
   - **Purpose**: Configures standard working hours, daily shifts, weekly rest days, and expected hours per pay period.
   - **Key Fields Planned**: `name`, `standard_hours_per_day`, `standard_days_per_week`, `break_duration_minutes`, `timezone`.

---

### Domain 2: HR Operations (Owner: P2)

4. **`attendance`**
   - **Purpose**: Daily work logs, clock-in, clock-out timestamps, actual hours worked, and attendance status.
   - **Key Fields Planned**: `employee_id`, `date`, `clock_in`, `clock_out`, `total_hours`, `status` (`PRESENT`, `ABSENT`, `HALF_DAY`, `LATE`).

5. **`time_off_types`**
   - **Purpose**: Master list of leave categories (e.g., Annual Leave, Sick Leave, Unpaid Leave).
   - **Key Fields Planned**: `name`, `code`, `is_paid`, `requires_approval`, `max_days_allowed`.

6. **`time_off_allocations`**
   - **Purpose**: Available balance quota allocated to employees per leave type per calendar/fiscal year.
   - **Key Fields Planned**: `employee_id`, `time_off_type_id`, `allocated_days`, `used_days`, `year`.

7. **`time_off_requests`**
   - **Purpose**: Employee leave applications, date intervals, and review statuses.
   - **Key Fields Planned**: `employee_id`, `time_off_type_id`, `start_date`, `end_date`, `total_days`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `approver_id`.

---

### Domain 3: Payroll (Owner: P3)

8. **`salary_structures`**
   - **Purpose**: High-level compensation blueprints grouping multiple salary rules (e.g. "Standard Full-Time Employee Structure").
   - **Key Fields Planned**: `name`, `code`, `description`, `is_active`.

9. **`salary_rules`**
   - **Purpose**: Specific compensation components (Basic, HRA, Overtime, Tax Deductions, Social Security).
   - **Key Fields Planned**: `salary_structure_id`, `name`, `code`, `category` (`ALLOWANCE`, `DEDUCTION`, `COMPANY_CONTRIBUTION`), `calculation_type` (`FIXED`, `PERCENTAGE`, `FORMULA`), `amount_or_rate`, `sequence_order`.

10. **`payruns`**
    - **Purpose**: Batch payroll processing cycles (e.g. "September 2026 Monthly Payrun").
    - **Key Fields Planned**: `name`, `pay_period_start`, `pay_period_end`, `execution_date`, `status` (`DRAFT`, `COMPUTING`, `CONFIRMED`, `PAID`), `total_gross`, `total_deductions`, `total_net`.

11. **`payslips`**
    - **Purpose**: Individual employee payroll statement generated during a payrun.
    - **Key Fields Planned**: `payrun_id`, `employee_id`, `contract_id`, `worked_days`, `absent_days`, `gross_amount`, `total_deductions`, `net_amount`, `status` (`DRAFT`, `CONFIRMED`, `PAID`).

12. **`payslip_lines`**
    - **Purpose**: Detailed itemized line-items for each salary rule computed on an individual payslip (e.g. Basic: $3000, Tax: -$450).
    - **Key Fields Planned**: `payslip_id`, `salary_rule_id`, `rule_name`, `rule_code`, `category`, `rate`, `amount`.

---

## 2. Planned High-Level Entity Relationships

```
[ employees (P1) ] ─────── 1:N ───────< [ contracts (P1) ]
       │                                       │
       ├─── 1:N ───< [ attendance (P2) ]       │
       │                                       │ (references)
       ├─── 1:N ───< [ time_off_allocations (P2) ]
       │                                       │
       ├─── 1:N ───< [ time_off_requests (P2) ]│
       │                                       │
       └─── 1:N ───< [ payslips (P3) ] >───────┘
                           │
                 [ payruns (P3) ] ── 1:N ──< [ payslips (P3) ]
                                                   │
                                          1:N ─────┴─────
                                          │
                                   [ payslip_lines (P3) ]
                                          ▲
                                          │ (calculated from)
[ salary_structures (P3) ] ── 1:N ──< [ salary_rules (P3) ]
```

---

## 3. Database Conventions

- Table names: `snake_case` plural (e.g., `working_schedules`, `salary_rules`).
- Column names: `snake_case` (e.g., `employee_id`, `total_hours`).
- Timestamps: Every table must include `created_at` (timestamptz default `now()`) and `updated_at` (timestamptz).
- Foreign Keys: Indexed for query efficiency.
- Soft Deletes: Evaluated on an entity-by-entity basis (e.g., `deleted_at`).
