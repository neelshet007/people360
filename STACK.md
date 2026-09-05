# Technology Stack — PeoplePay360

This document defines the strict, agreed-upon technology stack for the **PeoplePay360** integrated HR & Payroll platform across all developers (P1, P2, P3).

---

## 1. Core Language Rule

- **Language**: JavaScript (ES6+)
- **Strict Prohibition**: 
  - ❌ NO TypeScript
  - ❌ NO `.ts` or `.tsx` files
  - ❌ NO TypeScript configuration (`tsconfig.json`, `@types/*`)
  - ❌ NO type declarations or interfaces
- **File Extensions**: `.js` and `.jsx` only

---

## 2. Frontend Stack

- **Framework / Build Tool**: Vite (React, JavaScript)
- **Library**: React 18
- **Routing**: React Router
- **Templating / Syntax**: JSX
- **Styling**: Vanilla CSS / Modular CSS (consistent design tokens)
- **HTTP / API Client**: Shared centralized API client (`frontend/lib/api/apiClient.js`)

---

## 3. Backend Stack

- **Runtime**: Node.js
- **Server Framework**: Express.js
- **Architecture**: Modular Layered Architecture (Routes → Controllers → Services → Repositories / Validators)
- **Communication**: RESTful JSON APIs

---

## 4. Database Stack

- **Database Engine**: PostgreSQL
- **Query / Access**: SQL (No Prisma, No MongoDB)

---

## 5. Architectural Integrity Principles

1. **Single Source of Truth**: All modules communicate via shared database models and clear API contracts.
2. **No Duplicate Systems**: P1, P2, and P3 share a single database and backend without parallel redundant models.
3. **Consistent Dependencies**: Team members must not introduce external libraries or alternative frameworks without prior team consensus.
