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

## 4. Contract Register (To be populated as features are planned)

| Endpoint | Method | Owner | Description | Status |
|---|---|---|---|---|
| `/api/employees` | GET | P1 | Retrieve paginated employees | *Planned* |
| `/api/employees` | POST | P1 | Create a new employee | *Planned* |
| `/api/contracts` | GET | P1 | List contracts by employee | *Planned* |
| `/api/schedules` | GET | P1 | List working schedule policies | *Planned* |
| `/api/attendance` | POST | P2 | Record daily check-in / check-out | *Planned* |
| `/api/timeoff/requests`| POST | P2 | Submit time-off request | *Planned* |
| `/api/payroll/payruns` | POST | P3 | Initialize periodic payrun batch | *Planned* |
| `/api/payroll/payslips`| GET | P3 | Fetch generated payslips | *Planned* |
