# API Contract Standard & Templates — PeoplePay360

This document defines the strict specification contract between the Frontend and Backend. 

**Rules:**
1. **No Silent Changes**: Never change an API response structure, query parameter, or endpoint without prior agreement with the consuming developer.
2. **Standard Agreement**: Frontend and backend developers must write and review the API contract specification *before* writing code.
3. **Consistent Error Format**: All endpoints must return normalized error envelopes.

---

## 1. Standard Error Envelope Format

All API errors must follow this universal JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | SERVER_ERROR",
    "message": "Human readable description of the error",
    "details": []
  }
}
```

---

## 2. Standard Success Envelope Format

All successful API responses should wrap payloads in a predictable envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## 3. Required API Specification Template

Every developer proposing or documenting an endpoint must fill out this exact template:

```markdown
### Feature: [Name of Feature]
- **Owner**: [P1 — Core HR | P2 — HR Operations | P3 — Payroll]
- **Method**: [GET | POST | PUT | PATCH | DELETE]
- **Endpoint**: `/api/[module]/[path]`
- **Purpose**: [Clear description of what the endpoint does]
- **Authentication**: [Required (Bearer JWT) | Public | Role-Restricted]
- **Dependencies**: [Upstream tables or modules required, e.g. Employee record must exist]

#### Request Headers:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### Request Query Parameters / Body:
```json
{
  "fieldName": "exampleValue"
}
```

#### Success Response (HTTP 200 / 201):
```json
{
  "success": true,
  "data": {
    "id": "uuid-or-id",
    "createdAt": "ISO-8601 string"
  }
}
```

#### Error Responses:
- **HTTP 400 Bad Request**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed on provided fields",
    "details": ["fieldName is required"]
  }
}
```
- **HTTP 401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired session token"
  }
}
```
- **HTTP 404 Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Requested entity does not exist"
  }
}
```
```

---

---

## 4. Contract Register

| Endpoint | Method | Owner | Description | Status |
|---|---|---|---|---|
| `/api/employees` | GET | P1 | Retrieve paginated employees | Active |
| `/api/employees` | POST | P1 | Create a new employee | Active |
| `/api/employees/:id` | GET / PUT / DELETE | P1 | Single employee operations | Active |
| `/api/contracts` | GET | P1 | List contracts by employee | Planned |
| `/api/schedules` | GET | P1 | List working schedule policies | Planned |
| `/api/attendance` | POST | P2 | Record daily check-in / check-out | Planned |
| `/api/timeoff/requests`| POST | P2 | Submit time-off request | Planned |
| `/api/payroll/status` | GET | P3 | Payroll module health & infrastructure status | Active |
| `/api/payroll/salary-structures` | GET / POST | P3 | List or create compensation blueprints | Active |
| `/api/payroll/salary-structures/:id` | GET | P3 | Single salary structure with rules | Active |
| `/api/payroll/salary-rules` | GET | P3 | List compensation rules by structure | Active |
| `/api/payroll/salary-rules/:id` | GET | P3 | Single salary rule details | Active |
| `/api/payroll/payruns` | GET / POST | P3 | List or initialize payrun batches | Active |
| `/api/payroll/payruns/:id` | GET | P3 | Single payrun with payslip summary | Active |
| `/api/payroll/payslips`| GET | P3 | Query generated employee payslips | Active |
| `/api/payroll/payslips/:id`| GET | P3 | Itemized employee payslip statement | Active |

---

## 5. P3 — Payroll Endpoint Specifications

### GET `/api/payroll/status`
- **Owner**: P3 (Payroll)
- **Description**: Verifies P3 module infrastructure, database connection, and table configurations.
- **Success Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "module": "payroll",
    "owner": "P3",
    "phase": 3,
    "status": "active",
    "infrastructure": {
      "databaseConnection": true,
      "tablesConfigured": true,
      "tablesFound": ["salary_structures", "salary_rules", "payruns", "payslips", "payslip_lines"]
    }
  }
}
```

### GET `/api/payroll/salary-structures`
- **Owner**: P3 (Payroll)
- **Query Parameters**: `is_active` (boolean, optional)
- **Success Response (HTTP 200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Standard Full-Time Compensation",
      "code": "STRUC-FULLTIME",
      "description": "Default structure for full-time staff",
      "is_active": true,
      "created_at": "ISO-8601 string",
      "updated_at": "ISO-8601 string"
    }
  ]
}
```

### GET `/api/payroll/payruns`
- **Owner**: P3 (Payroll)
- **Query Parameters**: `status` (optional: `DRAFT`, `COMPUTING`, `CONFIRMED`, `PAID`), `page` (default: 1), `limit` (default: 20)
- **Success Response (HTTP 200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "August 2026 Monthly Payrun",
      "pay_period_start": "2026-08-01",
      "pay_period_end": "2026-08-31",
      "status": "CONFIRMED",
      "total_gross": 28500.0,
      "total_deductions": 2850.0,
      "total_net": 25650.0,
      "created_at": "ISO-8601 string"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST `/api/payroll/payruns`
- **Owner**: P3 (Payroll)
- **Request Body**:
```json
{
  "name": "October 2026 Monthly Payrun",
  "pay_period_start": "2026-10-01",
  "pay_period_end": "2026-10-31"
}
```
- **Success Response (HTTP 201)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "October 2026 Monthly Payrun",
    "pay_period_start": "2026-10-01",
    "pay_period_end": "2026-10-31",
    "status": "DRAFT",
    "total_gross": 0,
    "total_deductions": 0,
    "total_net": 0
  }
}
```

### GET `/api/payroll/payslips`
- **Owner**: P3 (Payroll)
- **Query Parameters**: `payrun_id` (optional), `employee_id` (optional), `status` (optional), `page`, `limit`
- **Success Response (HTTP 200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "payrun_id": "uuid",
      "employee_id": "uuid",
      "employee_name": "Alex Morgan",
      "employee_code": "EMP-1001",
      "department": "Engineering",
      "gross_amount": 5400.0,
      "total_deductions": 270.0,
      "net_amount": 5130.0,
      "status": "CONFIRMED"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

