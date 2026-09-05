# Git Workflow & Team Collaboration Rules

To guarantee smooth collaboration across P1, P2, and P3 without merge collisions or broken contracts, all developers must adhere to these branching and pull request standards.

---

## 1. Branch Hierarchy

```
main (Production / Stable Release)
  ↑
develop (Shared Integration Branch)
  ↑
  ├── feature/core-hr          (P1 Work)
  ├── feature/hr-operations    (P2 Work)
  └── feature/payroll          (P3 Work)
```

- **`main`**: Represents the stable, fully-tested release. Never commit or push directly to `main`.
- **`develop`**: The primary integration branch where tested features meet.
- **`feature/*`**: Dedicated branches for each module owner. Sub-branches (e.g., `feature/core-hr-employees`) are encouraged for isolated tasks.

---

## 2. Core Git Rules

1. **Never directly develop on `main`**: All work must originate on a feature branch.
2. **Feature branches branch off `develop`**: Always keep your feature branch rebased or merged with latest `develop`.
3. **Pull Request (PR) into `develop`**: Never merge without creating a Pull Request.
4. **Code Review Before Merge**: At least one other teammate must review and approve PRs before merging into `develop`.
5. **Respect Module Ownership**: Do not touch or modify another person's module files unnecessarily.
6. **No Silent API Changes**: Never change shared endpoints, request payloads, or response bodies without notifying the affected module owner first.
7. **No Component Duplication**: Before building a UI element, check `components/ui/` and `components/feedback/`. Extend shared components instead of duplicating them.

---

## 3. Protected Shared Areas (Communication Required)

You must communicate and align with the entire team before modifying any of the following:

- `package.json` (frontend or backend dependencies)
- Prisma schema (`prisma/schema.prisma` or migration files)
- Authentication logic and middleware (`backend/src/middleware/` & `frontend/lib/auth/`)
- Global layout and navigation (`components/layout/` & `components/navigation/`)
- Shared UI design tokens or base components (`components/ui/`)
- Global API client (`frontend/lib/api/apiClient.js`)
- Root environment templates (`.env.example`)

---

## 4. Commit Message Convention

Format commit messages with clear prefixes:

- `feat(p1-employees): add employee listing view`
- `feat(p2-attendance): implement check-in service`
- `feat(p3-payroll): add payrun calculation logic`
- `fix(shared-ui): correct modal backdrop dismiss`
- `docs(api): update payrun contract specification`
